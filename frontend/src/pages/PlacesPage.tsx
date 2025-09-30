import React, { useState } from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Modal,
  ModalVariant,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { MapIcon } from '@patternfly/react-icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { usePlaces, useLocationPhotos } from '../hooks/usePlaces';
import { photosAPI } from '../services/api';
import { Place } from '../types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ place, isOpen, onClose }) => {
  const { locationData, loading } = useLocationPhotos(place?.latitude, place?.longitude);

  if (!place) return null;

  return (
    <Modal
      variant={ModalVariant.large}
      title={`Photos at ${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`}
      isOpen={isOpen}
      onClose={onClose}
      hasNoBodyWrapper
    >
      <div style={{ padding: '1.5rem' }}>
        <TextContent style={{ marginBottom: '1rem' }}>
          <Text component="p">
            {place.photoCount} photos from {place.eventCount} events: {place.events.join(', ')}
          </Text>
        </TextContent>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
          </div>
        ) : locationData ? (
          <Gallery hasGutter minWidths={{ default: '200px' }} maxWidths={{ default: '250px' }}>
            {locationData.photos.map((photo) => (
              <GalleryItem key={photo.id}>
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    <img
                      src={photosAPI.getThumbnailUrl(photo.id)}
                      alt={photo.originalName}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                    <div style={{ padding: '0.5rem' }}>
                      <Text component="small" style={{ fontSize: '0.8rem' }}>
                        {photo.eventName}
                      </Text>
                      {photo.dateTime && (
                        <Text component="small" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--pf-v5-global--Color--200)' }}>
                          {new Date(photo.dateTime).toLocaleDateString()}
                        </Text>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        ) : null}
      </div>
    </Modal>
  );
};

export const PlacesPage: React.FC = () => {
  const { places, loading, error } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  };

  if (loading) {
    return (
      <Page>
        <PageSection>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Spinner size="xl" />
            <Text component="p" style={{ marginTop: '1rem' }}>
              Loading places...
            </Text>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={MapIcon} />
            <Title headingLevel="h4" size="lg">
              Error loading places
            </Title>
            <EmptyStateBody>
              {error}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  if (!places || places.places.length === 0) {
    return (
      <Page>
        <PageSection variant={PageSectionVariants.light}>
          <TextContent>
            <Text component="h2">Places</Text>
            <Text component="p">Explore the locations where your photos were taken</Text>
          </TextContent>
        </PageSection>
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={MapIcon} />
            <Title headingLevel="h4" size="lg">
              No places found
            </Title>
            <EmptyStateBody>
              No photos with GPS location data were found. Upload photos with location information to see them on the map.
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <TextContent>
              <Text component="h2">Places</Text>
              <Text component="p">
                {places.totalPhotosWithLocation} photos with location data across {places.totalPlaces} places
              </Text>
            </TextContent>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection style={{ height: 'calc(100vh - 200px)' }}>
        <Card style={{ height: '100%' }}>
          <CardBody style={{ padding: 0, height: '100%' }}>
            <MapContainer
              center={[20, 0]} // Center on world
              zoom={2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {places.places.map((place, index) => (
                <Marker
                  key={index}
                  position={[place.latitude, place.longitude]}
                  eventHandlers={{
                    click: () => handleMarkerClick(place),
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{place.photoCount} photos</strong>
                      <br />
                      {place.eventCount} events: {place.events.join(', ')}
                      <br />
                      <small>Click marker to view photos</small>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardBody>
        </Card>
      </PageSection>

      <LocationModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </Page>
  );
};
