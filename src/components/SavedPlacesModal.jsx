import React, { useEffect, useState } from 'react';
import { Bookmark, MapPin, Trash2, X } from 'lucide-react';
import { loadSavedPlaces, removeSavedPlace } from '../lib/savedPlaces';

export default function SavedPlacesModal({ isOpen, onClose, onSelectPlace }) {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Modal her açıldığında localStorage'daki güncel listeyi yükle.
      // oxlint-disable-next-line react/set-state-in-effect
      setPlaces(loadSavedPlaces());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id) => {
    setPlaces(removeSavedPlace(id));
  };

  return (
    <div className="lines-modal-backdrop" onClick={onClose}>
      <div className="lines-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="lines-modal-header">
          <div className="lines-modal-title">
            <Bookmark size={18} className="text-primary" />
            <span>Kaydedilenler</span>
            {places.length > 0 && <span className="lines-count-tag">{places.length}</span>}
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="saved-places-list">
          {places.length === 0 ? (
            <div className="saved-empty">
              <div className="saved-empty-icon">
                <Bookmark size={24} />
              </div>
              <h3>Henüz kaydedilen yer yok</h3>
              <p>
                Bir rota açtıktan sonra hedef adının yanındaki yer imi simgesine dokunarak
                sık kullandığın yerleri buraya kaydedebilirsin.
              </p>
            </div>
          ) : (
            places.map((place) => (
              <div className="saved-place-item" key={place.id}>
                <button
                  className="saved-place-main"
                  onClick={() => {
                    onSelectPlace(place);
                    onClose();
                  }}
                >
                  <span className="saved-place-icon">
                    <MapPin size={16} />
                  </span>
                  <span className="saved-place-text">
                    <b>{place.name}</b>
                    <small>
                      {Number(place.lat).toFixed(4)}, {Number(place.lon).toFixed(4)}
                    </small>
                  </span>
                </button>
                <button
                  className="saved-place-delete"
                  onClick={() => handleDelete(place.id)}
                  title="Kaydı Sil"
                  aria-label={`${place.name} kaydını sil`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
