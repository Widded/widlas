import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';

// HTML Leaflet template that uses 100% Web Google Maps tiles and custom HTML/SVG markers (ZERO Apple Maps artifacts)
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #090B0F;
      overflow: hidden;
      -webkit-user-select: none;
      user-select: none;
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }

    /* Custom Stop Badge with Direction Arrow */
    .stop-badge {
      width: 26px;
      height: 26px;
      border-radius: 13px;
      background-color: #0F1626;
      border: 2.2px solid #3B82F6;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      cursor: pointer;
    }

    /* Start Boarding Stop Badge (Green) */
    .start-stop-badge {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      background-color: #10B981;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
    }

    /* Transfer Stop Badge (Amber) */
    .transfer-stop-badge {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      background-color: #F59E0B;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
    }

    /* End Alighting Stop Badge (Red) */
    .end-stop-badge {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      background-color: #EF4444;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
    }

    /* Custom Teardrop Pin (Start/End Location) */
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: -34px;
      margin-left: -15px;
      width: 30px;
    }
    .pin-bubble {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.45);
    }
    .pin-arrow {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #EF4444;
      margin-top: -1px;
    }

    /* Custom User Location Puck */
    .user-puck-container {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .user-puck-pulse {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background-color: rgba(56, 189, 248, 0.28);
      border: 1px solid rgba(56, 189, 248, 0.5);
      animation: pulse 2s infinite ease-out;
    }
    .user-puck-dot {
      width: 13px;
      height: 13px;
      border-radius: 6.5px;
      background-color: #0284C7;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      z-index: 2;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 0.3; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    /* Leaflet Popups (Dark Theme) */
    .leaflet-popup-content-wrapper {
      background-color: #121620 !important;
      color: #FFFFFF !important;
      border: 1px solid #1E2538 !important;
      border-radius: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      padding: 4px 6px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
    }
    .leaflet-popup-tip {
      background-color: #121620 !important;
      border: 1px solid #1E2538 !important;
    }
    .leaflet-popup-content {
      margin: 8px 10px !important;
      line-height: 1.4 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let map = null;
    let currentTileLayer = null;
    let markersLayer = null;
    let linesLayer = null;
    let currentMapType = 'Standart';

    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        center: [41.6771, 26.5557],
        zoom: 14
      });

      markersLayer = L.layerGroup().addTo(map);
      linesLayer = L.layerGroup().addTo(map);

      updateTiles('Standart');

      // Tapping and Long-press detection
      let pressTimer = null;
      let isLongPress = false;

      map.on('mousedown touchstart', function(e) {
        isLongPress = false;
        const latlng = e.latlng;
        pressTimer = setTimeout(function() {
          isLongPress = true;
          if (window.ReactNativeWebView && latlng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'longpress',
              latitude: latlng.lat,
              longitude: latlng.lng
            }));
          }
        }, 550);
      });

      map.on('mouseup touchend dragstart', function() {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });

      map.on('click', function(e) {
        if (!isLongPress && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'click',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        }
      });

      window.__mapReady = true;
    }

    function updateTiles(type) {
      if (!map) return;
      const url = type === 'Uydu'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
      }
      currentTileLayer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);
      currentMapType = type;
    }

    // Helper: Calculate bearing
    function getBearing(lat1, lon1, lat2, lon2) {
      if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
      const dLat1 = (lat1 * Math.PI) / 180;
      const dLat2 = (lat2 * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const y = Math.sin(dLon) * Math.cos(dLat2);
      const x = Math.cos(dLat1) * Math.sin(dLat2) - Math.sin(dLat1) * Math.cos(dLat2) * Math.cos(dLon);
      const brng = (Math.atan2(y, x) * 180) / Math.PI;
      return (brng + 360) % 360;
    }

    // Main update function called from React Native
    window.updateMapData = function(data) {
      if (!map) return;
      if (data.mapType && data.mapType !== currentMapType) {
        updateTiles(data.mapType);
      }

      markersLayer.clearLayers();
      linesLayer.clearLayers();

      const boundsCoords = [];

      // 1. User Location Puck
      if (data.userLocation && data.userLocation.lat && data.userLocation.lon) {
        const uLat = data.userLocation.lat;
        const uLon = data.userLocation.lon;
        const puckHtml = '<div class="user-puck-container"><div class="user-puck-pulse"></div><div class="user-puck-dot"></div></div>';
        const puckIcon = L.divIcon({
          className: '',
          html: puckHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        L.marker([uLat, uLon], { icon: puckIcon, zIndexOffset: 999 }).addTo(markersLayer);
      }

      // 2. Origin Pin (if custom)
      if (data.fromLocation && data.fromLocation.lat && data.fromLocation.lon && data.fromLocation.name !== 'Konumunuz' && data.fromLocation.name !== 'Mevcut Konumunuz') {
        const lat = data.fromLocation.lat;
        const lon = data.fromLocation.lon;
        boundsCoords.push([lat, lon]);
        const pinHtml = '<div class="custom-pin"><div class="pin-bubble" style="background:#0284C7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><div class="pin-arrow" style="border-top-color:#0284C7"></div></div>';
        const pinIcon = L.divIcon({ className: '', html: pinHtml, iconSize: [30, 36], iconAnchor: [15, 36] });
        L.marker([lat, lon], { icon: pinIcon }).bindPopup('<b>Başlangıç:</b><br>' + data.fromLocation.name).addTo(markersLayer);
      }

      // 3. Destination Pin
      if (data.toLocation && data.toLocation.lat && data.toLocation.lon) {
        const lat = data.toLocation.lat;
        const lon = data.toLocation.lon;
        boundsCoords.push([lat, lon]);
        const pinHtml = '<div class="custom-pin"><div class="pin-bubble" style="background:#EF4444"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><div class="pin-arrow" style="border-top-color:#EF4444"></div></div>';
        const pinIcon = L.divIcon({ className: '', html: pinHtml, iconSize: [30, 36], iconAnchor: [15, 36] });
        L.marker([lat, lon], { icon: pinIcon }).bindPopup('<b>Varış Noktası:</b><br>' + data.toLocation.name).addTo(markersLayer);
      }

      // 4. Walking Polylines
      if (data.walkingPathStart && data.walkingPathStart.length > 1) {
        const pts = data.walkingPathStart.map(p => [p.latitude, p.longitude]);
        pts.forEach(p => boundsCoords.push(p));
        L.polyline(pts, { color: '#38BDF8', weight: 3.5, dashArray: '6, 6' }).addTo(linesLayer);
      }
      if (data.walkingPathEnd && data.walkingPathEnd.length > 1) {
        const pts = data.walkingPathEnd.map(p => [p.latitude, p.longitude]);
        pts.forEach(p => boundsCoords.push(p));
        L.polyline(pts, { color: '#38BDF8', weight: 3.5, dashArray: '6, 6' }).addTo(linesLayer);
      }

      // 5. Active Route Mode
      if (data.activeRoute) {
        const route = data.activeRoute;

        // Transit Polylines
        if (route.isTransfer) {
          const geom1 = data.roadSnappedBusPath1 || route.routeGeometry1 || [];
          if (geom1.length > 1) {
            geom1.forEach(p => boundsCoords.push([p[0], p[1]]));
            L.polyline(geom1, { color: 'rgba(15, 23, 42, 0.7)', weight: 7 }).addTo(linesLayer);
            L.polyline(geom1, { color: route.color || '#3B82F6', weight: 4.5 }).addTo(linesLayer);
          }
          const geom2 = data.roadSnappedBusPath2 || route.routeGeometry2 || [];
          if (geom2.length > 1) {
            geom2.forEach(p => boundsCoords.push([p[0], p[1]]));
            L.polyline(geom2, { color: 'rgba(15, 23, 42, 0.7)', weight: 7 }).addTo(linesLayer);
            L.polyline(geom2, { color: route.color2 || '#F59E0B', weight: 4.5 }).addTo(linesLayer);
          }
        } else {
          const geom = data.roadSnappedBusPath || route.routeGeometry || [];
          if (geom.length > 1) {
            geom.forEach(p => boundsCoords.push([p[0], p[1]]));
            L.polyline(geom, { color: 'rgba(15, 23, 42, 0.7)', weight: 7 }).addTo(linesLayer);
            L.polyline(geom, { color: route.color || '#3B82F6', weight: 4.5 }).addTo(linesLayer);
          }
        }

        // Render Stops on Route
        if (!route.isTransfer) {
          const directStops = data.directStops || [];
          directStops.forEach((stop, idx) => {
            if (!stop || !stop.lat || !stop.lon) return;
            boundsCoords.push([stop.lat, stop.lon]);

            if (idx === 0) {
              // Biniş Durağı (Start)
              const iconHtml = '<div class="start-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><circle cx="15" cy="18" r="2"></circle></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>Biniş:</b> ' + stop.name).addTo(markersLayer);
            } else if (idx === directStops.length - 1) {
              // İniş Durağı (End)
              const iconHtml = '<div class="end-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>İniş:</b> ' + stop.name).addTo(markersLayer);
            } else {
              // Prominent Intermediate Stop with Direction Arrow
              const nextStop = directStops[idx + 1];
              const prevStop = directStops[idx - 1];
              const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
              const iconHtml = '<div class="stop-badge" style="border-color:' + (route.color || '#3B82F6') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(' + bearing + 'deg)"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>' + stop.name + '</b><br><span style="color:#94a3b8">Durak #' + idx + '</span>').addTo(markersLayer);
            }
          });
        } else {
          // Transfer Route Stops
          const leg1 = data.transferLeg1 || [];
          leg1.forEach((stop, idx) => {
            if (!stop || !stop.lat || !stop.lon) return;
            boundsCoords.push([stop.lat, stop.lon]);

            if (idx === 0) {
              const iconHtml = '<div class="start-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><circle cx="15" cy="18" r="2"></circle></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>1. Biniş:</b> ' + stop.name).addTo(markersLayer);
            } else if (idx === leg1.length - 1) {
              // Aktarma Durağı
              const iconHtml = '<div class="transfer-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>Aktarma:</b> ' + stop.name).addTo(markersLayer);
            } else {
              const nextStop = leg1[idx + 1];
              const prevStop = leg1[idx - 1];
              const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
              const iconHtml = '<div class="stop-badge" style="border-color:' + (route.color || '#3B82F6') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(' + bearing + 'deg)"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>' + stop.name + '</b>').addTo(markersLayer);
            }
          });

          const leg2 = data.transferLeg2 || [];
          leg2.forEach((stop, idx) => {
            if (!stop || !stop.lat || !stop.lon) return;
            if (idx === 0) return; // Transfer stop already handled in leg1
            boundsCoords.push([stop.lat, stop.lon]);

            if (idx === leg2.length - 1) {
              const iconHtml = '<div class="end-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>İniş:</b> ' + stop.name).addTo(markersLayer);
            } else {
              const nextStop = leg2[idx + 1];
              const prevStop = leg2[idx - 1];
              const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
              const iconHtml = '<div class="stop-badge" style="border-color:' + (route.color2 || '#F59E0B') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(' + bearing + 'deg)"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></div>';
              const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13] });
              L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>' + stop.name + '</b>').addTo(markersLayer);
            }
          });
        }
      }

      // 6. Line Preview Mode
      if (data.activeLineData && data.activeLineDir) {
        const path = data.activeLineDir.path || [];
        if (path.length > 1) {
          path.forEach(p => boundsCoords.push([p[0], p[1]]));
          L.polyline(path, { color: 'rgba(15, 23, 42, 0.7)', weight: 7 }).addTo(linesLayer);
          L.polyline(path, { color: data.activeLineData.color || '#3B82F6', weight: 4.5 }).addTo(linesLayer);
        }

        const lineStops = data.lineStops || [];
        lineStops.forEach((stop, idx) => {
          if (!stop || !stop.lat || !stop.lon) return;
          boundsCoords.push([stop.lat, stop.lon]);
          if (idx === 0) {
            const iconHtml = '<div class="start-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><circle cx="15" cy="18" r="2"></circle></svg></div>';
            const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
            L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>Başlangıç:</b> ' + stop.name).addTo(markersLayer);
          } else if (idx === lineStops.length - 1) {
            const iconHtml = '<div class="end-stop-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
            const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
            L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>Son Durak:</b> ' + stop.name).addTo(markersLayer);
          } else {
            const nextStop = lineStops[idx + 1];
            const prevStop = lineStops[idx - 1];
            const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
            const iconHtml = '<div class="stop-badge" style="border-color:' + (data.activeLineData.color || '#3B82F6') + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(' + bearing + 'deg)"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></div>';
            const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13] });
            L.marker([stop.lat, stop.lon], { icon: icon }).bindPopup('<b>' + stop.name + '</b><br><span style="color:#94a3b8">Durak #' + (idx + 1) + '</span>').addTo(markersLayer);
          }
        });
      }

      // Auto Bounds Fitting or Recenter
      if (boundsCoords.length > 1) {
        map.fitBounds(boundsCoords, {
          paddingTopLeft: [70, 40],
          paddingBottomRight: [70, 220],
          maxZoom: 16,
          animate: true
        });
      } else if (data.recenterTarget && data.recenterTarget.lat && data.recenterTarget.lon) {
        map.setView([data.recenterTarget.lat, data.recenterTarget.lon], 15, { animate: true });
      }
    };

    window.onload = function() {
      initMap();
    };
  </script>
