import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { AdvancedSearch } from '../components/AdvancedSearch';
import { SearchFilters } from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Parse URL parameters into initial filters
  const initialFilters = useMemo((): Partial<SearchFilters> => {
    const filters: Partial<SearchFilters> = {};
    
    // Get all search parameters
    for (const [key, value] of searchParams.entries()) {
      switch (key) {
        case 'q':
        case 'eventId':
        case 'startDate':
        case 'endDate':
        case 'cameraModel':
        case 'cameraMake':
        case 'fileType':
        case 'sortBy':
        case 'sortOrder':
          (filters as any)[key] = value;
          break;
        case 'minIso':
        case 'maxIso':
        case 'focalLength':
        case 'minWidth':
        case 'maxWidth':
        case 'minHeight':
        case 'maxHeight':
        case 'page':
        case 'limit':
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            (filters as any)[key] = numValue;
          }
          break;
        case 'minFNumber':
        case 'maxFNumber':
          const floatValue = parseFloat(value);
          if (!isNaN(floatValue)) {
            (filters as any)[key] = floatValue;
          }
          break;
        case 'hasGps':
          filters.hasGps = value === 'true';
          break;
      }
    }
    
    return filters;
  }, [searchParams]);

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Search Photos</Text>
          <Text component="p">
            Find photos in your library using advanced search and filtering options
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <AdvancedSearch initialFilters={initialFilters} />
      </PageSection>
    </Page>
  );
};
