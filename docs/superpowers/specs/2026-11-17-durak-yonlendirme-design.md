# Durağa Yürüyüş Yönlendirmesi — Tasarım

**Tarih:** 2026-11-17  
**Durum:** Onaylandı

## Amaç
Kullanıcı bir rota seçtiğinde, seçilen hattın biniş durağına uygulama içinden canlı yönlendirme. Kullanıcı haritada kendi konumunu, durağı, yürüme çizgisini ve kalan mesafeyi görür; sesli komut veya adım adım navigasyon yoktur.

## Neden
Rota sonuçlarında biniş durağı, yürüme mesafesi ve süresi zaten hesaplanıyor; haritada kesikli yürüme çizgisi de çiziliyor. Ancak kullanıcıyı o durağa aktif olarak götüren bir "Durağa Git" akışı yok. Kullanıcı, seçtiği otobüsün geçtiği en yakın durağa yönlendirilmek istiyor.

## Hedefler
- Seçili rota kartına "Durağa Git" butonu.
- Butona basınca uygulama içi yürüyüş rehberi:
  - Rota paneli küçülür, harita tam ekran olur.
  - Harita kullanıcıyı takip eder; kullanıcı + biniş durağı ekrana sığdırılır.
  - Altta rehber kartı: hat rozeti + yön, durak adı, kalan mesafe, tahmini yürüme süresi, durağa doğru dönen ok.
  - Mesafe 25 m altına inince "Duraktasın" durumu.
  - "Vazgeç" ile rehber kapanır, rota özet kapsülüne dönülür.
- Mobil ve masaüstünde aynı akış.

## Hedef olmayanlar
- Sesli komut, adım adım "sağa/sola dön" talimatı.
- Rota dışına çıkınca yeniden rota hesaplama.
- Google Maps / Apple Maps gibi dış navigasyona yönlendirme.
- Yeni API, token veya bağımlılık.
- Rota hesaplama / en yakın durak seçimi mantığını değiştirmek.

## Yaklaşım
Seçilen: **Uygulama içi canlı yürüyüş modu** (yaklaşım 2).

Değerlendirilen alternatifler:
- **Dış navigasyon:** Tek butonla Google Maps açılır. Hızlı ama uygulamadan çıkar, canlı otobüs bağı kopar.
- **Tam turn-by-turn:** Mapbox adımları, ses, yeniden hesaplama. 300–500 m'lik yürüyüş için gereğinden ağır.
- **Uygulama içi canlı yürüyüş modu:** Mevcut konum, yön, yürüme çizgisi ve rota durağıyla basit ve yeterli. Seçildi.

## Teknik tasarım
- **Tetik:** `RouteResultSheet` içindeki seçili rota kartında, "Binişe X m (Y dk)" satırının yanında "Durağa Git" butonu. Buton `onStartWalk(route)` çağırır.
- **Durum (App):** `walkGuidance = { stop, lineCode, headSign } | null` ve haritanın ilk sığdırması için `walkFit = { from, to } | null`.
- **Başlatma:**
  - Canlı konum yoksa konum izni istenir / `startWatching()` başlatılır.
  - `walkGuidance` doldurulur, rota paneli küçültülür, `isFollowing` açılır.
  - Harita kullanıcı + durak için bir kez `fitBounds` yapar; sonra kullanıcıyı takip eder.
- **Rehber kartı:** Yeni `WalkGuidance` bileşeni.
  - Mesafe: haversine (kullanıcı konumu → `stop`).
  - Süre: mesafe / 1.4 m/s, yukarı yuvarlanır, en az 1 dk.
  - Ok: durak yönü (bearing) − kullanıcı `heading`; `heading` yoksa kuzeye göre bearing.
  - 25 m altında "Duraktasın" ve yeşil durum.
  - "Vazgeç" `onExit` çağırır.
- **Harita:** `MapArea` yeni `walkFit` prop'u ile bir kez kullanıcı + durak aralığına sığdırır. Mevcut `walkingPathStart` çizgisi korunur; yeni çizgi/API eklenmez.
- **Görünürlük:** Rehber açıkken küçültülmüş rota kapsülü gizlenir; `RouteResultSheet` monte kalır (iç durumu korunur). Çıkışta kapsül geri gelir.
- **Temizlik:** Çıkışta `walkGuidance = null`, `walkFit = null`, `isFollowing` kapatılır; rehber için konum izni biz açtıysak `stopWatching()` çağrılır.
- **CSS:** Sabit alt kart, mobilde ekran genişliğine göre, masaüstünde ortalanmış; mevcut tasarım dili ve renk değişkenleri.

## Kenar durumları
- Konum izni yok/reddedildi: rehber açılmaz, uyarı gösterilir.
- `heading` yok: ok kuzeye göre durak yönünü gösterir.
- Kullanıcı zaten 25 m içinde: doğrudan "Duraktasın".
- GPS geçici olarak kaybolursa son mesafe korunur, "konum bekleniyor" durumu gösterilir.
- Rota kapatılırsa rehber de kapanır.

## Doğrulama
- `npm run lint`, `npm run build`.
- Mobil ve masaüstünde manuel:
  - "Durağa Git" rehberi açar, harita kullanıcı + durağa sığar.
  - Yürürken mesafe azalır, ok yönü doğru döner.
  - 25 m altında "Duraktasın" görünür.
  - "Vazgeç" rota özet kapsülüne döner.
- Konum izni reddi ve `heading` yok senaryoları.
