import { useEffect, useRef } from 'react';
import { Photo } from '../types';
import { photosAPI } from '../services/api';

interface UsePhotoPreloaderProps {
  photos: Photo[];
  currentIndex: number;
  preloadCount?: number; // How many photos ahead/behind to preload
}

export const usePhotoPreloader = ({ 
  photos, 
  currentIndex, 
  preloadCount = 1 
}: UsePhotoPreloaderProps) => {
  const preloadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const preloadQueue = useRef<Set<string>>(new Set());

  const preloadImage = (photo: Photo): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Skip if already preloaded or currently loading
      if (preloadedImages.current.has(photo.id) || preloadQueue.current.has(photo.id)) {
        resolve();
        return;
      }

      preloadQueue.current.add(photo.id);
      
      const img = new Image();
      
      img.onload = () => {
        preloadedImages.current.set(photo.id, img);
        preloadQueue.current.delete(photo.id);
        resolve();
      };
      
      img.onerror = () => {
        preloadQueue.current.delete(photo.id);
        console.warn(`Failed to preload photo: ${photo.id}`);
        reject(new Error(`Failed to preload photo: ${photo.id}`));
      };
      
      // Start loading the image
      img.src = photosAPI.getFileUrl(photo.id);
    });
  };

  const preloadThumbnail = (photo: Photo): Promise<void> => {
    return new Promise((resolve, reject) => {
      const thumbnailKey = `thumb_${photo.id}`;
      
      // Skip if already preloaded or currently loading
      if (preloadedImages.current.has(thumbnailKey) || preloadQueue.current.has(thumbnailKey)) {
        resolve();
        return;
      }

      preloadQueue.current.add(thumbnailKey);
      
      const img = new Image();
      
      img.onload = () => {
        preloadedImages.current.set(thumbnailKey, img);
        preloadQueue.current.delete(thumbnailKey);
        resolve();
      };
      
      img.onerror = () => {
        preloadQueue.current.delete(thumbnailKey);
        console.warn(`Failed to preload thumbnail: ${photo.id}`);
        reject(new Error(`Failed to preload thumbnail: ${photo.id}`));
      };
      
      // Start loading the thumbnail
      img.src = photosAPI.getThumbnailUrl(photo.id);
    });
  };

  useEffect(() => {
    if (photos.length === 0 || currentIndex < 0) return;

    const preloadAdjacentPhotos = async () => {
      const toPreload: Photo[] = [];
      
      // Determine which photos to preload
      for (let i = 1; i <= preloadCount; i++) {
        // Previous photos
        const prevIndex = currentIndex - i;
        if (prevIndex >= 0) {
          toPreload.push(photos[prevIndex]);
        }
        
        // Next photos
        const nextIndex = currentIndex + i;
        if (nextIndex < photos.length) {
          toPreload.push(photos[nextIndex]);
        }
      }

      // Preload both full images and thumbnails for smoother experience
      const preloadPromises = toPreload.flatMap(photo => [
        preloadImage(photo).catch(() => {}), // Silently handle errors
        preloadThumbnail(photo).catch(() => {}) // Silently handle errors
      ]);

      try {
        await Promise.allSettled(preloadPromises);
      } catch (error) {
        // Errors are already handled individually, this is just a safety net
        console.warn('Some preloading operations failed:', error);
      }
    };

    // Small delay to avoid blocking the UI
    const timeoutId = setTimeout(preloadAdjacentPhotos, 100);
    
    return () => clearTimeout(timeoutId);
  }, [photos, currentIndex, preloadCount]);

  // Cleanup function to clear preloaded images when component unmounts
  useEffect(() => {
    return () => {
      preloadedImages.current.clear();
      preloadQueue.current.clear();
    };
  }, []);

  // Return utility functions
  return {
    isPreloaded: (photoId: string) => preloadedImages.current.has(photoId),
    isThumbnailPreloaded: (photoId: string) => preloadedImages.current.has(`thumb_${photoId}`),
    getPreloadedImage: (photoId: string) => preloadedImages.current.get(photoId),
    getPreloadedThumbnail: (photoId: string) => preloadedImages.current.get(`thumb_${photoId}`),
    preloadedCount: preloadedImages.current.size,
    isLoading: preloadQueue.current.size > 0
  };
};
