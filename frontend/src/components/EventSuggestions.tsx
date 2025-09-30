import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Grid,
  GridItem,
  Text,
  Flex,
  FlexItem,
  Checkbox,
} from '@patternfly/react-core';
import { format } from 'date-fns';
import { EventSuggestion } from '../types';
import { photosAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

interface EventSuggestionsProps {
  suggestions: EventSuggestion[];
  onOrganizeComplete: () => void;
}

export const EventSuggestions: React.FC<EventSuggestionsProps> = ({
  suggestions,
  onOrganizeComplete,
}) => {
  const [events, setEvents] = useState<EventSuggestion[]>(suggestions);
  const [organizing, setOrganizing] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Record<number, Set<string>>>({}); // eventIndex -> Set of photo filenames
  const { addToast } = useToast();

  const updateEvent = (index: number, updates: Partial<EventSuggestion>) => {
    setEvents(prev => prev.map((event, i) => 
      i === index ? { ...event, ...updates } : event
    ));
  };

  const togglePhotoSelection = (eventIndex: number, photoFilename: string) => {
    setSelectedPhotos(prev => {
      const eventSelections = prev[eventIndex] || new Set<string>();
      const newSelections = new Set(eventSelections);
      
      if (newSelections.has(photoFilename)) {
        newSelections.delete(photoFilename);
      } else {
        newSelections.add(photoFilename);
      }
      
      return {
        ...prev,
        [eventIndex]: newSelections,
      };
    });
  };

  const createNewEventFromSelected = (sourceEventIndex: number) => {
    const sourceEvent = events[sourceEventIndex];
    const selectedFilenames = selectedPhotos[sourceEventIndex] || new Set<string>();
    
    if (selectedFilenames.size === 0) {
      addToast('warning', 'No photos selected', 'Please select photos to create a new event.');
      return;
    }

    const selectedPhotosArray = sourceEvent.photos.filter(photo => 
      selectedFilenames.has(photo.filename)
    );
    const remainingPhotos = sourceEvent.photos.filter(photo => 
      !selectedFilenames.has(photo.filename)
    );

    // Update the source event to remove selected photos
    const updatedSourceEvent = {
      ...sourceEvent,
      photos: remainingPhotos,
      endDate: remainingPhotos[remainingPhotos.length - 1]?.metadata.dateTime || sourceEvent.endDate,
    };

    // Create new event with selected photos
    const newEvent = {
      ...sourceEvent,
      name: `${sourceEvent.name} (Split)`,
      photos: selectedPhotosArray,
      startDate: selectedPhotosArray[0]?.metadata.dateTime || sourceEvent.startDate,
      endDate: selectedPhotosArray[selectedPhotosArray.length - 1]?.metadata.dateTime || sourceEvent.endDate,
    };

    setEvents(prev => [
      ...prev.slice(0, sourceEventIndex),
      updatedSourceEvent,
      newEvent,
      ...prev.slice(sourceEventIndex + 1),
    ]);

    // Clear selections for this event
    setSelectedPhotos(prev => ({
      ...prev,
      [sourceEventIndex]: new Set<string>(),
    }));
  };

  const mergeEvents = (index1: number, index2: number) => {
    if (index1 === index2) return;
    
    const [first, second] = index1 < index2 
      ? [events[index1], events[index2]]
      : [events[index2], events[index1]];
    
    const merged = {
      ...first,
      photos: [...first.photos, ...second.photos],
      startDate: first.startDate < second.startDate ? first.startDate : second.startDate,
      endDate: first.endDate > second.endDate ? first.endDate : second.endDate,
    };

    const toRemove = Math.max(index1, index2);
    const toUpdate = Math.min(index1, index2);

    setEvents(prev => [
      ...prev.slice(0, toUpdate),
      merged,
      ...prev.slice(toUpdate + 1, toRemove),
      ...prev.slice(toRemove + 1),
    ]);
  };

  const handleOrganize = async () => {
    try {
      setOrganizing(true);
      
      await photosAPI.organize(events);
      addToast('success', 'Events created!', `Successfully organized photos into ${events.length} ${events.length === 1 ? 'event' : 'events'}.`);
      onOrganizeComplete();
    } catch (err) {
      addToast('danger', 'Organization failed', err instanceof Error ? err.message : 'Failed to organize photos. Please try again.');
    } finally {
      setOrganizing(false);
    }
  };

  return (
    <Card>
      <CardTitle>Organize Photos into Events</CardTitle>
      <CardBody>
        <Text className="pf-u-mb-md">
          We've suggested {events.length} events based on the photo dates. 
          You can rename events, select photos to create new events, or merge events before organizing.
        </Text>

        <Grid hasGutter>
          {events.map((event, index) => (
            <GridItem span={12} md={6} lg={4} key={index}>
              <Card isCompact>
                <CardBody>
                  <Form>
                    <FormGroup label="Event Name" fieldId={`name-${index}`}>
                      <TextInput
                        id={`name-${index}`}
                        value={event.name}
                        onChange={(_, value) => updateEvent(index, { name: value })}
                      />
                    </FormGroup>
                    
                    <FormGroup label="Description" fieldId={`desc-${index}`}>
                      <TextArea
                        id={`desc-${index}`}
                        value={event.description || ''}
                        onChange={(_, value) => updateEvent(index, { description: value })}
                        placeholder="Optional description"
                      />
                    </FormGroup>
                  </Form>
                  
                  <Text component="small" className="pf-u-display-block pf-u-mt-sm">
                    {event.photos.length} photos
                    {event.startDate && (
                      <>
                        <br />
                        {format(new Date(event.startDate), 'PPP')}
                        {event.endDate !== event.startDate && (
                          <> - {format(new Date(event.endDate), 'PPP')}</>
                        )}
                      </>
                    )}
                  </Text>

                  {/* Photo Thumbnails with Checkboxes */}
                  {event.photos.length > 0 && (
                    <div className="pf-u-mt-md">
                      <Text component="h6" className="pf-u-mb-sm">Photos:</Text>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                        gap: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {event.photos.map((photo, photoIndex) => {
                          const isSelected = selectedPhotos[index]?.has(photo.filename) || false;
                          return (
                            <div key={photo.filename} style={{ position: 'relative' }}>
                              <div
                                style={{
                                  aspectRatio: '1',
                                  backgroundColor: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  borderRadius: '4px',
                                  border: isSelected ? '2px solid #0066cc' : '1px solid #d2d2d2',
                                }}
                              >
                                <img
                                  src={photosAPI.getThumbnailUrl(`thumb_${photo.filename}`)}
                                  alt={photo.filename}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = `
                                      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 10px;">
                                        <span>No preview</span>
                                      </div>
                                    `;
                                  }}
                                />
                              </div>
                              <Checkbox
                                id={`photo-${index}-${photoIndex}`}
                                isChecked={isSelected}
                                onChange={() => togglePhotoSelection(index, photo.filename)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Flex className="pf-u-mt-sm" spaceItems={{ default: 'spaceItemsXs' }}>
                    {event.photos.length > 1 && (
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => createNewEventFromSelected(index)}
                          isDisabled={(selectedPhotos[index]?.size || 0) === 0}
                        >
                          Create New Event from Selected
                        </Button>
                      </FlexItem>
                    )}
                    {index > 0 && (
                      <FlexItem>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => mergeEvents(index - 1, index)}
                        >
                          Merge with previous
                        </Button>
                      </FlexItem>
                    )}
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>

        <Flex className="pf-u-mt-lg">
          <FlexItem>
            <Button
              variant="primary"
              onClick={handleOrganize}
              isLoading={organizing}
              isDisabled={organizing || events.length === 0}
            >
              Organize Photos
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
