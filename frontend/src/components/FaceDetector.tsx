import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import {
  Button,
  Spinner,
  Alert,
  AlertVariant,
  Flex,
  FlexItem,
  Text,
  Badge,
  Card,
  CardBody,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon, UserIcon, TagIcon } from '@patternfly/react-icons';
import { FaceData, Photo } from '../types';
import { FaceAssignment } from './FaceAssignment';
import { facesAPI } from '../services/api';

interface FaceDetectorProps {
  photo: Photo;
  onFacesDetected?: (faces: FaceData[]) => void;
  showBoundingBoxes?: boolean;
}

export const FaceDetector: React.FC<FaceDetectorProps> = ({
  photo,
  onFacesDetected,
  showBoundingBoxes = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<FaceData[]>([]);
  const [showBoxes, setShowBoxes] = useState(showBoundingBoxes);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(-1);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // We'll need to serve models from public/models
        
        // Load required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load face detection models. Please check if model files are available.');
      }
    };

    loadModels();
  }, []);

  // Handle window resize to update canvas positioning
  useEffect(() => {
    const handleResize = () => {
      if (detectedFaces.length > 0 && showBoxes) {
        // Redraw with new dimensions
        detectFaces();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectedFaces.length, showBoxes]);

  // Detect faces in the image
  const detectFaces = async () => {
    if (!imageRef.current || !canvasRef.current || !isModelsLoaded) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const image = imageRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match the displayed image size (not natural size)
      const displayedWidth = image.offsetWidth;
      const displayedHeight = image.offsetHeight;
      
      canvas.width = displayedWidth;
      canvas.height = displayedHeight;
      canvas.style.width = displayedWidth + 'px';
      canvas.style.height = displayedHeight + 'px';

      // Detect faces with landmarks and descriptors
      const detections = await faceapi
        .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Calculate scaling factors
      const scaleX = displayedWidth / image.naturalWidth;
      const scaleY = displayedHeight / image.naturalHeight;

      // Convert detections to our FaceData format (store original coordinates)
      const faces: FaceData[] = detections.map((detection) => ({
        boundingBox: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
        landmarks: detection.landmarks.positions.map(point => ({
          x: point.x,
          y: point.y,
        })),
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score,
      }));

      setDetectedFaces(faces);

      // Draw bounding boxes if enabled
      if (showBoxes) {
        drawBoundingBoxes(detections, scaleX, scaleY);
      }

      // Notify parent component
      if (onFacesDetected) {
        onFacesDetected(faces);
      }

    } catch (err) {
      console.error('Error detecting faces:', err);
      setError('Failed to detect faces in the image.');
    } finally {
      setIsLoading(false);
    }
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = (
    detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }, faceapi.FaceLandmarks68>>[],
    scaleX: number,
    scaleY: number
  ) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    detections.forEach((detection, index) => {
      const box = detection.detection.box;
      
      // Scale coordinates to match displayed image
      const scaledX = box.x * scaleX;
      const scaledY = box.y * scaleY;
      const scaledWidth = box.width * scaleX;
      const scaledHeight = box.height * scaleY;
      
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // Draw confidence score
      ctx.fillStyle = '#00ff00';
      ctx.font = `${Math.max(12, 16 * Math.min(scaleX, scaleY))}px Arial`;
      ctx.fillText(
        `Face ${index + 1} (${Math.round(detection.detection.score * 100)}%)`,
        scaledX,
        scaledY - 5
      );

      // Draw landmarks (optional, scaled)
      if (detection.landmarks) {
        ctx.fillStyle = '#ff0000';
        detection.landmarks.positions.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * scaleX, point.y * scaleY, Math.max(1, 2 * Math.min(scaleX, scaleY)), 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  };

  // Toggle bounding boxes visibility
  const toggleBoundingBoxes = () => {
    const newShowBoxes = !showBoxes;
    setShowBoxes(newShowBoxes);
    
    if (!newShowBoxes && canvasRef.current) {
      // Clear canvas
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else if (newShowBoxes && detectedFaces.length > 0) {
      // Redraw boxes - run detection again to get proper scaling
      detectFaces();
    }
  };

  const handleFaceAssigned = (personId: string, personName: string) => {
    // Update the local face data
    const updatedFaces = [...detectedFaces];
    if (updatedFaces[selectedFaceIndex]) {
      updatedFaces[selectedFaceIndex].personId = personId;
      updatedFaces[selectedFaceIndex].personName = personName;
      setDetectedFaces(updatedFaces);
    }
    setAssignmentModalOpen(false);
  };

  const openAssignmentModal = (faceIndex: number) => {
    setSelectedFaceIndex(faceIndex);
    setAssignmentModalOpen(true);
  };

  const handleAutoRecognize = async () => {
    if (!photo.id || detectedFaces.length === 0) return;

    setIsRecognizing(true);
    setError(null);

    try {
      const response = await facesAPI.recognizePhoto(photo.id, 'medium');
      
      // Update local face data with recognition results
      const updatedFaces = [...detectedFaces];
      response.recognitionResults.forEach(result => {
        if (result.faceIndex < updatedFaces.length) {
          updatedFaces[result.faceIndex].personId = result.personId;
          updatedFaces[result.faceIndex].personName = result.personName;
        }
      });
      
      setDetectedFaces(updatedFaces);
      
      if (response.assignmentsCount > 0) {
        console.log(`Auto-recognized ${response.assignmentsCount} faces`);
      }
    } catch (err) {
      console.error('Auto-recognition failed:', err);
      setError('Failed to auto-recognize faces. Please try manual assignment.');
    } finally {
      setIsRecognizing(false);
    }
  };

  const imageUrl = `/api/photos/file/${photo.id}`;

  return (
    <div>
      {/* Image container with relative positioning for canvas overlay */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={photo.originalName}
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          onLoad={() => {
            // Auto-detect faces if already processed
            if (photo.metadata.faces?.detected && photo.metadata.faces.count > 0) {
              setDetectedFaces(photo.metadata.faces.data);
            }
          }}
        />
        
        {/* Canvas overlay for bounding boxes */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            display: showBoxes ? 'block' : 'none'
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ marginTop: '1rem' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Button
              variant="primary"
              onClick={detectFaces}
              isDisabled={!isModelsLoaded || isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Detecting Faces...' : 'Detect Faces'}
            </Button>
          </FlexItem>
          
          {detectedFaces.length > 0 && (
            <>
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={showBoxes ? <EyeSlashIcon /> : <EyeIcon />}
                  onClick={toggleBoundingBoxes}
                >
                  {showBoxes ? 'Hide' : 'Show'} Boxes
                </Button>
              </FlexItem>
              
              <FlexItem>
                <Badge isRead>
                  {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''} detected
                </Badge>
              </FlexItem>

              <FlexItem>
                <Button
                  variant="tertiary"
                  onClick={handleAutoRecognize}
                  isDisabled={isRecognizing || detectedFaces.length === 0}
                  isLoading={isRecognizing}
                >
                  {isRecognizing ? 'Recognizing...' : 'Auto-Recognize'}
                </Button>
              </FlexItem>
            </>
          )}

          {photo.metadata.faces?.detected && (
            <FlexItem>
              <Text component="small">
                Previously detected: {photo.metadata.faces.count} faces
              </Text>
            </FlexItem>
          )}
        </Flex>

        {/* Status messages */}
        {!isModelsLoaded && !error && (
          <div style={{ marginTop: '0.5rem' }}>
            <Spinner size="sm" /> Loading face detection models...
          </div>
        )}

        {error && (
          <Alert variant={AlertVariant.danger} title="Face Detection Error" style={{ marginTop: '0.5rem' }}>
            {error}
          </Alert>
        )}

        {detectedFaces.length === 0 && !isLoading && !error && isModelsLoaded && (
          <Alert variant={AlertVariant.info} title="No Faces Detected" style={{ marginTop: '0.5rem' }}>
            No faces were found in this image. Try adjusting the detection settings or ensure the image contains clear faces.
          </Alert>
        )}
      </div>

      {/* Face List */}
      {detectedFaces.length > 0 && (
        <Card style={{ marginTop: '1rem' }}>
          <CardBody>
            <Text component="h4" style={{ marginBottom: '1rem' }}>
              <UserIcon style={{ marginRight: '0.5rem' }} />
              Detected Faces ({detectedFaces.length})
            </Text>
            
            <Grid hasGutter>
              {detectedFaces.map((face, index) => (
                <GridItem key={index} md={6} lg={4}>
                  <Card isCompact>
                    <CardBody>
                      <Flex direction={{ default: 'column' }}>
                        <FlexItem>
                          <Text component="h5">Face {index + 1}</Text>
                          {face.personName ? (
                            <Badge isRead style={{ backgroundColor: '#28a745' }}>
                              {face.personName}
                            </Badge>
                          ) : (
                            <Badge>Unassigned</Badge>
                          )}
                        </FlexItem>
                        
                        <FlexItem style={{ marginTop: '0.5rem' }}>
                          <Text component="small">
                            Confidence: {face.confidence ? `${Math.round(face.confidence * 100)}%` : 'Unknown'}
                          </Text>
                        </FlexItem>
                        
                        <FlexItem style={{ marginTop: '0.5rem' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<TagIcon />}
                            onClick={() => openAssignmentModal(index)}
                          >
                            {face.personName ? 'Reassign' : 'Assign Person'}
                          </Button>
                        </FlexItem>
                      </Flex>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}

      {/* Face Assignment Modal */}
      {assignmentModalOpen && selectedFaceIndex >= 0 && (
        <FaceAssignment
          isOpen={assignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          photoId={photo.id}
          faceIndex={selectedFaceIndex}
          face={detectedFaces[selectedFaceIndex]}
          onAssigned={handleFaceAssigned}
        />
      )}
    </div>
  );
};
