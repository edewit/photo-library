export interface FaceData {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{
    x: number;
    y: number;
  }>;
  descriptor?: number[]; // 128-dimensional face encoding
  confidence?: number;
  personId?: string; // Optional: if identified
  personName?: string; // Optional: person's name for display
}

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  faceDescriptors: number[][];
  photoCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonSuggestion {
  person: any; // Use any to avoid circular type issues
  similarity: number;
}

export interface FaceMetadata {
  count: number;
  detected: boolean;
  data: FaceData[];
  processedAt?: Date;
}

export interface PhotoMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  dateTime?: Date;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  camera?: {
    make?: string;
    model?: string;
    software?: string;
  };
  settings?: {
    iso?: number;
    fNumber?: number;
    exposureTime?: string;
    focalLength?: number;
    flash?: boolean;
  };
  faces?: FaceMetadata;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
  photoCount: number;
}

export interface Photo {
  id: string;
  eventId: string;
  filename: string;
  originalName: string;
  filePath: string;
  thumbnailPath: string;
  metadata: PhotoMetadata;
  createdAt: Date;
  updatedAt: Date;
}
