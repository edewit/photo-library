import axios from 'axios';
import { Event, Photo, EventSuggestion, UploadResponse, PlacesResponse, LocationPhotosResponse, SearchFilters, SearchResult, SearchSuggestions } from '../types';

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

export default api;
