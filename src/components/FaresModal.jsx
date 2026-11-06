import React from 'react';
import {
  CreditCard,
  X,
  CheckCircle,
  Info
} from 'lucide-react';
import { FARES, formatFare } from '../data/fares';

export default function FaresModal({
  isOpen,
  onClose,
  fareType = 'ogrenci',
  onSelectFareType
}) {
  if (!isOpen) return null;

  return (
    <div className="fares-modal-backdrop" onClick={onClose}>
      <div className="fares-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Grabber */}
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        {/* Header */}
        <div className="fares-modal-header">
          <div className="fares-modal-title">
            <CreditCard size={20} className="text-amber" />
            <span>ETUS Güncel Tarife Bilgileri</span>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Active Preference Switcher */}
        <div className="fares-preference-card">
          <span className="fares-pref-label">Hesaplama İçin Varsayılan Tarifeniz:</span>
          <div className="fares-pref-toggle">
            <button
              className={`fares-pref-btn ${fareType === 'ogrenci' ? 'active' : ''}`}
              onClick={() => onSelectFareType('ogrenci')}
            >
              <span>Öğrenci ({formatFare(FARES.ogrenci.baseFare)})</span>
              {fareType === 'ogrenci' && <CheckCircle size={15} />}
            </button>
            <button
              className={`fares-pref-btn ${fareType === 'tam' ? 'active' : ''}`}
              onClick={() => onSelectFareType('tam')}
            >
              <span>Tam ({formatFare(FARES.tam.baseFare)})</span>
              {fareType === 'tam' && <CheckCircle size={15} />}
            </button>
          </div>
        </div>

        {/* Tariffs Cards Grid */}
        <div className="fares-cards-grid">
          {/* Card 1: Öğrenci */}
          <div className={`fare-tariff-card ${fareType === 'ogrenci' ? 'featured' : ''}`}>
            <div className="tariff-card-top">
              <span className="tariff-card-badge ogrenci-badge">İndirimli Bilet</span>
              <span className="tariff-card-price">{formatFare(FARES.ogrenci.baseFare)}</span>
            </div>
            <h4 className="tariff-card-name">Öğrenci Kent Kart</h4>
            <p className="tariff-card-desc">İlköğretim, lise ve Trakya Üniversitesi öğrencileri için geçerlidir.</p>
          </div>

          {/* Card 2: Tam */}
          <div className={`fare-tariff-card ${fareType === 'tam' ? 'featured' : ''}`}>
            <div className="tariff-card-top">
              <span className="tariff-card-badge tam-badge">Standart</span>
              <span className="tariff-card-price">{formatFare(FARES.tam.baseFare)}</span>
            </div>
            <h4 className="tariff-card-name">Tam Kent Kart</h4>
            <p className="tariff-card-desc">Tüm sivil yolcular için kişiselleştirilmiş veya anonim Kent Kart tarifesidir.</p>
          </div>

          {/* Card 3: Aktarma */}
          <div className="fare-tariff-card">
            <div className="tariff-card-top">
              <span className="tariff-card-badge transfer-badge">İndirimli Aktarma</span>
              <span className="tariff-card-price">%50 İndirim</span>
            </div>
            <h4 className="tariff-card-name">45 Dakika İçi Aktarma</h4>
            <p className="tariff-card-desc">İlk binişten sonraki 45 dakika içinde farklı bir hatta binişlerde yarı fiyat uygulanır.</p>
          </div>

          {/* Card 4: Temassız Kredi Kartı */}
          <div className="fare-tariff-card">
            <div className="tariff-card-top">
              <span className="tariff-card-badge contactless-badge">Kartsız / Temassız</span>
              <span className="tariff-card-price">{formatFare(FARES.temassiz.baseFare)}</span>
            </div>
            <h4 className="tariff-card-name">Temassız Banka/Kredi Kartı</h4>
            <p className="tariff-card-desc">Kent Kart olmadan tüm banka ve kredi kartlarının temassız özelliğiyle biniş yapılabilir.</p>
          </div>
        </div>

        {/* Rules & Notes */}
        <div className="fares-info-note">
          <Info size={16} className="text-sky flex-shrink-0" />
          <div className="fares-info-text">
            <span>
              <b>Aktarma Kuralı:</b> İlk biniş anından itibaren 45 dakika içinde aktarma hakkı mevcuttur. Aynı hat ve aynı araçta aktarma geçerli değildir.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
