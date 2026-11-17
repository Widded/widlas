# Durağa Yürüyüş Yönlendirmesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seçilen rotanın biniş durağına uygulama içi canlı yürüyüş rehberi eklemek.

**Architecture:** Yeni bir `WalkGuidance` alt kartı, App'teki `walkGuidance`/`walkFit` durumu ve `MapArea` içindeki tek seferlik `fitBounds` ile çalışır. Mevcut canlı konum, yön ve yürüme çizgisi kullanılır; yeni API veya sesli komut yoktur.

**Tech Stack:** React 19, Vite, Leaflet, lucide-react, mevcut `useLiveLocation` ve `walkingPathStart`.

**Spec:** `docs/superpowers/specs/2026-11-17-durak-yonlendirme-design.md`

## Global Constraints
- Sesli komut, adım adım navigasyon, dış navigasyon (Google/Apple Maps) yok.
- Yeni API, token veya bağımlılık yok.
- `route.startStop`, mevcut `liveLocation`/`heading` ve `walkingPathStart` kullanılır.
- Mobil ve masaüstü aynı akış; rota paneli durumu korunur.
- Varış eşiği **25 m**, yürüme hızı **1.4 m/s**, süre en az **1 dk**.
- Rehber açıkken küçültülmüş rota kapsülü gizlenir; çıkışta geri gelir.

## Review Focus
- Konum izni reddi / GPS kaybı: rehber çökmemeli; “konum alınamadı” veya “konum bekleniyor” göstermeli.
- `heading` yok: ok kuzeye göre bearing göstermeli; `NaN` üretmemeli.
- Başlangıçta 25 m içinde: doğrudan “Duraktasın”.
- Çıkış / rota kapatma: `isFollowing` ve konum izleme durumu eski haline dönmeli; rota kapsülü korunmalı.
- Rehber açılırken `MapAutoFitter` rota fit'i yapıp `WalkFitter`'ın kullanıcı+durak fit'ini ezmemeli.

---

### Task 1: Yürüyüş yardımcı fonksiyonları ve kontrolü

**Files:**
- Create: `src/lib/walkGuidance.js`
- Test: `src/lib/walkGuidance.check.js`

**Interfaces:**
- Produces:
  - `distanceMeters(a: {lat:number,lon:number}, b: {lat:number,lon:number}): number`
  - `bearingDegrees(a: {lat:number,lon:number}, b: {lat:number,lon:number}): number` — 0–360
  - `relativeArrowDegrees(bearing: number, heading: number|null|undefined): number` — heading yoksa bearing
  - `walkingMinutes(meters: number): number` — en az 1
  - `destinationOf(headSign: string): string` — “A - B” → “B”

- [ ] **Step 1: Write the failing check**

```js
// src/lib/walkGuidance.check.js
import assert from 'node:assert/strict';
import {
  distanceMeters,
  bearingDegrees,
  relativeArrowDegrees,
  walkingMinutes,
  destinationOf
} from './walkGuidance.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
near(distanceMeters({ lat: 41.677, lon: 26.555 }, { lat: 41.677, lon: 26.556 }), 83, 10);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }), 0, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }), 90, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: -1, lon: 0 }), 180, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 0, lon: -1 }), 270, 1);
assert.equal(relativeArrowDegrees(90, 0), 90);
assert.equal(relativeArrowDegrees(10, 350), 20);
assert.equal(relativeArrowDegrees(350, 10), 340);
assert.equal(relativeArrowDegrees(123, null), 123);
assert.equal(walkingMinutes(0), 1);
assert.equal(walkingMinutes(84), 1);
assert.equal(walkingMinutes(85), 2);
assert.equal(walkingMinutes(420), 5);
assert.equal(destinationOf('Gazimihal - Otogar'), 'Otogar');
assert.equal(destinationOf('Otogar'), 'Otogar');
console.log('walkGuidance checks passed');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node src/lib/walkGuidance.check.js`  
Expected: FAIL — `Cannot find module .../walkGuidance.js`.

