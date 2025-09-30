import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Text,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
} from '@patternfly/react-core';
import { ImagesIcon } from '@patternfly/react-icons';
import { format } from 'date-fns';
import { Event } from '../types';
import { photosAPI } from '../services/api';

interface EventGridProps {
  events: Event[];
  loading?: boolean;
}

export const EventGrid: React.FC<EventGridProps> = ({ events, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={Spinner} />
        <EmptyStateBody>Loading events...</EmptyStateBody>
      </EmptyState>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={ImagesIcon} />
        <CardTitle>
          No events found
        </CardTitle>
        <EmptyStateBody>
          Upload some photos to create your first event!
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Grid hasGutter>
      {events.map((event) => (
        <GridItem span={12} md={6} lg={4} xl={3} key={event.id}>
          <Card
            onClick={() => navigate(`/events/${event.id}`)}
            style={{ height: '100%', cursor: 'pointer' }}
          >
            <div
              style={{
                height: '200px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #d2d2d2',
              }}
            >
              {event.coverPhotoId ? (
                <img
                  src={typeof event.coverPhotoId === 'string' 
                    ? photosAPI.getThumbnailUrl(event.coverPhotoId)
                    : photosAPI.getThumbnailUrl(event.coverPhotoId.id)
                  }
                  alt={event.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if thumbnail fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">
                        <span>No preview</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <ImagesIcon />
                  <div>No cover photo</div>
                </div>
              )}
            </div>
            <CardBody>
              <CardTitle>{event.name}</CardTitle>
              {event.description && (
                <Text component="p" className="pf-u-mb-sm">
                  {event.description}
                </Text>
              )}
              <Text component="small" className="pf-u-color-200">
                {event.photoCount} {event.photoCount === 1 ? 'photo' : 'photos'}
                {event.startDate && (
                  <>
                    <br />
                    {format(new Date(event.startDate), 'PPP')}
                  </>
                )}
              </Text>
            </CardBody>
          </Card>
        </GridItem>
      ))}
    </Grid>
  );
};
