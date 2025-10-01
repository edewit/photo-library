import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
  Flex,
  FlexItem,
  Text,
  Badge,
  Card,
  CardBody,
  Spinner,
} from '@patternfly/react-core';
import { UserIcon, PlusIcon } from '@patternfly/react-icons';
import { FaceData, Person, PersonSuggestion } from '../types';
import { personsAPI } from '../services/api';

interface FaceAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  photoId: string;
  faceIndex: number;
  face: FaceData;
  onAssigned?: (personId: string, personName: string) => void;
}

export const FaceAssignment: React.FC<FaceAssignmentProps> = ({
  isOpen,
  onClose,
  photoId,
  faceIndex,
  face,
  onAssigned
}) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load persons and suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all persons
      const personsResponse = await personsAPI.getAll('name', 'asc');
      setPersons(personsResponse.persons);

      // Get suggestions if face has descriptor
      if (face.descriptor && face.descriptor.length === 128) {
        const suggestionsResponse = await personsAPI.getSuggestions(face.descriptor, 0.6);
        setSuggestions(suggestionsResponse.suggestions);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load person data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignExisting = async () => {
    if (!selectedPersonId) {
      setError('Please select a person');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      await personsAPI.assignFace(photoId, faceIndex, selectedPersonId);
      const person = persons.find(p => p.id === selectedPersonId);
      
      setSuccess(`Face assigned to ${person?.name || 'person'} successfully!`);
      
      if (onAssigned && person) {
        onAssigned(selectedPersonId, person.name);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error assigning face:', err);
      setError('Failed to assign face');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newPersonName.trim()) {
      setError('Please enter a person name');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // Create new person with face descriptor
      const newPerson = await personsAPI.create(
        newPersonName.trim(),
        '',
        face.descriptor
      );

      // Assign face to new person
      await personsAPI.assignFace(photoId, faceIndex, newPerson.id);
      
      setSuccess(`Created "${newPersonName}" and assigned face successfully!`);
      
      if (onAssigned) {
        onAssigned(newPerson.id, newPerson.name);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating person:', err);
      if (err.response?.status === 409) {
        setError('A person with this name already exists');
      } else {
        setError('Failed to create person');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedPersonId('');
    setNewPersonName('');
    setIsCreatingNew(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Assign Face to Person"
      isOpen={isOpen}
      onClose={handleClose}
      actions={[
        <Button
          key="assign"
          variant="primary"
          onClick={isCreatingNew ? handleCreateNew : handleAssignExisting}
          isDisabled={isLoading || isAssigning || (!selectedPersonId && !newPersonName.trim())}
          isLoading={isAssigning}
        >
          {isAssigning ? 'Assigning...' : (isCreatingNew ? 'Create & Assign' : 'Assign')}
        </Button>,
        <Button key="cancel" variant="link" onClick={handleClose}>
          Cancel
        </Button>
      ]}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="lg" />
          <div style={{ marginTop: '1rem' }}>Loading persons...</div>
        </div>
      ) : (
        <Form>
          {error && (
            <Alert variant={AlertVariant.danger} title="Error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant={AlertVariant.success} title="Success" style={{ marginBottom: '1rem' }}>
              {success}
            </Alert>
          )}

          {/* Face Info */}
          <Card style={{ marginBottom: '1rem' }}>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <UserIcon />
                </FlexItem>
                <FlexItem>
                  <Text component="h4">Face Details</Text>
                  <Text component="small">
                    Confidence: {face.confidence ? `${Math.round(face.confidence * 100)}%` : 'Unknown'}
                    {face.descriptor && ` • Has face encoding`}
                  </Text>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <FormGroup label="Suggested Matches" fieldId="suggestions">
              <div style={{ marginBottom: '1rem' }}>
                {suggestions.map((suggestion) => (
                  <Card 
                    key={suggestion.person.id} 
                    isSelectable
                    isSelected={selectedPersonId === suggestion.person.id}
                    onClick={() => {
                      setSelectedPersonId(suggestion.person.id);
                      setIsCreatingNew(false);
                    }}
                    style={{ 
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: selectedPersonId === suggestion.person.id ? '2px solid var(--pf-global--primary-color--100)' : undefined
                    }}
                  >
                    <CardBody>
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem>
                          <Text component="h5">{suggestion.person.name}</Text>
                          <Text component="small">
                            {suggestion.person.photoCount} photos • 
                            <Badge isRead style={{ marginLeft: '0.5rem' }}>
                              {Math.round(suggestion.similarity * 100)}% match
                            </Badge>
                          </Text>
                        </FlexItem>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </FormGroup>
          )}

          {/* Mode Toggle */}
          <FormGroup>
            <Flex>
              <FlexItem>
                <Button
                  variant={!isCreatingNew ? "primary" : "secondary"}
                  onClick={() => setIsCreatingNew(false)}
                  style={{ marginRight: '0.5rem' }}
                >
                  Assign to Existing Person
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant={isCreatingNew ? "primary" : "secondary"}
                  icon={<PlusIcon />}
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedPersonId('');
                  }}
                >
                  Create New Person
                </Button>
              </FlexItem>
            </Flex>
          </FormGroup>

          {/* Existing Person Selection */}
          {!isCreatingNew && (
            <FormGroup label="Select Person" fieldId="person-select">
              <select
                id="person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">Choose a person...</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.photoCount} photos)
                  </option>
                ))}
              </select>
            </FormGroup>
          )}

          {/* New Person Creation */}
          {isCreatingNew && (
            <FormGroup label="Person Name" fieldId="new-person-name" isRequired>
              <TextInput
                id="new-person-name"
                value={newPersonName}
                onChange={(_event, value) => setNewPersonName(value)}
                placeholder="Enter person's name"
                isRequired
              />
            </FormGroup>
          )}
        </Form>
      )}
    </Modal>
  );
};
