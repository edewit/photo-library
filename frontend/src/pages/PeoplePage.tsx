import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Grid,
  GridItem,
  Text,
  Button,
  Flex,
  FlexItem,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { UserIcon, UsersIcon, CogIcon } from '@patternfly/react-icons';
import { Person } from '../types';
import { personsAPI } from '../services/api';
import { FaceRecognitionManager } from '../components/FaceRecognitionManager';
import { useNavigate } from 'react-router-dom';

export const PeoplePage: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | number>('people');
  const navigate = useNavigate();

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await personsAPI.getAll('photoCount', 'desc'); // Sort by photo count
      setPersons(response.persons);
    } catch (err) {
      console.error('Failed to load persons:', err);
      setError('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonClick = (personId: string) => {
    // Navigate to search page filtered by this person
    navigate(`/search?personId=${personId}`);
  };

  if (loading) {
    return (
      <PageSection>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="lg" />
          <div style={{ marginTop: '1rem' }}>Loading people...</div>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div style={{ marginBottom: '2rem' }}>
        <Text component="h1">People</Text>
        <Text component="p">Manage people and face recognition in your photo library</Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(_, tabIndex) => setActiveTab(tabIndex)}
      >
        <Tab eventKey="people" title={<TabTitleText><UsersIcon style={{ marginRight: '0.5rem' }} />People</TabTitleText>}>
          <div style={{ marginTop: '2rem' }}>
            {error && (
              <div style={{ marginBottom: '2rem', color: 'red' }}>
                {error}
              </div>
            )}

            {persons.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon icon={UserIcon} />
                <Title headingLevel="h4" size="lg">
                  No People Found
                </Title>
                <EmptyStateBody>
                  Start by detecting faces in your photos and assigning them to people.
                  Go to any photo with faces and use the Face Detection tab to get started.
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <Grid hasGutter>
                {persons.map(person => (
                  <GridItem key={person.id} md={6} lg={4} xl={3}>
                    <Card 
                      isSelectable
                      onClick={() => handlePersonClick(person.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <div style={{ 
                              width: '80px', 
                              height: '80px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)',
                              color: 'var(--pf-v5-global--Color--200)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '1rem'
                            }}>
                              {person.avatar ? (
                                <img 
                                  src={personsAPI.getAvatarUrl(person.id)} 
                                  alt={person.name}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    // If avatar fails to load, hide the image and show default icon
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement!;
                                    parent.innerHTML = '';
                                    // Create a UserIcon element that will inherit the theme-aware color
                                    const iconContainer = document.createElement('div');
                                    iconContainer.style.color = 'inherit';
                                    iconContainer.innerHTML = '<svg role="img" aria-hidden="true" fill="currentColor" width="2em" height="2em" viewBox="0 0 448 512"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>';
                                    parent.appendChild(iconContainer);
                                  }}
                                />
                              ) : (
                                <UserIcon />
                              )}
                            </div>
                          </FlexItem>
                          
                          <FlexItem>
                            <Text component="h4" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                              {person.name}
                            </Text>
                          </FlexItem>
                          
                          <FlexItem>
                            <Badge isRead>
                              {person.photoCount} photo{person.photoCount !== 1 ? 's' : ''}
                            </Badge>
                          </FlexItem>

                          {person.notes && (
                            <FlexItem style={{ marginTop: '0.5rem' }}>
                              <Text component="small" style={{ textAlign: 'center', color: '#666' }}>
                                {person.notes}
                              </Text>
                            </FlexItem>
                          )}

                          <FlexItem style={{ marginTop: '1rem' }}>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePersonClick(person.id);
                              }}
                              title={`View all ${person.photoCount} photos of ${person.name}`}
                            >
                              View {person.photoCount} Photo{person.photoCount !== 1 ? 's' : ''}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            )}
          </div>
        </Tab>

        <Tab eventKey="recognition" title={<TabTitleText><CogIcon style={{ marginRight: '0.5rem' }} />Auto-Recognition</TabTitleText>}>
          <div style={{ marginTop: '2rem' }}>
            <FaceRecognitionManager />
          </div>
        </Tab>
      </Tabs>
    </PageSection>
  );
};
