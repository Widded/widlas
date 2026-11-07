import React from 'react';
import { Bus, CreditCard, Bookmark, ChevronRight, X, Radio, MapPin } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'buslive', title: 'Otobüs Nerede?', desc: 'Canlı otobüs konumu ve kalan süre', icon: Radio, action: 'onOpenBusLive' },
  { id: 'stoplive', title: 'Durakta Ne Var?', desc: 'Durağa yaklaşan tüm hatlar', icon: MapPin, action: 'onOpenStopLive' },
  { id: 'lines', title: 'Hatlar', desc: 'Tüm ETUS hatları', icon: Bus, action: 'onOpenLines' },
  { id: 'fares', title: 'Tarife', desc: 'Bilet ve abonman ücretleri', icon: CreditCard, action: 'onOpenFares' },
  { id: 'saved', title: 'Kaydedilenler', desc: 'Sık kullandığın yerler', icon: Bookmark, action: 'onOpenSaved' }
];

export default function HomeMenuModal({ isOpen, onClose, onOpenLines, onOpenFares, onOpenSaved, onOpenBusLive, onOpenStopLive }) {
  if (!isOpen) return null;

  const handlers = { onOpenLines, onOpenFares, onOpenSaved, onOpenBusLive, onOpenStopLive };

  return (
    <div className="home-menu-backdrop" onClick={onClose}>
      <div className="home-menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="home-menu-header">
          <span>Menü</span>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="home-menu-list">
          {MENU_ITEMS.map(({ id, title, desc, icon: Icon, action }) => (
            <button
              type="button"
              key={id}
              className="home-menu-item"
              onClick={() => {
                onClose();
                handlers[action]?.();
              }}
            >
              <span className="home-menu-icon">
                <Icon size={18} />
              </span>
              <span className="home-menu-text">
                <b>{title}</b>
                <small>{desc}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
