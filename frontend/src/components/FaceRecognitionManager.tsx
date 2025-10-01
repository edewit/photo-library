import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Grid,
  GridItem,
  Text,
  Progress,
  Alert,
  AlertVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  NumberInput,
} from '@patternfly/react-core';
import { 
  UserIcon, 
  PlayIcon 
} from '@patternfly/react-icons';
import { facesAPI } from '../services/api';

interface RecognitionStats {
  totalPhotosWithFaces: number;
  photosWithUnassignedFaces: number;
  totalUnassignedFaces: number;
  recognitionCandidates: number;
}

export const FaceRecognitionManager: React.FC = () => {
  const [stats, setStats] = useState<RecognitionStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [batchSize, setBatchSize] = useState(50);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await facesAPI.getRecognitionStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load recognition stats:', err);
      setError('Failed to load recognition statistics');
    }
  };

  const handleAutoProcess = async () => {
    if (!stats) return;

    setIsProcessing(true);
    setError(null);
    setResults(null);
    setProcessedCount(0);
    setTotalToProcess(Math.min(batchSize, stats.recognitionCandidates));

    try {
      const response = await facesAPI.autoProcess(batchSize, confidence);
      
      setResults(response);
      setProcessedCount(response.processedPhotos);
      
      // Refresh stats after processing
      await loadStats();
    } catch (err) {
      console.error('Auto-processing failed:', err);
      setError('Failed to auto-process photos. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressPercentage = () => {
    if (totalToProcess === 0) return 0;
    return Math.round((processedCount / totalToProcess) * 100);
  };


  return (
    <div>
      <Card>
        <CardTitle>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <UserIcon style={{ marginRight: '0.5rem' }} />
              Face Recognition Manager
            </FlexItem>
          </Flex>
        </CardTitle>
        <CardBody>
          {/* Statistics */}
          {stats && (
            <Grid hasGutter style={{ marginBottom: '2rem' }}>
              <GridItem md={6} lg={3}>
                <Card isCompact>
                  <CardBody>
                    <Text component="h4">{stats.totalPhotosWithFaces}</Text>
                    <Text component="small">Photos with Faces</Text>
                  </CardBody>
                </Card>
              </GridItem>
              
              <GridItem md={6} lg={3}>
                <Card isCompact>
                  <CardBody>
                    <Text component="h4">{stats.photosWithUnassignedFaces}</Text>
                    <Text component="small">Photos Needing Processing</Text>
                  </CardBody>
                </Card>
              </GridItem>
              
              <GridItem md={6} lg={3}>
                <Card isCompact>
                  <CardBody>
                    <Text component="h4">{stats.totalUnassignedFaces}</Text>
                    <Text component="small">Unassigned Faces</Text>
                  </CardBody>
                </Card>
              </GridItem>
              
              <GridItem md={6} lg={3}>
                <Card isCompact>
                  <CardBody>
                    <Text component="h4" style={{ color: '#007bff' }}>
                      {stats.recognitionCandidates}
                    </Text>
                    <Text component="small">Recognition Candidates</Text>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          )}

          {/* Processing Controls */}
          <Form>
            <Grid hasGutter>
              <GridItem md={6} lg={4}>
                <FormGroup label="Confidence Level" fieldId="confidence-select">
                  <select
                    id="confidence-select"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value as 'high' | 'medium' | 'low')}
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px' 
                    }}
                  >
                    <option value="high">High (85%+ similarity)</option>
                    <option value="medium">Medium (75%+ similarity)</option>
                    <option value="low">Low (65%+ similarity)</option>
                  </select>
                </FormGroup>
              </GridItem>

              <GridItem md={6} lg={4}>
                <FormGroup label="Batch Size" fieldId="batch-size">
                  <NumberInput
                    value={batchSize}
                    onMinus={() => setBatchSize(Math.max(10, batchSize - 10))}
                    onPlus={() => setBatchSize(Math.min(100, batchSize + 10))}
                    onChange={(event) => {
                      const value = parseInt((event.target as HTMLInputElement).value);
                      setBatchSize(isNaN(value) ? 50 : Math.min(100, Math.max(10, value)));
                    }}
                    min={10}
                    max={100}
                  />
                </FormGroup>
              </GridItem>

              <GridItem md={12} lg={4}>
                <FormGroup label=" " fieldId="process-button">
                  <Button
                    variant="primary"
                    icon={<PlayIcon />}
                    onClick={handleAutoProcess}
                    isDisabled={isProcessing || !stats || stats.recognitionCandidates === 0}
                    isLoading={isProcessing}
                    style={{ width: '100%' }}
                  >
                    {isProcessing ? 'Processing...' : 'Start Auto-Recognition'}
                  </Button>
                </FormGroup>
              </GridItem>
            </Grid>
          </Form>

          {/* Processing Progress */}
          {isProcessing && (
            <div style={{ marginTop: '2rem' }}>
              <Text component="h4">Processing Photos...</Text>
              <Progress 
                value={getProgressPercentage()} 
                title="Recognition Progress"
                style={{ marginTop: '1rem' }}
              />
              <Text component="small" style={{ marginTop: '0.5rem', display: 'block' }}>
                Processed {processedCount} of {totalToProcess} photos
              </Text>
            </div>
          )}

          {/* Results */}
          {results && !isProcessing && (
            <Alert 
              variant={AlertVariant.success} 
              title="Auto-Recognition Complete"
              style={{ marginTop: '2rem' }}
            >
              <Text>
                Processed <strong>{results.processedPhotos}</strong> photos and made{' '}
                <strong>{results.totalAssignments}</strong> automatic face assignments.
              </Text>
              <Button 
                variant="link" 
                onClick={loadStats}
                style={{ marginTop: '0.5rem' }}
              >
                Refresh Statistics
              </Button>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert 
              variant={AlertVariant.danger} 
              title="Processing Error"
              style={{ marginTop: '2rem' }}
            >
              {error}
            </Alert>
          )}

          {/* Info */}
          <Alert 
            variant={AlertVariant.info} 
            title="How Auto-Recognition Works"
            style={{ marginTop: '2rem' }}
            isInline
          >
            <Text>
              Auto-recognition compares face descriptors from unassigned faces to known people in your library. 
              Higher confidence levels require more similarity but are more accurate. 
              You can always manually review and adjust assignments afterward.
            </Text>
          </Alert>
        </CardBody>
      </Card>
    </div>
  );
};
