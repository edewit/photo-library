import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet using CDN URLs
const defaultIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  altitude?: number;
  photoName: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  altitude,
  photoName
}) => {
  // Set the default icon for all markers
  useEffect(() => {
    // This fixes the marker icon issue in production builds
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  const position: [number, number] = [latitude, longitude];

  return (
    <div style={{ height: '200px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={defaultIcon}>
          <Popup>
            <div>
              <strong>{photoName}</strong>
              <br />
              Lat: {latitude.toFixed(6)}
              <br />
              Lng: {longitude.toFixed(6)}
              {altitude && (
                <>
                  <br />
                  Alt: {altitude.toFixed(1)}m
                </>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
