import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { FaceData } from '../types';

/**
 * Generate an avatar image by cropping a face from a photo
 */
export async function generatePersonAvatar(
  photoPath: string,
  faceData: FaceData,
  personId: string,
  uploadsDir: string
): Promise<string> {
  try {
    // Create avatars directory if it doesn't exist
    const avatarsDir = path.join(uploadsDir, 'avatars');
    await fs.mkdir(avatarsDir, { recursive: true });

    // Generate avatar filename
    const avatarFilename = `avatar_${personId}.jpg`;
    const avatarPath = path.join(avatarsDir, avatarFilename);

    // Get face bounding box with some padding
    const { x, y, width, height } = faceData.boundingBox;
    const padding = Math.max(width, height) * 0.3; // 30% padding around face
    
    // Calculate crop bounds with padding, ensuring we don't go outside image bounds
    const cropX = Math.max(0, Math.round(x - padding));
    const cropY = Math.max(0, Math.round(y - padding));
    const cropWidth = Math.round(width + (padding * 2));
    const cropHeight = Math.round(height + (padding * 2));

    // Get image metadata to check bounds
    const imageMetadata = await sharp(photoPath).metadata();
    const maxWidth = imageMetadata.width || cropWidth;
    const maxHeight = imageMetadata.height || cropHeight;

    // Ensure crop doesn't exceed image bounds
    const finalCropWidth = Math.min(cropWidth, maxWidth - cropX);
    const finalCropHeight = Math.min(cropHeight, maxHeight - cropY);

    // Crop the face region and resize to standard avatar size
    await sharp(photoPath)
      .extract({
        left: cropX,
        top: cropY,
        width: finalCropWidth,
        height: finalCropHeight
      })
      .resize(200, 200, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 85 })
      .toFile(avatarPath);

    // Return relative path for storage in database
    return `avatars/${avatarFilename}`;
  } catch (error) {
    console.error('Error generating person avatar:', error);
    throw new Error('Failed to generate avatar');
  }
}

/**
 * Delete an existing avatar file
 */
export async function deletePersonAvatar(avatarPath: string, uploadsDir: string): Promise<void> {
  try {
    const fullAvatarPath = path.join(uploadsDir, avatarPath);
    await fs.unlink(fullAvatarPath);
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.warn('Could not delete avatar file:', avatarPath, error);
  }
}

/**
 * Update person avatar with the best quality face crop
 * This should be called when a new face is assigned to a person
 */
export async function updatePersonAvatarIfBetter(
  photoPath: string,
  faceData: FaceData,
  personId: string,
  currentAvatarPath: string | null,
  uploadsDir: string
): Promise<string | null> {
  try {
    // If no current avatar, always generate one
    if (!currentAvatarPath) {
      return await generatePersonAvatar(photoPath, faceData, personId, uploadsDir);
    }

    // For now, keep the first avatar. In the future, we could implement
    // quality comparison (face size, confidence, image quality, etc.)
    // and only replace if the new face is significantly better
    
    return currentAvatarPath;
  } catch (error) {
    console.error('Error updating person avatar:', error);
    return currentAvatarPath;
  }
}
