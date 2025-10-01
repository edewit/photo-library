import axios from 'axios';
import { Event, Photo, EventSuggestion, UploadResponse, PlacesResponse, LocationPhotosResponse, SearchFilters, SearchResult, SearchSuggestions, FaceData, Person, PersonSuggestion } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventsAPI = {
  getAll: (): Promise<Event[]> => 
    api.get('/events').then(res => res.data),
    
  getById: (id: string): Promise<Event> => 
    api.get(`/events/${id}`).then(res => res.data),
    
  create: (event: Partial<Event>): Promise<Event> => 
    api.post('/events', event).then(res => res.data),
    
  update: (id: string, event: Partial<Event>): Promise<Event> => 
    api.put(`/events/${id}`, event).then(res => res.data),
    
  delete: (id: string): Promise<void> => 
    api.delete(`/events/${id}`).then(res => res.data),
    
  getPhotos: (id: string): Promise<Photo[]> => 
    api.get(`/events/${id}/photos`).then(res => res.data),
    
  setCoverPhoto: (eventId: string, photoId: string): Promise<Event> =>
    api.put(`/events/${eventId}/cover/${photoId}`).then(res => res.data),
};

export const photosAPI = {
  getById: (id: string): Promise<Photo> => 
    api.get(`/photos/${id}`).then(res => res.data),
    
  upload: (files: FileList): Promise<UploadResponse> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });
    
    return api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  
  organize: (events: EventSuggestion[]): Promise<{ message: string; events: Event[] }> => 
    api.post('/photos/organize', { events }).then(res => res.data),
    
  delete: (id: string): Promise<void> => 
    api.delete(`/photos/${id}`).then(res => res.data),
    
  search: (filters: SearchFilters): Promise<SearchResult> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return api.get(`/photos/search?${params.toString()}`).then(res => res.data);
  },
  
  getSuggestions: (type: 'camera' | 'make' | 'filename', query: string): Promise<SearchSuggestions> =>
    api.get(`/photos/search/suggestions?type=${type}&q=${encodeURIComponent(query)}`).then(res => res.data),
    
  getFileUrl: (photoIdOrFilename: string): string => `/api/photos/file/${photoIdOrFilename}`,
  getThumbnailUrl: (photoIdOrFilename: string): string => `/api/photos/thumbnail/${photoIdOrFilename}`,
};

export const placesAPI = {
  getAll: (): Promise<PlacesResponse> => 
    api.get('/places').then(res => res.data),
    
  getLocationPhotos: (latitude: number, longitude: number): Promise<LocationPhotosResponse> => 
    api.get(`/places/location/${latitude}/${longitude}`).then(res => res.data),
};

