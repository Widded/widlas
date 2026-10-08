import React, { useState } from 'react';
import { etusLines, allStopsDB } from '../data/db';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

export default function LineExplorer({ activeLineCode, setActiveLineCode, activeLineDirIdx, setActiveLineDirIdx }) {
  const lines = Object.values(etusLines).sort((a, b) => {
    const getNum = (c) => parseInt(c) || 0;
    return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
  });

  return (
    <div className="line-explorer animate-in">
      <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '20px' }}>Tüm Hatlar</h2>
      {lines.map((line) => {
        const isActive = activeLineCode === line.code;
        return (
          <div 
            key={line.code} 
            className="premium-card" 
            style={{ 
               border: isActive ? `2px solid ${line.color}` : '1px solid var(--border-color)',
               background: isActive ? 'var(--surface-hover)' : 'var(--surface)',
               marginBottom: '12px',
               padding: 0,
               overflow: 'hidden',
               cursor: 'pointer',
               transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveLineCode(isActive ? null : line.code)}
          >
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ 
                 background: line.color, 
                 color: '#fff', 
                 fontSize: '1.3rem', 
                 fontWeight: 800, 
                 padding: '8px 16px', 
                 borderRadius: '8px',
                 boxShadow: `0 4px 12px ${line.color}40`,
                 flexShrink: 0
               }}>
                 {line.code}
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {line.directions?.[0]?.headSign?.split(' - ')[0] || 'Hat Detayı'}
                 </div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {line.directions?.[0]?.headSign || ''}
                 </div>
               </div>
               <div>
                 {isActive ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
               </div>
            </div>

            {isActive && (
              <div className="animate-in" style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '16px' }}>
                 {/* Yön Değiştir Butonu */}
                 {line.directions.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Güzergah Yönü</span>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setActiveLineDirIdx(prev => (prev === 0 ? 1 : 0));
                         }}
                         className="action-pill"
                         style={{ 
                           background: 'var(--primary-light)', 
                           border: 'none', 
                           color: 'var(--text-main)', 
                           padding: '6px 12px', 
                           borderRadius: '20px', 
                           display: 'flex', 
                           alignItems: 'center', 
                           gap: '6px', 
                           cursor: 'pointer',
                           fontSize: '0.85rem',
                           fontWeight: 600,
                           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                         }}
                       >
                         <ArrowUpDown size={14} color="var(--primary)" /> Çevir
                       </button>
                    </div>
                 )}

                 {/* Sadece Aktif Yönü Göster */}
                 {line.directions[activeLineDirIdx] && (() => {
                    const dir = line.directions[activeLineDirIdx];
                    return (
                      <div className="animate-in fade-in slide-in-from-top-2" key={`dir_${activeLineDirIdx}`}>
                         <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: line.color, boxShadow: `0 0 8px ${line.color}` }}></span>
                            Yön: {dir.headSign}
                         </div>
                         <div style={{ 
                            marginLeft: '4px', 
                            borderLeft: `3px solid ${line.color}40`, 
                            paddingLeft: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '16px',
                            position: 'relative'
                         }}>
                            {dir.stopIds.map((sid, j) => {
                               const stop = allStopsDB[sid];
                               if (!stop) return null;
                               return (
                                 <div key={j} style={{ position: 'relative', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ 
                                      position: 'absolute', 
                                      left: '-26.5px', 
                                      top: '50%',
                                      transform: 'translateY(-50%)', 
                                      width: '10px', 
                                      height: '10px', 
                                      borderRadius: '50%', 
                                      background: 'var(--surface)', 
                                      border: `2.5px solid ${line.color}`,
                                      zIndex: 2
                                   }}></div>
                                   <span style={{ color: 'var(--text-main)', fontWeight: 500, flex: 1 }}>{stop.name}</span>
                                 </div>
                               )
                            })}
                         </div>
                      </div>
                    );
                 })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
