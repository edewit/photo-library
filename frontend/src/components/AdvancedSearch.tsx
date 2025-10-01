import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  NumberInput,
  DatePicker,
  Button,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Text,
  TextContent,
  Divider,
  ExpandableSection,
  Chip,
  ChipGroup,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { SearchIcon, FilterIcon, TimesIcon } from '@patternfly/react-icons';
import { SearchFilters, SearchResult, Person } from '../types';
import { photosAPI, personsAPI } from '../services/api';
import { PhotoGrid } from './PhotoGrid';
import { useEvents } from '../hooks/useEvents';

interface AdvancedSearchProps {
  onClose?: () => void;
  initialFilters?: Partial<SearchFilters>;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  onClose, 
  initialFilters = {} 
}) => {
  const { events } = useEvents();
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    sortBy: 'dateTime',
    sortOrder: 'desc',
    page: 1,
    limit: 50,
    ...initialFilters
  });
  
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  // Remove unused suggestion state for now - can be added back when implementing autocomplete
  // const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});
  // const [suggestionLoading, setSuggestionLoading] = useState<{ [key: string]: boolean }>({});

  // Debounced search function
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    if (!searchFilters.q && Object.keys(searchFilters).length <= 4) {
      // No search query and no filters (only default sort/pagination)
      setSearchResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await photosAPI.search(searchFilters);
      setSearchResult(result);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search photos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load persons for dropdown
  useEffect(() => {
    const loadPersons = async () => {
      try {
        const response = await personsAPI.getAll('name', 'asc');
        setPersons(response.persons);
      } catch (err) {
        console.error('Failed to load persons:', err);
      }
    };
    loadPersons();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(filters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, performSearch]);

  // Get suggestions for autocomplete - placeholder for future implementation
  const getSuggestions = async (type: 'camera' | 'make' | 'filename', query: string) => {
    // Placeholder - can implement autocomplete suggestions later
    console.log('Getting suggestions for', type, query);
  };

  // Parse special search queries like "Photos with Erik"
  const parseSearchQuery = (query: string) => {
    if (!query) return { q: undefined, personName: undefined };
    
    // Check for "Photos with [Name]" pattern (including partial names)
    const photosWithMatch = query.match(/^photos?\s+with\s*(.*)$/i);
    if (photosWithMatch) {
      const personName = photosWithMatch[1].trim();
      // Only treat as person search if there's actually a name (not just "photos with ")
      if (personName.length > 0) {
        return { q: undefined, personName };
      } else {
        // Keep the "photos with " in the search box but don't treat as person search yet
        return { q: query, personName: undefined };
      }
    }
    
    // Check for "with [Name]" pattern (including partial names)
    const withMatch = query.match(/^with\s*(.*)$/i);
    if (withMatch) {
      const personName = withMatch[1].trim();
      // Only treat as person search if there's actually a name (not just "with ")
      if (personName.length > 0) {
        return { q: undefined, personName };
      } else {
        // Keep the "with " in the search box but don't treat as person search yet
        return { q: query, personName: undefined };
      }
    }
    
    // Regular search query
    return { q: query, personName: undefined };
  };

  // Get the display value for the search input (unified view)
  const getSearchDisplayValue = () => {
    if (filters.personName) {
      // If we're in person search mode, reconstruct the "photos with [name]" format
      return `photos with ${filters.personName}`;
    }
    return filters.q || '';
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    let updates: Partial<SearchFilters> = { [key]: value };
    
    // Special handling for search query
    if (key === 'q' && typeof value === 'string') {
      const parsed = parseSearchQuery(value);
      updates = {
        q: parsed.q,
        personName: parsed.personName,
        // Clear personId if we're searching by name
        personId: parsed.personName ? undefined : filters.personId
      };
    }
    
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: key !== 'page' ? 1 : value // Reset page when changing other filters
    }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      sortBy: 'dateTime',
      sortOrder: 'desc',
      page: 1,
      limit: 50
    });
    setSearchResult(null);
  };

  const getActiveFiltersCount = () => {
    const { q, sortBy, sortOrder, page, limit, ...otherFilters } = filters;
    return Object.values(otherFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length + (q ? 1 : 0);
  };

  const renderActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string }> = [];
    
    if (filters.q) activeFilters.push({ key: 'q', label: 'Search', value: filters.q });
    if (filters.eventId) {
      const event = events.find(e => e.id === filters.eventId);
      activeFilters.push({ key: 'eventId', label: 'Event', value: event?.name || 'Unknown Event' });
    }
    if (filters.startDate) activeFilters.push({ key: 'startDate', label: 'From', value: filters.startDate });
    if (filters.endDate) activeFilters.push({ key: 'endDate', label: 'To', value: filters.endDate });
    if (filters.cameraModel) activeFilters.push({ key: 'cameraModel', label: 'Camera', value: filters.cameraModel });
    if (filters.cameraMake) activeFilters.push({ key: 'cameraMake', label: 'Make', value: filters.cameraMake });
    if (filters.minIso) activeFilters.push({ key: 'minIso', label: 'Min ISO', value: filters.minIso.toString() });
    if (filters.maxIso) activeFilters.push({ key: 'maxIso', label: 'Max ISO', value: filters.maxIso.toString() });
    if (filters.hasGps !== undefined) activeFilters.push({ key: 'hasGps', label: 'Has GPS', value: filters.hasGps ? 'Yes' : 'No' });
    if (filters.hasFaces !== undefined) activeFilters.push({ key: 'hasFaces', label: 'Has Faces', value: filters.hasFaces ? 'With People' : 'No People' });
    if (filters.minFaces) activeFilters.push({ key: 'minFaces', label: 'Min Faces', value: filters.minFaces.toString() });
    if (filters.maxFaces) activeFilters.push({ key: 'maxFaces', label: 'Max Faces', value: filters.maxFaces.toString() });
    if (filters.personId) {
      const person = persons.find(p => p.id === filters.personId);
      activeFilters.push({ key: 'personId', label: 'Person', value: person?.name || 'Unknown Person' });
    }
    if (filters.personName) activeFilters.push({ key: 'personName', label: 'Person Name', value: filters.personName });
    if (filters.fileType) activeFilters.push({ key: 'fileType', label: 'File Type', value: filters.fileType });

    if (activeFilters.length === 0) return null;

    return (
      <ChipGroup categoryName="Active Filters" numChips={5}>
        {activeFilters.map(filter => (
          <Chip
            key={filter.key}
            onClick={() => updateFilter(filter.key as keyof SearchFilters, undefined)}
          >
            {filter.label}: {filter.value}
          </Chip>
        ))}
      </ChipGroup>
    );
  };

  return (
    <div>
      <Card>
        <CardBody>
          <Form>
            {/* Main Search Bar */}
            <FormGroup label="Search Photos" fieldId="search-query">
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem grow={{ default: 'grow' }}>
                  <TextInput
                    id="search-query"
                    type="text"
                    value={getSearchDisplayValue()}
                    onChange={(_, value) => updateFilter('q', value)}
                    placeholder="Search by filename, camera, metadata, or try 'Photos with Erik'..."
                  />
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="secondary"
                    icon={<FilterIcon />}
                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                  >
                    Filters ({getActiveFiltersCount()})
                  </Button>
                </FlexItem>
                {getActiveFiltersCount() > 0 && (
                  <FlexItem>
                    <Button
                      variant="link"
                      icon={<TimesIcon />}
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                  </FlexItem>
                )}
                {onClose && (
                  <FlexItem>
                    <Button variant="plain" onClick={onClose}>
                      <TimesIcon />
                    </Button>
                  </FlexItem>
                )}
              </Flex>
            </FormGroup>

            {/* Active Filters */}
            {renderActiveFilters()}

            {/* Advanced Filters */}
            <ExpandableSection
              toggleText="Advanced Filters"
              isExpanded={isAdvancedExpanded}
              onToggle={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
            >
              <Divider style={{ margin: '1rem 0' }} />
              
              {/* Date & Event Filters */}
              <div style={{ marginBottom: '2rem' }}>
                <TextContent style={{ marginBottom: '1rem' }}>
                  <Text component="h4" style={{ color: '#0066cc', fontWeight: 600, fontSize: '1rem' }}>
                    📅 Date & Event
                  </Text>
                </TextContent>
                <Grid hasGutter>
                  <GridItem md={6} lg={4}>
                    <FormGroup label="Event" fieldId="event-filter">
                      <select
                        id="event-filter"
                        value={filters.eventId || 'all'}
                        onChange={(e) => updateFilter('eventId', e.target.value === 'all' ? undefined : e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="all">All events</option>
                        {events.map(event => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Date From" fieldId="start-date">
                      <DatePicker
                        value={filters.startDate}
                        onChange={(_, value) => updateFilter('startDate', value)}
                        placeholder="Select start date"
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Date To" fieldId="end-date">
                      <DatePicker
                        value={filters.endDate}
                        onChange={(_, value) => updateFilter('endDate', value)}
                        placeholder="Select end date"
                      />
                    </FormGroup>
                  </GridItem>
                </Grid>
              </div>

              {/* Camera & Technical Filters */}
              <div style={{ marginBottom: '2rem' }}>
                <TextContent style={{ marginBottom: '1rem' }}>
                  <Text component="h4" style={{ color: '#0066cc', fontWeight: 600, fontSize: '1rem' }}>
                    📷 Camera & Technical
                  </Text>
                </TextContent>
                <Grid hasGutter>
                  <GridItem md={6} lg={4}>
                    <FormGroup label="Camera Make" fieldId="camera-make">
                      <TextInput
                        id="camera-make"
                        value={filters.cameraMake || ''}
                        onChange={(_, value) => {
                          updateFilter('cameraMake', value);
                          getSuggestions('make', value);
                        }}
                        placeholder="e.g., Canon, Nikon, Sony"
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Camera Model" fieldId="camera-model">
                      <TextInput
                        id="camera-model"
                        value={filters.cameraModel || ''}
                        onChange={(_, value) => {
                          updateFilter('cameraModel', value);
                          getSuggestions('camera', value);
                        }}
                        placeholder="e.g., Canon EOS R5"
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="File Type" fieldId="file-type">
                      <select
                        id="file-type"
                        value={filters.fileType || 'all'}
                        onChange={(e) => updateFilter('fileType', e.target.value === 'all' ? undefined : e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="all">All types</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="raw">RAW (CR2, NEF, ARW, etc.)</option>
                        <option value="tiff">TIFF</option>
                      </select>
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Min ISO" fieldId="min-iso">
                      <NumberInput
                        value={filters.minIso || 0}
                        onMinus={() => updateFilter('minIso', Math.max(0, (filters.minIso || 100) - 100))}
                        onPlus={() => updateFilter('minIso', (filters.minIso || 0) + 100)}
                        onChange={(event) => {
                          const value = parseInt((event.target as HTMLInputElement).value);
                          updateFilter('minIso', isNaN(value) ? undefined : value);
                        }}
                        min={0}
                        max={25600}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Max ISO" fieldId="max-iso">
                      <NumberInput
                        value={filters.maxIso || 0}
                        onMinus={() => updateFilter('maxIso', Math.max(0, (filters.maxIso || 1600) - 100))}
                        onPlus={() => updateFilter('maxIso', (filters.maxIso || 0) + 100)}
                        onChange={(event) => {
                          const value = parseInt((event.target as HTMLInputElement).value);
                          updateFilter('maxIso', isNaN(value) ? undefined : value);
                        }}
                        min={0}
                        max={25600}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Has GPS Data" fieldId="has-gps">
                      <select
                        id="has-gps"
                        value={filters.hasGps === undefined ? 'all' : filters.hasGps.toString()}
                        onChange={(e) => {
                          const value = e.target.value === 'all' ? undefined : e.target.value === 'true';
                          updateFilter('hasGps', value);
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="all">Any</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </FormGroup>
                  </GridItem>
                </Grid>
              </div>

              {/* People & Faces Filters */}
              <div style={{ marginBottom: '2rem' }}>
                <TextContent style={{ marginBottom: '1rem' }}>
                  <Text component="h4" style={{ color: '#0066cc', fontWeight: 600, fontSize: '1rem' }}>
                    👥 People & Faces
                  </Text>
                </TextContent>
                <Grid hasGutter>
                  <GridItem md={6} lg={4}>
                    <FormGroup label="Has Faces" fieldId="has-faces">
                      <select
                        id="has-faces"
                        value={filters.hasFaces === undefined ? 'all' : filters.hasFaces.toString()}
                        onChange={(e) => {
                          const value = e.target.value === 'all' ? undefined : e.target.value === 'true';
                          updateFilter('hasFaces', value);
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="all">Any</option>
                        <option value="true">With People</option>
                        <option value="false">No People</option>
                      </select>
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Min Faces" fieldId="min-faces">
                      <NumberInput
                        value={filters.minFaces || 0}
                        onMinus={() => updateFilter('minFaces', Math.max(0, (filters.minFaces || 1) - 1))}
                        onPlus={() => updateFilter('minFaces', (filters.minFaces || 0) + 1)}
                        onChange={(event) => {
                          const value = parseInt((event.target as HTMLInputElement).value);
                          updateFilter('minFaces', isNaN(value) ? undefined : value);
                        }}
                        min={0}
                        max={20}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Max Faces" fieldId="max-faces">
                      <NumberInput
                        value={filters.maxFaces || 0}
                        onMinus={() => updateFilter('maxFaces', Math.max(0, (filters.maxFaces || 5) - 1))}
                        onPlus={() => updateFilter('maxFaces', (filters.maxFaces || 0) + 1)}
                        onChange={(event) => {
                          const value = parseInt((event.target as HTMLInputElement).value);
                          updateFilter('maxFaces', isNaN(value) ? undefined : value);
                        }}
                        min={0}
                        max={20}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Person" fieldId="person-select">
                      <select
                        id="person-select"
                        value={filters.personId || ''}
                        onChange={(e) => {
                          const value = e.target.value || undefined;
                          updateFilter('personId', value);
                          // Clear personName when selecting by ID
                          if (value) {
                            updateFilter('personName', undefined);
                          }
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="">Any person</option>
                        {persons.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name} ({person.photoCount} photos)
                          </option>
                        ))}
                      </select>
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Person Name Search" fieldId="person-name">
                      <TextInput
                        id="person-name"
                        value={filters.personName || ''}
                        onChange={(_event, value) => {
                          updateFilter('personName', value || undefined);
                          // Clear personId when searching by name
                          if (value) {
                            updateFilter('personId', undefined);
                          }
                        }}
                        placeholder="Search by person name..."
                      />
                    </FormGroup>
                  </GridItem>
                </Grid>
              </div>

              {/* Display & Sorting */}
              <div style={{ marginBottom: '1rem' }}>
                <TextContent style={{ marginBottom: '1rem' }}>
                  <Text component="h4" style={{ color: '#0066cc', fontWeight: 600, fontSize: '1rem' }}>
                    🔧 Display & Sorting
                  </Text>
                </TextContent>
                <Grid hasGutter>
                  <GridItem md={6} lg={4}>
                    <FormGroup label="Sort By" fieldId="sort-by">
                      <select
                        id="sort-by"
                        value={filters.sortBy || 'dateTime'}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="dateTime">Date Taken</option>
                        <option value="filename">Filename</option>
                        <option value="size">File Size</option>
                        <option value="camera">Camera Model</option>
                      </select>
                    </FormGroup>
                  </GridItem>

                  <GridItem md={6} lg={4}>
                    <FormGroup label="Sort Order" fieldId="sort-order">
                      <select
                        id="sort-order"
                        value={filters.sortOrder || 'desc'}
                        onChange={(e) => updateFilter('sortOrder', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </FormGroup>
                  </GridItem>
                </Grid>
              </div>
            </ExpandableSection>
          </Form>
        </CardBody>
      </Card>

      {/* Search Results */}
      <div style={{ marginTop: '1.5rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <div style={{ marginTop: '1rem' }}>
              <Text>Searching photos...</Text>
            </div>
          </div>
        )}

        {error && (
          <EmptyState>
            <EmptyStateIcon icon={SearchIcon} />
            <Title headingLevel="h4" size="lg">
              Search Error
            </Title>
            <EmptyStateBody>{error}</EmptyStateBody>
            <Button variant="primary" onClick={() => performSearch(filters)}>
              Try Again
            </Button>
          </EmptyState>
        )}

        {!loading && !error && searchResult && (
          <div>
            <TextContent style={{ marginBottom: '1rem' }}>
              <Text component="h3">
                Search Results ({searchResult.pagination.total} photos found)
              </Text>
              {searchResult.pagination.totalPages > 1 && (
                <Text component="small">
                  Page {searchResult.pagination.page} of {searchResult.pagination.totalPages}
                </Text>
              )}
            </TextContent>

            {searchResult.photos.length > 0 ? (
              <>
                <PhotoGrid 
                  photos={searchResult.photos} 
                  loading={false}
                />
                
                {/* Pagination */}
                {searchResult.pagination.totalPages > 1 && (
                  <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ marginTop: '1.5rem' }}>
                    <FlexItem>
                      <Button
                        variant="secondary"
                        isDisabled={!searchResult.pagination.hasPrev}
                        onClick={() => updateFilter('page', Math.max(1, filters.page! - 1))}
                      >
                        Previous
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Text style={{ margin: '0 1rem', alignSelf: 'center' }}>
                        Page {searchResult.pagination.page} of {searchResult.pagination.totalPages}
                      </Text>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="secondary"
                        isDisabled={!searchResult.pagination.hasNext}
                        onClick={() => updateFilter('page', filters.page! + 1)}
                      >
                        Next
                      </Button>
                    </FlexItem>
                  </Flex>
                )}
              </>
            ) : (
              <EmptyState>
                <EmptyStateIcon icon={SearchIcon} />
                <Title headingLevel="h4" size="lg">
                  No Photos Found
                </Title>
                <EmptyStateBody>
                  No photos match your search criteria. Try adjusting your filters or search terms.
                </EmptyStateBody>
              </EmptyState>
            )}
          </div>
        )}

        {!loading && !error && !searchResult && filters.q && (
          <EmptyState>
            <EmptyStateIcon icon={SearchIcon} />
            <Title headingLevel="h4" size="lg">
              Start Searching
            </Title>
            <EmptyStateBody>
              Enter a search term or apply filters to find photos in your library.
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    </div>
  );
};
