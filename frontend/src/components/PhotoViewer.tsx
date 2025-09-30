import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { ArrowLeftIcon, MapIcon } from '@patternfly/react-icons';
import { format } from 'date-fns';
import { Photo } from '../types';
import { photosAPI } from '../services/api';
import { LocationMap } from './LocationMap';
import { isRawFile, getFileTypeDescription } from '../utils/fileUtils';

interface PhotoViewerProps {
  photo: Photo;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleBack = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div>
      <Flex className="pf-u-mb-lg">
        <FlexItem>
          <Button variant="link" icon={<ArrowLeftIcon />} onClick={handleBack}>
            Back to {eventId ? 'Event' : 'Events'}
          </Button>
        </FlexItem>
      </Flex>

      <Grid hasGutter>
        <GridItem span={12} lg={8}>
          <Card>
            <CardBody>
              <div style={{ textAlign: 'center' }}>
                {isRawFile(photo.originalName) ? (
                  <div>
                    <img
                      src={photosAPI.getThumbnailUrl(photo.id)}
                      alt={photo.originalName}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '60vh',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '4px',
                      color: '#666'
                    }}>
                      <strong>Raw Camera File</strong><br />
                      This is a {getFileTypeDescription(photo.originalName)} file. 
                      Browsers cannot display raw files directly, so a thumbnail preview is shown above.
                      <br /><br />
                      <em>To view the full image, download the file and open it in a photo editing application 
                      like Adobe Lightroom, Capture One, or RawTherapee.</em>
                      <br /><br />
                      <Button 
                        variant="primary" 
                        component="a" 
                        href={photosAPI.getFileUrl(photo.id)}
                        download={photo.originalName}
                        target="_blank"
                      >
                        Download Original File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={photosAPI.getFileUrl(photo.id)}
                    alt={photo.originalName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem span={12} lg={4}>
          <Card>
            <CardTitle>Photo Details</CardTitle>
            <CardBody>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Filename</DescriptionListTerm>
                  <DescriptionListDescription>{photo.originalName}</DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Size</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatFileSize(photo.metadata.size)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {photo.metadata.width && photo.metadata.height && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Dimensions</DescriptionListTerm>
                    <DescriptionListDescription>
                      {photo.metadata.width} × {photo.metadata.height}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.dateTime && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Date Taken</DescriptionListTerm>
                    <DescriptionListDescription>
                      {format(new Date(photo.metadata.dateTime), 'PPpp')}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.camera?.make && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Camera</DescriptionListTerm>
                    <DescriptionListDescription>
                      {photo.metadata.camera.make} {photo.metadata.camera.model}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.settings?.iso && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>ISO</DescriptionListTerm>
                    <DescriptionListDescription>
                      {photo.metadata.settings.iso}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.settings?.fNumber && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Aperture</DescriptionListTerm>
                    <DescriptionListDescription>
                      f/{photo.metadata.settings.fNumber}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.settings?.exposureTime && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Shutter Speed</DescriptionListTerm>
                    <DescriptionListDescription>
                      {photo.metadata.settings.exposureTime}s
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.settings?.focalLength && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Focal Length</DescriptionListTerm>
                    <DescriptionListDescription>
                      {photo.metadata.settings.focalLength}mm
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {photo.metadata.gps && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem>
                          <MapIcon />
                        </FlexItem>
                        <FlexItem>Location</FlexItem>
                      </Flex>
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <LocationMap
                        latitude={photo.metadata.gps.latitude}
                        longitude={photo.metadata.gps.longitude}
                        altitude={photo.metadata.gps.altitude}
                        photoName={photo.originalName}
                      />
                      <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#6a6e73' }}>
                        {photo.metadata.gps.latitude.toFixed(6)}, {photo.metadata.gps.longitude.toFixed(6)}
                        {photo.metadata.gps.altitude && (
                          <> • Altitude: {photo.metadata.gps.altitude.toFixed(1)}m</>
                        )}
                      </div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
};
