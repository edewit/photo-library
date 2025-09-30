import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Alert,
  Spinner,
  Button,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { AngleLeftIcon, AngleRightIcon } from '@patternfly/react-icons';
import { PhotoViewer } from '../components/PhotoViewer';
import { Photo } from '../types';
import { photosAPI, eventsAPI } from '../services/api';
import { usePhotoPreloader } from '../hooks/usePhotoPreloader';

export const PhotoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [eventPhotos, setEventPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotoAndEventData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch the current photo
        const photoData = await photosAPI.getById(id);
        setPhoto(photoData);
        
        // If we have an eventId or can get it from the photo, fetch all photos in the event
        const targetEventId = eventId || photoData.eventId;
        if (targetEventId) {
          const eventPhotosData = await eventsAPI.getPhotos(targetEventId);
          setEventPhotos(eventPhotosData);
          
          // Find current photo index in the event photos
          const index = eventPhotosData.findIndex(p => p.id === id);
          setCurrentIndex(index);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load photo');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoAndEventData();
  }, [id, eventId]);

  // Navigation functions
  const goToPrevious = () => {
    if (currentIndex > 0 && eventPhotos.length > 0) {
      const prevPhoto = eventPhotos[currentIndex - 1];
      navigate(`/photos/${prevPhoto.id}${eventId ? `?eventId=${eventId}` : ''}`);
    }
  };

  const goToNext = () => {
    if (currentIndex < eventPhotos.length - 1 && eventPhotos.length > 0) {
      const nextPhoto = eventPhotos[currentIndex + 1];
      navigate(`/photos/${nextPhoto.id}${eventId ? `?eventId=${eventId}` : ''}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (eventId) {
          navigate(`/events/${eventId}`);
        } else {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, eventPhotos, eventId, navigate]);

  // Preload adjacent photos for smoother navigation
  const { isPreloaded, preloadedCount, isLoading } = usePhotoPreloader({
    photos: eventPhotos,
    currentIndex,
    preloadCount: 2 // Preload 2 photos ahead and behind
  });

  // Helper variables
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < eventPhotos.length - 1 && eventPhotos.length > 0;
  const showNavigation = eventPhotos.length > 1;

  if (loading) {
    return (
      <Page>
        <PageSection variant={PageSectionVariants.light}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <div style={{ marginTop: '1rem' }}>Loading photo...</div>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (error || !photo) {
    return (
      <Page>
        <PageSection variant={PageSectionVariants.light}>
          <Alert variant="danger" title="Error">
            {error || 'Photo not found'}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection>
        {showNavigation && (
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} className="pf-u-mb-md">
            <FlexItem>
              <Button
                variant="secondary"
                icon={<AngleLeftIcon />}
                onClick={goToPrevious}
                isDisabled={!hasPrevious}
                title={hasPrevious && eventPhotos[currentIndex - 1] 
                  ? `${isPreloaded(eventPhotos[currentIndex - 1].id) ? '✓ Ready' : 'Loading...'} - ${eventPhotos[currentIndex - 1].originalName}`
                  : 'No previous photo'
                }
              >
                Previous
              </Button>
            </FlexItem>
            <FlexItem>
              <div style={{ textAlign: 'center', color: '#6a6e73' }}>
                {currentIndex + 1} of {eventPhotos.length}
                {isLoading && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                    Preloading...
                  </div>
                )}
              </div>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<AngleRightIcon />}
                iconPosition="end"
                onClick={goToNext}
                isDisabled={!hasNext}
                title={hasNext && eventPhotos[currentIndex + 1] 
                  ? `${isPreloaded(eventPhotos[currentIndex + 1].id) ? '✓ Ready' : 'Loading...'} - ${eventPhotos[currentIndex + 1].originalName}`
                  : 'No next photo'
                }
              >
                Next
              </Button>
            </FlexItem>
          </Flex>
        )}
        <PhotoViewer photo={photo} />
        {showNavigation && (
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6a6e73' }}>
            Use ← → arrow keys to navigate • Press Esc to go back
            {preloadedCount > 0 && (
              <span style={{ opacity: 0.7 }}> • {preloadedCount} photos preloaded</span>
            )}
          </div>
        )}
      </PageSection>
    </Page>
  );
};
