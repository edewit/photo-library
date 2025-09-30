import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Progress,
  Text,
  TextContent,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import { photosAPI } from '../services/api';
import { UploadResponse } from '../types';
import { useToast } from '../hooks/useToast';

interface PhotoUploadProps {
  onUploadComplete: (result: UploadResponse) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addToast } = useToast();

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.tiff', '.bmp'],
      // Raw file formats
      'application/octet-stream': [
        '.cr2', '.cr3', '.crw', '.nef', '.nrw', '.arw', '.srf', '.sr2', 
        '.dng', '.raw', '.rwl', '.rw2', '.orf', '.raf', '.pef', '.ptx', 
        '.srw', '.dcr', '.k25', '.kdc', '.mrw', '.x3f', '.3fr', '.ari',
        '.bay', '.cap', '.iiq', '.eip', '.dcs', '.drf', '.erf',
        '.fff', '.mef', '.mos', '.pxn', '.r3d', '.rwz'
      ]
    },
    multiple: true,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (acceptedFiles.length === 0) return;

    try {
      setUploading(true);
      setProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const fileList = acceptedFiles.reduce((dt, file) => {
        dt.items.add(file);
        return dt;
      }, new DataTransfer()).files;

      const result = await photosAPI.upload(fileList);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      addToast('success', 'Upload successful!', `${acceptedFiles.length} ${acceptedFiles.length === 1 ? 'photo' : 'photos'} uploaded and processed.`);
      
      setTimeout(() => {
        onUploadComplete(result);
        setProgress(0);
        setUploading(false);
      }, 500);

    } catch (err) {
      addToast('danger', 'Upload failed', err instanceof Error ? err.message : 'An error occurred during upload. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardTitle>Upload Photos</CardTitle>
      <CardBody>
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon />
          <TextContent className="pf-u-mt-md">
            {isDragActive ? (
              <Text>Drop the photos here...</Text>
            ) : (
              <Text>
                Drag and drop photos here, or click to select files
                <br />
                <small>Supported formats: JPEG, PNG, GIF, WebP, TIFF, BMP</small>
              </Text>
            )}
          </TextContent>
        </div>

        {acceptedFiles.length > 0 && (
          <div className="pf-u-mt-md">
            <Text component="h4">Selected files ({acceptedFiles.length}):</Text>
            <ul style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {acceptedFiles.map((file, index) => (
                <li key={index}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div className="pf-u-mt-md">
            <Text>Uploading and processing photos...</Text>
            <Progress value={progress} className="pf-u-mt-sm" />
          </div>
        )}

        <Flex className="pf-u-mt-md">
          <FlexItem>
            <Button
              variant="primary"
              onClick={handleUpload}
              isDisabled={acceptedFiles.length === 0 || uploading}
              isLoading={uploading}
            >
              Upload {acceptedFiles.length > 0 && `(${acceptedFiles.length} files)`}
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