- [ ] **Step 3: Implement `src/lib/walkGuidance.js`**

Haversine distance (Earth radius 6371000 m) and standart initial-bearing formülü. `relativeArrowDegrees` çıktısını `((bearing - heading) % 360 + 360) % 360` ile normalize et; `heading` sonlu değilse bearing döndür. `walkingMinutes` için `Math.max(1, Math.ceil(meters / 1.4 / 60))` kullan.

- [ ] **Step 4: Run it to verify it passes**

Run: `node src/lib/walkGuidance.check.js`  
Expected: `walkGuidance checks passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/walkGuidance.js src/lib/walkGuidance.check.js
git commit -m "Durak yuruyus yardimci fonksiyonlarini ekle"
```

---

### Task 2: WalkGuidance kartı ve stilleri

**Files:**
- Create: `src/components/WalkGuidance.jsx`
- Create: `src/components/WalkGuidance.css`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: default `WalkGuidance` component with props:
  - `stop: { id, name, fullName?, lat, lon }`
  - `lineCode: string`
  - `lineColor: string`
  - `headSign: string`
  - `liveLocation: { lat, lon, heading? } | null`
  - `isWatching: boolean`
  - `onExit: () => void`

- [ ] **Step 1: Create the component skeleton**

`src/components/WalkGuidance.jsx`:
- `lucide-react` importu: `ArrowUp`, `X`.
- `./WalkGuidance.css` importu.
- `stop` yoksa `null` döndür.
- `distance = liveLocation ? distanceMeters(liveLocation, stop) : null`.
- `bearing = liveLocation ? bearingDegrees(liveLocation, stop) : 0`.
- `arrow = relativeArrowDegrees(bearing, liveLocation?.heading)`.
- `minutes = distance != null ? walkingMinutes(distance) : null`.
- `arrived = distance != null && distance <= 25`.
- `dest = destinationOf(headSign)`.
- Render:
  - `.walk-guidance-wrapper`
  - `.walk-guidance` (`is-arrived` sınıfı)
  - `.walk-guidance-arrow` içinde `ArrowUp` ikonu, `style={{ transform: \`rotate(${arrow}deg)\` }}`
  - `.walk-guidance-info`:
    - `.walk-guidance-line`: `.walk-guidance-badge` (lineCode, `lineColor` arka plan) + `.walk-guidance-dest` (`${dest} yönü`)
    - `.walk-guidance-stop`: `stop.fullName || stop.name`
    - `.walk-guidance-meta`: mesafe/süre veya “Duraktasın”
  - `.walk-guidance-exit` → `X` ikonu, `onClick={onExit}`, `aria-label="Vazgeç"`
- Konum yoksa:
  - `isWatching` true → “Konum alınıyor…”
  - `isWatching` false → “Konum alınamadı. İzinleri kontrol et.”
- Mesafe formatı: `>=1000` → `${(m/1000).toFixed(1)} km`, değilse `${Math.round(m)} m`.

- [ ] **Step 2: Add CSS**

`src/components/WalkGuidance.css`:
- Wrapper: `position: fixed; bottom: max(20px, env(safe-area-inset-bottom, 20px)); left: 50%; transform: translateX(-50%); width: min(520px, calc(100% - 32px)); z-index: 1150;`
- Kart: mevcut koyu yüzey, `border: 1px solid var(--border-color)`, `border-radius: 18px`, `box-shadow`, `display: flex`, `align-items: center`, `gap: 12px`, `padding: 12px 14px`.
- Ok dairesi: 40px, yuvarlak, uygun arka plan; `ArrowUp` 18px.
- Hat rozeti: dolu renk, beyaz metin, yuvarlak; hat kodu.
- `is-arrived`: yeşil kenar/arka plan vurgusu.
- Çıkış butonu: 34px dokunma alanı, `background: transparent`, `border: none`.
- Masaüstü `@media (min-width: 900px)`: `bottom: 26px; width: 420px;`.