export const facesAPI = {
  updatePhotoFaces: (photoId: string, faces: FaceData[]): Promise<{ message: string; faceCount: number; photoId: string }> =>
    api.post(`/faces/photos/${photoId}/faces`, { faces }).then(res => res.data),
    
  getDetectionStatus: (processed?: boolean): Promise<{ photos: Array<{ id: string; filename: string; originalName: string; eventName: string; faces: { count: number; detected: boolean; data: FaceData[] } }>; total: number }> =>
    api.get(`/faces/photos/detection-status${processed !== undefined ? `?processed=${processed}` : ''}`).then(res => res.data),
    
  getStats: (): Promise<{ totalPhotos: number; processedPhotos: number; unprocessedPhotos: number; photosWithFaces: number; photosWithoutFaces: number; totalFaces: number; averageFacesPerPhoto: number }> =>
    api.get('/faces/stats').then(res => res.data),
    
  getPhotosByFaceCount: (min?: number, max?: number, page = 1, limit = 20): Promise<{ photos: Array<Photo & { eventName: string; faceCount: number; faces: FaceData[] }>; pagination: any }> => {
    const params = new URLSearchParams();
    if (min !== undefined) params.append('min', min.toString());
    if (max !== undefined) params.append('max', max.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return api.get(`/faces/photos/by-face-count?${params.toString()}`).then(res => res.data);
  },
    
  resetPhotoFaces: (photoId: string): Promise<{ message: string; photoId: string }> =>
    api.delete(`/faces/photos/${photoId}/faces`).then(res => res.data),

  // Face Recognition API
  recognizePhoto: (photoId: string, minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<{
    message: string;
    photoId: string;
    recognitionResults: Array<{
      faceIndex: number;
      personId: string;
      personName: string;
      similarity: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
    assignmentsCount: number;
  }> =>
    api.post(`/faces/photos/${photoId}/recognize`, { minConfidence }).then(res => res.data),

  batchRecognize: (photoIds: string[], minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<{
    message: string;
    processedPhotos: number;
    totalAssignments: number;
    results: any;
  }> =>
    api.post('/faces/batch-recognize', { photoIds, minConfidence }).then(res => res.data),

  autoProcess: (limit: number = 50, minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<{
    message: string;
    processedPhotos: number;
    totalAssignments: number;
    results: any;
  }> =>
    api.post('/faces/auto-process', { limit, minConfidence }).then(res => res.data),

  getRecognitionStats: (): Promise<{
    totalPhotosWithFaces: number;
    photosWithUnassignedFaces: number;
    totalUnassignedFaces: number;
    recognitionCandidates: number;
  }> =>
    api.get('/faces/recognition-stats').then(res => res.data),

  getUnprocessedPhotos: (limit: number = 50): Promise<{
    photos: Array<{
      id: string;
      filename: string;
      originalName: string;
      eventName: string;
      totalFaces: number;
      unassignedFaces: number;
      facesWithDescriptors: number;
      dateTime: string;
    }>;
    total: number;
  }> =>
    api.get(`/faces/unprocessed-photos?limit=${limit}`).then(res => res.data),
};

export const personsAPI = {
  getAll: (sortBy = 'name', sortOrder = 'asc', search?: string): Promise<{ persons: Person[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    if (search) params.append('search', search);
    
    return api.get(`/persons?${params.toString()}`).then(res => res.data);
  },
  
  getById: (id: string): Promise<Person> =>
    api.get(`/persons/${id}`).then(res => res.data),
    
  create: (name: string, notes?: string, faceDescriptor?: number[]): Promise<Person> =>
    api.post('/persons', { name, notes, faceDescriptor }).then(res => res.data),
    
  update: (id: string, name?: string, notes?: string): Promise<Person> =>
    api.put(`/persons/${id}`, { name, notes }).then(res => res.data),
    
  delete: (id: string): Promise<{ message: string }> =>
    api.delete(`/persons/${id}`).then(res => res.data),
    
  getPhotos: (id: string, page = 1, limit = 20): Promise<{ person: Person; photos: Array<Photo & { eventName: string; faces: FaceData[] }>; pagination: any }> =>
    api.get(`/persons/${id}/photos?page=${page}&limit=${limit}`).then(res => res.data),
    
  assignFace: (photoId: string, faceIndex: number, personId: string): Promise<{ message: string; photo: any; person: any }> =>
    api.post('/persons/assign-face', { photoId, faceIndex, personId }).then(res => res.data),
    
  unassignFace: (photoId: string, faceIndex: number): Promise<{ message: string; photo: any }> =>
    api.post('/persons/unassign-face', { photoId, faceIndex }).then(res => res.data),
    
  getSuggestions: (faceDescriptor: number[], threshold = 0.6): Promise<{ suggestions: PersonSuggestion[]; threshold: number }> =>
    api.post('/persons/suggest-person', { faceDescriptor, threshold }).then(res => res.data),
    
  getUnassignedFaces: (page = 1, limit = 20): Promise<{ faces: Array<{ photoId: string; faceIndex: number; face: FaceData; photo: any }>; pagination: any }> =>
    api.get(`/persons/unassigned-faces?page=${page}&limit=${limit}`).then(res => res.data),
};

export default api;
