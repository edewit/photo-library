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
  const [searchPhotos, setSearchPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromSearch, setIsFromSearch] = useState(false);

  useEffect(() => {
    const fetchPhotoAndEventData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        // Check if we're coming from search
        const fromSearch = searchParams.get('fromSearch') === 'true';
        const searchQuery = searchParams.get('searchQuery');
        const searchFiltersParam = searchParams.get('searchFilters');
        
        setIsFromSearch(fromSearch);
        
        // Fetch the current photo
        const photoData = await photosAPI.getById(id);
        setPhoto(photoData);
        
        if (fromSearch && (searchQuery || searchFiltersParam)) {
          // We're coming from search - fetch search results for navigation
          try {
            const searchFilters = searchFiltersParam ? JSON.parse(searchFiltersParam) : {};
            const searchParams = {
              q: searchQuery || undefined,
              ...searchFilters,
              limit: 1000 // Get all results for navigation
            };
            
            const searchResult = await photosAPI.search(searchParams);
            setSearchPhotos(searchResult.photos);
            
            // Find current photo index in search results
            const index = searchResult.photos.findIndex(p => p.id === id);
            setCurrentIndex(index);
          } catch (searchError) {
            console.error('Failed to fetch search results for navigation:', searchError);
            // Fall back to event navigation
            setIsFromSearch(false);
          }
        }
        
        // If not from search or search failed, use event navigation
        if (!fromSearch || searchPhotos.length === 0) {
          const targetEventId = eventId || photoData.eventId;
          if (targetEventId) {
            const eventPhotosData = await eventsAPI.getPhotos(targetEventId);
            setEventPhotos(eventPhotosData);
            
            // Find current photo index in the event photos
            const index = eventPhotosData.findIndex(p => p.id === id);
            setCurrentIndex(index);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load photo');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoAndEventData();
  }, [id, eventId, searchParams]);

  // Navigation functions
  const goToPrevious = () => {
    const photosArray = isFromSearch ? searchPhotos : eventPhotos;
    if (currentIndex > 0 && photosArray.length > 0) {
      const prevPhoto = photosArray[currentIndex - 1];
      
      // Preserve the current URL parameters
      const currentParams = new URLSearchParams(window.location.search);
      navigate(`/photos/${prevPhoto.id}?${currentParams.toString()}`);
    }
  };

  const goToNext = () => {
    const photosArray = isFromSearch ? searchPhotos : eventPhotos;
    if (currentIndex < photosArray.length - 1 && photosArray.length > 0) {
      const nextPhoto = photosArray[currentIndex + 1];
      
      // Preserve the current URL parameters
      const currentParams = new URLSearchParams(window.location.search);
      navigate(`/photos/${nextPhoto.id}?${currentParams.toString()}`);
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
        if (isFromSearch) {
          navigate('/search');
        } else if (eventId) {
          navigate(`/events/${eventId}`);
        } else {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, eventPhotos, searchPhotos, eventId, isFromSearch, navigate]);

  // Get the appropriate photos array for navigation
  const navigationPhotos = isFromSearch ? searchPhotos : eventPhotos;

  // Preload adjacent photos for smoother navigation
  const { isPreloaded, preloadedCount, isLoading } = usePhotoPreloader({
    photos: navigationPhotos,
    currentIndex,
    preloadCount: 2 // Preload 2 photos ahead and behind
  });

  // Helper variables
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < navigationPhotos.length - 1 && navigationPhotos.length > 0;
  const showNavigation = navigationPhotos.length > 1;

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
                title={hasPrevious && navigationPhotos[currentIndex - 1] 
                  ? `${isPreloaded(navigationPhotos[currentIndex - 1].id) ? '✓ Ready' : 'Loading...'} - ${navigationPhotos[currentIndex - 1].originalName}`
                  : 'No previous photo'
                }
              >
                Previous
              </Button>
            </FlexItem>
            <FlexItem>
              <div style={{ textAlign: 'center', color: '#6a6e73' }}>
                {currentIndex + 1} of {navigationPhotos.length}
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
                title={hasNext && navigationPhotos[currentIndex + 1] 
                  ? `${isPreloaded(navigationPhotos[currentIndex + 1].id) ? '✓ Ready' : 'Loading...'} - ${navigationPhotos[currentIndex + 1].originalName}`
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
