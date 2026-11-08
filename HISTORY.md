# 30 Günlük Canlı Veri Geçmişi

Uygulama, canlı otobüs konumlarını **30 gün** saklayacak şekilde yapılandırıldı.

## Nasıl çalışır?

1. **Cihazda (her zaman):**
   - `IndexedDB` veritabanı: `etus-history`
   - Hat + yön başına en fazla 5 dakikada bir snapshot
   - 30 günden eski kayıtlar günde bir kez otomatik silinir
   - Ücretsizdir, sunucu gerektirmez.

2. **Sunucuda (opsiyonel, tüm kullanıcılar için ortak geçmiş):**
   - `api/history.js` Vercel KV / Upstash Redis'e yazar.
   - Depolama bağlı değilse sessizce devre dışı kalır.
   - `hist:line:<hat>:<yön>` sorted set, score = zaman damgası
   - 30 günden eski kayıtlar her yazımda silinir; anahtara 31 gün TTL konur.

## Sunucu deposunu açmak

Vercel panelinde:

1. **Storage → Create Database → KV / Upstash Redis**
2. Projeye bağla.
3. Aşağıdaki ortam değişkenlerinden biri otomatik gelir:
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - veya `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
4. Yeniden deploy et.

## API

- `POST /api/history`
  ```json
  {
    "line": "7E",
    "direction": "1",
    "snapshot": {
      "t": 1794137348758,
      "buses": [
        { "id": "23237", "lat": 41.66, "lng": 26.58, "bearing": 129 }
      ]
    }
  }
  ```
- `GET /api/history?line=7E&direction=1&days=30`
  - Son 30 günün snapshot'larını döner (en fazla 5000 kayıt).

## Boyut / maliyet

- 5 dakikada bir, ~50 otobüs, günde ~18 saat:
  - Yaklaşık **2–3 MB/gün**, **60–90 MB/ay**
- Upstash/Vercel KV ücretsiz katmanı genelde 256 MB:
  - 30 günlük veri rahat sığar.
- Yerel IndexedDB kullanıcı cihazında tutulur; sunucu maliyeti yoktur.

## Gizlilik

- Plaka kaydedilmez; yalnızca `busId`, konum, yön ve zaman tutulur.
- Sunucu geçmişi için Kentkart / Edirne Belediyesi veri izni konusu ayrıca değerlendirilmelidir.
