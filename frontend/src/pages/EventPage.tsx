import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Button,
  Text,
  TextContent,
  Alert,
  Spinner,
} from '@patternfly/react-core';
import { ArrowLeftIcon } from '@patternfly/react-icons';
import { format } from 'date-fns';
import { PhotoGrid } from '../components/PhotoGrid';
import { Event, Photo } from '../types';
import { eventsAPI } from '../services/api';

export const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [eventData, photosData] = await Promise.all([
        eventsAPI.getById(id),
        eventsAPI.getPhotos(id),
      ]);

      setEvent(eventData);
      setPhotos(photosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverPhotoChange = () => {
    // Refresh event data to get updated cover photo
    if (id) {
      eventsAPI.getById(id).then(setEvent);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  if (loading) {
    return (
      <Page>
        <PageSection variant={PageSectionVariants.light}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <div style={{ marginTop: '1rem' }}>Loading event...</div>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (error || !event) {
    return (
      <Page>
        <PageSection variant={PageSectionVariants.light}>
          <Alert variant="danger" title="Error">
            {error || 'Event not found'}
          </Alert>
          <Button variant="link" onClick={() => navigate('/')} className="pf-u-mt-md">
            ← Back to Events
          </Button>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/')}
          className="pf-u-mb-md"
        >
          Back to Events
        </Button>
        <TextContent>
          <Text component="h2">{event.name}</Text>
          {event.description && (
            <Text component="p">{event.description}</Text>
          )}
          <Text component="p" className="pf-u-color-200">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            {event.startDate && (
              <>
                {' • '}
                {format(new Date(event.startDate), 'PPP')}
                {event.endDate && event.endDate !== event.startDate && (
                  <> - {format(new Date(event.endDate), 'PPP')}</>
                )}
              </>
            )}
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <PhotoGrid photos={photos} eventId={id} onCoverPhotoChange={handleCoverPhotoChange} />
      </PageSection>
    </Page>
  );
};
