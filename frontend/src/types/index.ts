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