- [ ] **Step 3: Verify build**

Run: `npm run lint` and `npm run build`  
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/WalkGuidance.jsx src/components/WalkGuidance.css
git commit -m "Durak yuruyus rehber kartini ekle"
```

---

### Task 3: Rota kartı butonu ve App durumu

**Files:**
- Modify: `src/components/RouteResultSheet.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 2 `WalkGuidance`.
- Produces:
  - `RouteResultSheet` yeni props: `onStartWalk?: (route) => void`, `forceMinimized?: boolean`.
  - App state: `walkGuidance: { stop, lineCode, lineColor, headSign } | null`, `walkFit: { from: {lat,lon}, to: {lat,lon} } | null`.
  - App handlers: `handleStartWalk(route)`, `handleExitWalk()`.

- [ ] **Step 1: Add the route button**

`RouteResultSheet.jsx`:
- `lucide-react` importuna `Navigation` ekle.
- Props'a `onStartWalk`, `forceMinimized = false` ekle.
- `forceMinimized` true olduğunda `setMinimized(true)` çalıştıran bir `useEffect` ekle (böylece `onMinimizedChange` de senkron kalır).
- Seçili rota kartında, `route-walk-summary` bloğundan sonra ve `!route.isWalkOnly` iken:
  - `<button type="button" className="route-walk-go-btn" onClick={(e) => { e.stopPropagation(); onStartWalk?.(route); }}>`
  - İçinde `Navigation size={14}` ve `Durağa Git` metni.

`src/index.css` içindeki rota kartı stillerinin yanına `.route-walk-go-btn` ekle: tam genişlik veya içerik genişliği, `min-height: 34px`, yuvarlak, `var(--primary)` arka plan, beyaz metin, ikon + metin hizalı.

- [ ] **Step 2: Add App state and handlers**

`App.jsx`:
- `WalkGuidance` import et.
- State: `walkGuidance`, `walkFit`.
- Ref: `wasWatchingRef` (rehber başlamadan önce konum izleme açık mıydı).
- `handleStartWalk(route)`:
  - `route?.startStop?.lat/lon` yoksa çık.
  - `wasWatchingRef.current = isWatching`.
  - `if (!isWatching) startWatching();`
  - `setWalkGuidance({ stop: route.startStop, lineCode: route.legs?.[0]?.line || route.line1 || route.name || '', lineColor: route.color || '#3B82F6', headSign: route.legs?.[0]?.headSign || route.description || '' });`
  - `setRouteSheetMinimized(true); setIsFollowing(true);`
  - `liveLocation` varsa `setWalkFit({ from: { lat: liveLocation.lat, lon: liveLocation.lon }, to: { lat: route.startStop.lat, lon: route.startStop.lon } });`
- `useEffect`: `walkGuidance` var, `walkFit` yok ve `liveLocation` geldiyse `walkFit` oluştur.
- `clearWalkGuidance()` yardımcı callback'i:
  - `setWalkGuidance(null); setWalkFit(null); setIsFollowing(false);`
  - `if (!wasWatchingRef.current) stopWatching();`
- `handleExitWalk` ve `handleClearRoute` bu temizliği çağırsın (rota kapatılınca rehber de kapansın).

- [ ] **Step 3: Wire the render**

- `RouteResultSheet` çağrısına `onStartWalk={handleStartWalk}` ve `forceMinimized={Boolean(walkGuidance)}` ekle.
- Route sheet'i bir sarmalayıcıya al:
  - `<div className={\`route-sheet-layer${walkGuidance ? ' is-walk-hidden' : ''}\`}> ... </div>`
- `src/index.css`:
  - `.route-sheet-layer { display: contents; }`
  - `.route-sheet-layer.is-walk-hidden { display: none; }`
- `walkGuidance` varsa `<WalkGuidance ... onExit={handleExitWalk} />` render et; `isWatching` prop'unu geçir.
- `<MapArea walkFit={walkFit} ... />` prop'unu ekle (Task 4'te kullanılacak).

