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
  createdAt: string;
  updatedAt: string;
}

export interface PersonSuggestion {
  person: Person;
  similarity: number;
}

export interface FaceMetadata {
  count: number;
  detected: boolean;
  data: FaceData[];
  processedAt?: string;
}

export interface PhotoMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  dateTime?: string;
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
  thumbnailPath?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string | Photo;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface EventSuggestion {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  photos: Array<{ filename: string; metadata: PhotoMetadata }>;
}

export interface UploadResponse {
  message: string;
  photos: Array<{ filename: string; metadata: PhotoMetadata }>;
  eventSuggestions: EventSuggestion[];
}

export interface PlacePhoto {
  id: string;
  filename: string;
  originalName: string;
  thumbnailPath: string;
  eventId: string;
  eventName: string;
  dateTime?: string;
}

export interface Place {
  latitude: number;
  longitude: number;
  photoCount: number;
  eventCount: number;
  events: string[];
  photos: PlacePhoto[];
}

export interface PlacesResponse {
  places: Place[];
  totalPlaces: number;
  totalPhotosWithLocation: number;
}

export interface LocationPhotosResponse {
  location: {
    latitude: number;
    longitude: number;
  };
  photos: Array<PlacePhoto & { 
    filePath: string;
    gps: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
  }>;
  photoCount: number;
}

export interface SearchFilters {
  q?: string;
  eventId?: string;
  startDate?: string;
  endDate?: string;
  cameraModel?: string;
  cameraMake?: string;
  minIso?: number;
  maxIso?: number;
  minFNumber?: number;
  maxFNumber?: number;
  focalLength?: number;
  hasGps?: boolean;
  fileType?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  hasFaces?: boolean;
  minFaces?: number;
  maxFaces?: number;
  personId?: string;
  personName?: string;
  sortBy?: 'dateTime' | 'filename' | 'size' | 'camera';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  photos: Array<Photo & { eventName: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchQuery: {
    q?: string;
    filters: Omit<SearchFilters, 'q' | 'page' | 'limit' | 'sortBy' | 'sortOrder'>;
    sort: {
      field: string;
      order: string;
    };
  };
}

export interface SearchSuggestions {
  suggestions: string[];
}