</body>
</html>
`;

export default function NativeMap({
  fromLocation,
  toLocation,
  activeRoute,
  roadSnappedBusPath,
  roadSnappedBusPath1,
  roadSnappedBusPath2,
  activeLineData,
  activeLineDirIdx,
  userLocation,
  walkingPathStart,
  walkingPathEnd,
  onMapPress,
  onMapLongPress,
  style,
  mapType = 'Standart',
  recenterTrigger = 0
}) {
  const webViewRef = useRef(null);
  const isReadyRef = useRef(false);

  // Prepare stops lists
  const directIntermediateStops = activeRoute && !activeRoute.isTransfer
    ? (activeRoute.legs?.[0]?.stops || (activeRoute.passedStopCoords || []).map(c => ({ lat: c[0], lon: c[1], name: c[2] })))
    : [];

  const directStops = activeRoute && !activeRoute.isTransfer
    ? [activeRoute.startStop, ...directIntermediateStops, activeRoute.endStop].filter(s => s?.lat && s?.lon)
    : [];

  const transferLeg1Stops = activeRoute && activeRoute.isTransfer
    ? (activeRoute.legs?.[0]?.stops || [])
    : [];

  const transferLeg1 = activeRoute && activeRoute.isTransfer
    ? [activeRoute.startStop, ...transferLeg1Stops, activeRoute.transferStop].filter(s => s?.lat && s?.lon)
    : [];

  const transferLeg2Stops = activeRoute && activeRoute.isTransfer
    ? (activeRoute.legs?.[1]?.stops || [])
    : [];

  const transferLeg2 = activeRoute && activeRoute.isTransfer
    ? [activeRoute.transferStop, ...transferLeg2Stops, activeRoute.endStop].filter(s => s?.lat && s?.lon)
    : [];

  const activeLineDir = activeLineData?.directions?.[activeLineDirIdx || 0];
  const lineStops = activeLineDir?.stopIds
    ? activeLineDir.stopIds.map(id => allStopsDB[id]).filter(s => s?.lat && s?.lon)
    : [];

  const recenterTarget = userLocation?.lat ? userLocation : fromLocation;

  // Send update to Leaflet map in WebView
  const sendMapUpdate = () => {
    if (!webViewRef.current) return;

    const payload = {
      mapType,
      userLocation,
      fromLocation,
      toLocation,
      walkingPathStart,
      walkingPathEnd,
      activeRoute,
      roadSnappedBusPath,
      roadSnappedBusPath1,
      roadSnappedBusPath2,
      directStops,
      transferLeg1,
      transferLeg2,
      activeLineData,
      activeLineDir,
      lineStops,
      recenterTarget: recenterTrigger > 0 ? recenterTarget : null
    };

    const jsCode = `
      if (window.updateMapData) {
        window.updateMapData(${JSON.stringify(payload)});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(jsCode);
  };

  useEffect(() => {
    sendMapUpdate();
  }, [
    mapType,
    userLocation?.lat,
    userLocation?.lon,
    fromLocation?.lat,
    fromLocation?.lon,
    toLocation?.lat,
    toLocation?.lon,
    activeRoute?.id,
    roadSnappedBusPath?.length,
    roadSnappedBusPath1?.length,
    roadSnappedBusPath2?.length,
    walkingPathStart?.length,
    walkingPathEnd?.length,
    activeLineData?.code,
    activeLineDirIdx,
    recenterTrigger
  ]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'click' && onMapPress) {
        onMapPress({ latitude: data.latitude, longitude: data.longitude });
      } else if (data.type === 'longpress' && onMapLongPress) {
        onMapLongPress({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={styles.webView}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        onLoadEnd={() => {
          isReadyRef.current = true;
          setTimeout(sendMapUpdate, 200);
        }}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: '#090B0F',
  },
  webView: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: '#090B0F',
  },
});
