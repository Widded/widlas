# Rota Sonuç Ekranı Yeniden Tasarımı — Tasarım

**Tarih:** 2026-11-17  
**Durum:** Onaylandı (kullanıcı: “en güzelini yap”)

## Amaç
Rota seçilince alttan açılan rota sonuç ekranını sıfırdan, daha sade ve hiyerarşik bir tasarımla yenilemek. Aynı plakanın “Durakta Ne Var?” ve “Otobüs Nerede?” ekranlarında farklı ETA göstermesini düzeltmek.

## Neden
Mevcut kartlarda aynı anda yürüme rozetleri, oklar, hat rozetleri, “Aktarmasız Doğrudan · … biniş”, “Tahmini”, biniş/iniş yürüme çipleri ve “Adımlar” bulunuyor. 6 alternatif üst üste gelince göz yoruyor. Ayrıca iki canlı ekran farklı ETA kaynakları kullanıyor:
- `Durakta Ne Var?`: Kentkart `nearest/bus` → resmi `timeDiff`
- `Otobüs Nerede?`: `pathInfo` konumundan yerel `280 m/dk` hesabı

## Hedefler
- Kompakt kart: hat rozeti(ler), büyük süre, yön/hedef, biniş durağı ve yürüme mesafesi tek bakışta.
- Seçili kart açılır: biniş → (aktarma) → iniş zaman çizgisi, yürüme süreleri, “Durağa Git”.
- “Adımlar” yalnızca isteyene, ikincil bir bağlantı.
- Mobilde alt sheet, masaüstünde sağ panel; aynı kart dili.
- İlk/sunulan en hızlı rota için küçük “En hızlı” etiketi.
- ETA: aynı durak için iki ekran aynı resmi `timeDiff` değerini kullansın; resmi veri yoksa yerel tahmin yalnızca yedek olsun.

## Hedef olmayanlar
- Rota hesaplama algoritmasını değiştirmek.
- Yeni API/token/bağımlılık.
- Sesli komut/turn-by-turn.
- Canlı ekranların genel tasarımını baştan yapmak (yalnızca ETA tutarlılığı).

## Seçilen yaklaşım
**A — Minimal kart + seçilince detay.** Alternatifler:
- B: Her kartta mini timeline → daha bilgilendirici ama kartlar uzun/kalabalık.
- C: Yatay kaydırmalı tek rota → alternatifleri gizler.

## Kart anatomisi
- Sol: hat rozeti; aktarmada iki rozet + küçük ok.
- Orta: büyük süre; altında yön (headSign hedefi) ve biniş durağı / aktarma bilgisi.
- Sağ: binişe yürüme mesafesi (`🚶 692 m` veya “Durakta”) + aç/kapa oku.
- Seçili kart:
  - Biniş satırı: durak + yürüme süresi/mesafesi.
  - Renkli hat çizgisi + hat özeti (aktarmada iki hat).
  - Aktarma satırı (varsa).
  - İniş satırı: durak + hedefe yürüme.
  - “Durağa Git” birincil buton; “Adımları göster” ikincil bağlantı.
- Yürüyüş-only rota: yürüyüş rozeti, süre, mesafe; biniş/iniş yok.
- İlk rota: “En hızlı” etiketi.

## ETA tutarlılığı
- `BusLiveModal` seçili durak için `getNearestBus` çağırır; aynı hat/yön/plaka eşleşen otobüslerde resmi `timeDiff` ve `stopDiff` kullanılır.
- Eşleşmeyen/uzak otobüslerde mevcut yerel projeksiyon yedek kalır.
- `StopLiveModal` değişmez; zaten resmi `timeDiff` kullanıyor.
- Test: aynı plaka/durak için hat ekranı ETA’sı resmi `timeDiff` ile aynı olmalı.

## Kısıtlar
- Mevcut `route` verisi: `name/line1/line2/color/color2`, `startStop/endStop/transferStop`, `walkDistanceStart/End`, `walkStartMins/End`, `totalTime`, `isTransfer`, `isWalkOnly`, `legs`.
- Mevcut `.route-sheet-container` konumlandırması (mobil alt sheet / masaüstü sağ panel) korunur.
- “Durağa Git” yürüyüş rehberi ve rota paneli küçültme davranışı korunur.
- Yeni stiller `rs-*` sınıflarıyla; eski kullanılmayan stiller silinmeden bırakılabilir.

## Kenar durumları
- Uzun durak adları: ellipsis, taşma yok.
- Yürüme mesafesi 0: “Durakta”.
- Aktarma yürümesi 0: satır yine görünür, “Aynı durakta aktarma”.
- Yürüyüş-only: biniş/iniş ve “Durağa Git” yok.
- Seçili kart yoksa ilk rota seçili.

## Doğrulama
- `npm run lint`, `npm run build`.
- Mobil ve masaüstünde görsel kontrol: kartlar, seçili detay, aktarma, yürüyüş-only, uzun adlar.
- Canlı ETA: aynı plaka/durak için iki ekranın süresi eşleşiyor.
- “Durağa Git” ve rota küçültme eski davranışı koruyor.
