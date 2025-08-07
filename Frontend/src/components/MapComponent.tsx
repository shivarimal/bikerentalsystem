import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number };
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

const MapComponent: React.FC<MapComponentProps> = ({ 
  onLocationSelect, 
  initialCenter = defaultCenter,
  height = '300px'
}) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Fix Leaflet icon issues
  useEffect(() => {
    // Fix Leaflet's default icon
    delete L.Icon.Default.prototype._getIconUrl;
    
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
        center={[initialCenter.lat, initialCenter.lng]} 
        zoom={13} 
        style={{ height, width: '100%', borderRadius: '4px' }}
        ref={mapRef}
      >
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
