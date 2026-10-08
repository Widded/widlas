import React, { useState } from 'react';
import { etusLines, allStopsDB } from '../data/db';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function LineExplorer({ activeLineCode, setActiveLineCode }) {
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
                 {line.directions.map((dir, i) => (
                    <div key={i} style={{ marginBottom: i === 0 ? '24px' : '0' }}>
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
                               <div key={j} style={{ position: 'relative', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                 <div style={{ 
                                    position: 'absolute', 
                                    left: '-26.5px', 
                                    top: '4px', 
                                    width: '10px', 
                                    height: '10px', 
                                    borderRadius: '50%', 
                                    background: 'var(--surface)', 
                                    border: `2.5px solid ${line.color}`,
                                    zIndex: 2
                                 }}></div>
                                 <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{stop.name}</span>
                               </div>
                             )
                          })}
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
