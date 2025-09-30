import fs from 'fs/promises';
import path from 'path';

/**
 * Sanitizes a string to be safe for use as a folder name
 */
export function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 100); // Limit length to 100 characters
}

/**
 * Creates an event folder and moves photos into it
 */
export async function organizePhotosIntoEventFolder(
  eventName: string,
  photoFilenames: string[],
  uploadsDir: string
): Promise<{ eventFolderPath: string; movedFiles: Array<{ oldPath: string; newPath: string; filename: string }> }> {
  const sanitizedEventName = sanitizeFolderName(eventName);
  const eventFolderPath = path.join(uploadsDir, 'events', sanitizedEventName);
  const thumbnailsFolderPath = path.join(eventFolderPath, 'thumbnails');

  // Create event folder and thumbnails subfolder
  await fs.mkdir(eventFolderPath, { recursive: true });
  await fs.mkdir(thumbnailsFolderPath, { recursive: true });

  const movedFiles: Array<{ oldPath: string; newPath: string; filename: string }> = [];

  for (const filename of photoFilenames) {
    try {
      // Move original photo
      const oldPhotoPath = path.join(uploadsDir, filename);
      const newPhotoPath = path.join(eventFolderPath, filename);
      
      // Check if source file exists
      try {
        await fs.access(oldPhotoPath);
        await fs.rename(oldPhotoPath, newPhotoPath);
        
        movedFiles.push({
          oldPath: oldPhotoPath,
          newPath: newPhotoPath,
          filename
        });
      } catch (error) {
        console.warn(`Could not move photo ${filename}:`, error);
        continue;
      }

      // Move thumbnail
      const thumbnailFilename = `thumb_${filename}`;
      const oldThumbnailPath = path.join(uploadsDir, 'thumbnails', thumbnailFilename);
      const newThumbnailPath = path.join(thumbnailsFolderPath, thumbnailFilename);
      
      try {
        await fs.access(oldThumbnailPath);
        await fs.rename(oldThumbnailPath, newThumbnailPath);
      } catch (error) {
        console.warn(`Could not move thumbnail for ${filename}:`, error);
      }
    } catch (error) {
      console.error(`Error organizing file ${filename}:`, error);
    }
  }

  return {
    eventFolderPath,
    movedFiles
  };
}

/**
 * Gets the relative path for serving photos from event folders
 */
export function getEventPhotoPath(eventName: string, filename: string): string {
  const sanitizedEventName = sanitizeFolderName(eventName);
  return `events/${sanitizedEventName}/${filename}`;
}

/**
 * Gets the relative path for serving thumbnails from event folders
 */
export function getEventThumbnailPath(eventName: string, filename: string): string {
  const sanitizedEventName = sanitizeFolderName(eventName);
  return `events/${sanitizedEventName}/thumbnails/thumb_${filename}`;
}
