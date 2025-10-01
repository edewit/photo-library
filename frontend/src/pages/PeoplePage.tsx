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
import { PersonAvatar } from '../components/PersonAvatar';
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
                          <FlexItem style={{ marginBottom: '1rem' }}>
                            <PersonAvatar 
                              person={person} 
                              size={80}
                              className="person-avatar"
                            />
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