- [ ] **Step 4: Verify build**

Run: `npm run lint` and `npm run build`  
Expected: both pass. Manual: rota seç, “Durağa Git” görünür; butona basınca rehber kartı ve harita durumu değişir (Task 4 sonrası tam doğrulama).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/RouteResultSheet.jsx src/index.css
git commit -m "Duraga git butonu ve yuruyus rehber durumunu ekle"
```

---

### Task 4: Haritayı kullanıcı + durağa sığdırma

**Files:**
- Modify: `src/components/MapArea.jsx`
- Modify: `src/App.jsx` (yalnızca `walkFit` prop'u Task 3'te eklendiyse kontrol)

**Interfaces:**
- Consumes: `walkFit: { from: {lat,lon}, to: {lat,lon} } | null`.
- Produces: `WalkFitter` alt bileşeni; `MapArea` `walkFit` prop'u; `MapAutoFitter` rehber modunda rota fit'i yapmaz.

- [ ] **Step 1: Add WalkFitter**

`MapArea.jsx`:
```jsx
function WalkFitter({ walkFit }) {
  const map = useMap();
  useEffect(() => {
    if (!walkFit?.from || !walkFit?.to) return;
    const bounds = L.latLngBounds([
      [walkFit.from.lat, walkFit.from.lon],
      [walkFit.to.lat, walkFit.to.lon]
    ]);
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, {
      paddingTopLeft: [50, 110],
      paddingBottomRight: [50, 250],
      maxZoom: 17,
      animate: true
    });
  }, [walkFit, map]);
  return null;
}
```
- `MapArea` props'una `walkFit = null` ekle.
- `MapContainer` içinde `<WalkFitter walkFit={walkFit} />` render et.

- [ ] **Step 2: Guard MapAutoFitter**

- `MapAutoFitter` props'una `walkFit` ekle.
- Debounce edilen fit fonksiyonunun başında `if (walkFit) return;` koy.
- `walkFit`'i `MapAutoFitter`'a geçir ve dependency listesine ekle.
- Böylece rehber açıkken rota fit'i `WalkFitter`'ı ezmez.

- [ ] **Step 3: Verify build**

Run: `npm run lint` and `npm run build`  
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/MapArea.jsx src/App.jsx
git commit -m "Haritayi yuruyus rehberinde kullanici ve duraga sigdir"
```

---

### Task 5: Uçtan uca doğrulama

**Files:**
- No new files; verify the integrated feature.

- [ ] **Step 1: Automated checks**

Run:
```bash
node src/lib/walkGuidance.check.js
npm run lint
npm run build
```
Expected: `walkGuidance checks passed`, lint clean, build success.

- [ ] **Step 2: Manual — happy path**

1. Bir rota ara, seçili rota kartında **Durağa Git** görünmeli.
2. Butona bas: rota paneli gizlenmeli, harita kullanıcı + biniş durağına sığmalı, altta kart açılmalı.
3. Kartta hat rozeti, durak adı, kalan mesafe, süre ve ok görünmeli.
4. Yürüdükçe mesafe azalmalı; telefon yönü değişince ok dönmeli.
5. 25 m altında kart “Duraktasın” olmalı.
6. **Vazgeç** rota özet kapsülüne dönmeli.

- [ ] **Step 3: Manual — edge cases**

1. Konum iznini reddet: rehber çökmemeli; “konum alınamadı” veya “konum bekleniyor” mesajı görünmeli.
2. Yön/pusula yok (masaüstü): ok `NaN` olmadan durak yönünü göstermeli.
3. Zaten 25 m içinde başla: doğrudan “Duraktasın”.
4. Rehber açıkken rotayı kapat: rehber kapanmalı, harita normal moda dönmeli.
5. Rehber açıkken `MapAutoFitter` haritayı rota fit'ine geri döndürmemeli.

- [ ] **Step 4: Commit any fixes**

```bash
git add src docs
git commit -m "Durak yuruyus rehberi dogrulama duzeltmeleri"
```
