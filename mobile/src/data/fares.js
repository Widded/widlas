/**
 * Edirne ETUS Toplu Taşıma Ücret Tarifesi (2026)
 * Tek bir merkezden yönetilen ücret konfigürasyonu
 */

export const FARES = {
  ogrenci: {
    id: 'ogrenci',
    label: 'Öğrenci (Kent Kart)',
    baseFare: 28.50,
    transferDiscountRatio: 0.5, // Aktarmada %50 indirimli ek biniş
  },
  tam: {
    id: 'tam',
    label: 'Tam (Kent Kart)',
    baseFare: 42.00,
    transferDiscountRatio: 0.5,
  },
  temassiz: {
    id: 'temassiz',
    label: 'Temassız Kart',
    baseFare: 53.00,
    transferDiscountRatio: 0.5,
  }
};

/**
 * Belirli bilet türü ve aktarma durumuna göre toplam ücreti hesaplar
 * @param {'ogrenci' | 'tam' | 'temassiz'} type 
 * @param {boolean} isTransfer 
 * @returns {number}
 */
export function calculateFare(type = 'tam', isTransfer = false) {
  const fareConfig = FARES[type] || FARES.tam;
  if (!isTransfer) {
    return fareConfig.baseFare;
  }
  return fareConfig.baseFare + (fareConfig.baseFare * fareConfig.transferDiscountRatio);
}

/**
 * Formatlanmış TL metni döner
 */
export function formatFare(amount) {
  return `${amount.toFixed(2)} ₺`;
}
