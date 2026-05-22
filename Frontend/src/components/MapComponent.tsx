import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number };
  markerPosition?: { lat: number; lng: number };
  height?: string;
}

// Fix Leaflet icon issues
// This is needed because Leaflet's default icon paths are not properly resolved in React

// Default center (Kathmandu, Nepal)
const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240
};

// Map click handler component
const MapClickHandler: React.FC<{ onLocationSelect: (location: { lat: number; lng: number }) => void }> = ({ onLocationSelect }) => {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    },
  });
  
  return null;
};

// Component to fix size rendering issues in hidden containers (e.g. Modals)
const MapResizer: React.FC = () => {
  const map = useMapEvents({});
  
  useEffect(() => {
    const container = map.getContainer();
    if (typeof ResizeObserver !== 'undefined' && container) {
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  onLocationSelect, 
  initialCenter = defaultCenter,
  markerPosition,
  height = '300px'
}) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(markerPosition || null);
  
  // Fix Leaflet icon issues
  useEffect(() => {
    // Fix Leaflet's default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setMarker(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div style={{ width: '100%', height }}>
      <MapContainer 
        center={markerPosition ? [markerPosition.lat, markerPosition.lng] : [initialCenter.lat, initialCenter.lng]} 
        zoom={markerPosition ? 15 : 13} 
        style={{ height, width: '100%', borderRadius: '4px' }}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onLocationSelect && (
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        )}
        {marker && (
          <Marker position={[marker.lat, marker.lng]} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
