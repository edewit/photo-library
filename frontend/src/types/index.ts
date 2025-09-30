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
