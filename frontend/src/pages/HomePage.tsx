import React, { useState } from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Button,
  Modal,
  ModalVariant,
  Flex,
  FlexItem,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons';
import { EventGrid } from '../components/EventGrid';
import { PhotoUpload } from '../components/PhotoUpload';
import { EventSuggestions } from '../components/EventSuggestions';
import { QuickSearch } from '../components/QuickSearch';
import { useEvents } from '../hooks/useEvents';
import { UploadResponse } from '../types';

export const HomePage: React.FC = () => {
  const { events, loading, fetchEvents } = useEvents();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const handleUploadComplete = (result: UploadResponse) => {
    setUploadResult(result);
  };

  const handleOrganizeComplete = () => {
    setUploadResult(null);
    setIsUploadModalOpen(false);
    fetchEvents(); // Refresh events list
  };

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <TextContent>
              <Text component="h2">My Events</Text>
              <Text component="p">Organize your photos into events and browse your collection</Text>
            </TextContent>
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Photos
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <div style={{ marginBottom: '1.5rem' }}>
          <QuickSearch />
        </div>
        <EventGrid events={events} loading={loading} />
      </PageSection>

      <Modal
        variant={ModalVariant.large}
        title="Upload Photos"
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadResult(null);
        }}
        hasNoBodyWrapper
        aria-label="Upload Photos Modal"
        aria-describedby="upload-photos-description"
      >
        <div style={{ padding: '1.5rem' }}>
          <div id="upload-photos-description" className="pf-v5-screen-reader">
            {!uploadResult 
              ? "Upload and organize your photos into events" 
              : "Review and organize suggested events from your uploaded photos"
            }
          </div>
          {!uploadResult ? (
            <PhotoUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <EventSuggestions
              suggestions={uploadResult.eventSuggestions}
              onOrganizeComplete={handleOrganizeComplete}
            />
          )}
        </div>
      </Modal>
    </Page>
  );
};
