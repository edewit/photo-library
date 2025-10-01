import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { ImageIcon, EllipsisVIcon } from '@patternfly/react-icons';
import { Photo } from '../types';
import { photosAPI, eventsAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

interface PhotoGridProps {
  photos: Photo[];
  loading?: boolean;
  eventId?: string;
  onCoverPhotoChange?: () => void;
  searchContext?: {
    query: string;
    filters: Record<string, any>;
  };
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, loading, eventId, onCoverPhotoChange, searchContext }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);

  const handleSetCoverPhoto = async (photoId: string) => {
    if (!eventId) return;
    
    try {
      setSettingCover(photoId);
      await eventsAPI.setCoverPhoto(eventId, photoId);
      addToast('success', 'Cover photo updated!', 'The event cover photo has been successfully changed.');
      if (onCoverPhotoChange) {
        onCoverPhotoChange();
      }
    } catch (error) {
      addToast('danger', 'Update failed', 'Failed to set the cover photo. Please try again.');
    } finally {
      setSettingCover(null);
      setOpenDropdown(null);
    }
  };

  if (loading) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={Spinner} />
        <EmptyStateBody>Loading photos...</EmptyStateBody>
      </EmptyState>
    );
  }

  if (photos.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={ImageIcon} />
        <CardTitle>
          No photos found
        </CardTitle>
        <EmptyStateBody>
          This event doesn't have any photos yet.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Grid hasGutter>
        {photos.map((photo) => (
          <GridItem span={12} sm={6} md={4} lg={3} xl={2} key={photo.id}>
            <Card style={{ position: 'relative' }}>
              {eventId && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
                  <Dropdown
                    isOpen={openDropdown === photo.id}
                    onSelect={() => setOpenDropdown(null)}
                    onOpenChange={(isOpen) => setOpenDropdown(isOpen ? photo.id : null)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        aria-label="Photo actions"
                        variant="plain"
                        onClick={() => setOpenDropdown(openDropdown === photo.id ? null : photo.id)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          padding: 0
                        }}
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        onClick={() => handleSetCoverPhoto(photo.id)}
                        isDisabled={settingCover === photo.id}
                      >
                        {settingCover === photo.id ? 'Setting as cover...' : 'Set as cover photo'}
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </div>
              )}
              <div
                onClick={() => {
                  let url = `/photos/${photo.id}`;
                  const params = new URLSearchParams();
                  
                  if (eventId) {
                    params.set('eventId', eventId);
                  }
                  
                  if (searchContext) {
                    params.set('fromSearch', 'true');
                    if (searchContext.query) {
                      params.set('searchQuery', searchContext.query);
                    }
                    // Store search filters as JSON
                    if (Object.keys(searchContext.filters).length > 0) {
                      params.set('searchFilters', JSON.stringify(searchContext.filters));
                    }
                  }
                  
                  if (params.toString()) {
                    url += `?${params.toString()}`;
                  }
                  
                  navigate(url);
                }}
                style={{
                  aspectRatio: '1',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={photosAPI.getThumbnailUrl(photo.id)}
                  alt={photo.originalName}
                  style={{
                    width: '100%',
                    height: '100%',
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
              </div>
              <CardBody style={{ padding: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={photo.originalName}
                >
                  {photo.originalName}
                </div>
              </CardBody>
            </Card>
          </GridItem>
        ))}
    </Grid>
  );
};
