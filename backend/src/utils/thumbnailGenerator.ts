import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import exifr from 'exifr';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check if a file is a raw format based on extension
function isRawFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const rawExtensions = [
    '.cr2', '.cr3', '.crw', '.nef', '.nrw', '.arw', '.srf', '.sr2', 
    '.dng', '.raw', '.rwl', '.rw2', '.orf', '.raf', '.pef', '.ptx', 
    '.srw', '.dcr', '.k25', '.kdc', '.mrw', '.x3f', '.3fr', '.ari',
    '.bay', '.cap', '.iiq', '.eip', '.dcs', '.drf', '.erf',
    '.fff', '.mef', '.mos', '.nrw', '.pxn', '.r3d', '.rwz'
  ];
  return rawExtensions.includes(ext);
}

// Check if dcraw is available on the system
let dcrawAvailable: boolean | null = null;
async function isDcrawAvailable(): Promise<boolean> {
  if (dcrawAvailable !== null) {
    return dcrawAvailable;
  }
  
  try {
    // Use 'which' command to check if dcraw is in PATH
    await execAsync('which dcraw');
    dcrawAvailable = true;
    console.log('dcraw is available for raw file processing');
    return true;
  } catch (error) {
    // If 'which' fails, try running dcraw directly (it should exist but return error without files)
    try {
      await execAsync('dcraw 2>/dev/null || true');
      dcrawAvailable = true;
      console.log('dcraw is available for raw file processing');
      return true;
    } catch (secondError) {
      dcrawAvailable = false;
      console.log('dcraw is not available, will use embedded thumbnails only');
      return false;
    }
  }
}

// Generate thumbnail using dcraw for raw files
async function generateThumbnailWithDcraw(originalPath: string, thumbnailPath: string): Promise<boolean> {
  try {
    console.log(`Attempting to generate thumbnail using dcraw for: ${originalPath}`);
    
    // First, try to extract embedded thumbnail with dcraw
    const tempThumbPath = `${originalPath}.thumb.jpg`;
    
    try {
      // Extract embedded thumbnail
      await execAsync(`dcraw -e "${originalPath}"`);
      
      // Check if the thumbnail was created
      try {
        await fs.access(tempThumbPath);
        console.log(`dcraw extracted embedded thumbnail: ${tempThumbPath}`);
        
        // Process the extracted thumbnail with sharp
        await sharp(tempThumbPath)
          .rotate() // Auto-rotate based on EXIF orientation
          .resize(300, 300, {
            fit: 'cover',
            position: 'centre'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        // Clean up temporary file
        await fs.unlink(tempThumbPath);
        console.log(`Successfully created thumbnail using dcraw embedded extraction`);
        return true;
      } catch (accessError) {
        console.log(`No embedded thumbnail extracted by dcraw`);
      }
    } catch (embedError) {
      console.log(`dcraw embedded extraction failed: ${embedError instanceof Error ? embedError.message : 'Unknown error'}`);
    }
    
    // If embedded extraction failed, try full conversion with dcraw
    console.log(`Attempting full raw conversion with dcraw`);
    const tempTiffPath = `${originalPath}.temp.tiff`;
    
    try {
      // Convert raw to TIFF format (Sharp supports TIFF better than PPM)
      // Use -T flag for TIFF output, -h for half-size (faster), -q 0 for speed
      // -t 0 preserves original orientation (let Sharp handle rotation)
      await execAsync(`dcraw -T -h -q 0 -H 1 -w -t 0 "${originalPath}"`);
      
      // dcraw creates a .tiff file with the same base name
      const baseName = originalPath.replace(/\.[^/.]+$/, "");
      const dcrawTiffPath = `${baseName}.tiff`;
      
      // Check if the TIFF was created
      await fs.access(dcrawTiffPath);
      console.log(`dcraw created TIFF file: ${dcrawTiffPath}`);
      
      // Convert TIFF to thumbnail with sharp
      await sharp(dcrawTiffPath)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(300, 300, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      // Clean up temporary file
      await fs.unlink(dcrawTiffPath);
      console.log(`Successfully created thumbnail using dcraw TIFF conversion`);
      return true;
    } catch (conversionError) {
      console.log(`dcraw TIFF conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      
      // Clean up any temporary files
      try {
        const baseName = originalPath.replace(/\.[^/.]+$/, "");
        const dcrawTiffPath = `${baseName}.tiff`;
        await fs.unlink(dcrawTiffPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Fallback: try PPM with ImageMagick convert if available
      try {
        console.log(`Trying PPM conversion as fallback`);
        const tempPpmPath = `${originalPath}.temp.ppm`;
        
        // Convert raw to PPM
        // -t 0 preserves original orientation (let Sharp handle rotation)
        await execAsync(`dcraw -c -h -q 0 -H 1 -w -t 0 "${originalPath}" > "${tempPpmPath}"`);
        
        // Check if PPM was created
        await fs.access(tempPpmPath);
        console.log(`dcraw created PPM file: ${tempPpmPath}`);
        
        // Try to convert PPM to JPEG using ImageMagick if available
        try {
          await execAsync(`convert "${tempPpmPath}" "${tempTiffPath}"`);
          
          // Now use Sharp on the converted file
          await sharp(tempTiffPath)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(300, 300, {
              fit: 'cover',
              position: 'centre'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          // Clean up temporary files
          await fs.unlink(tempPpmPath);
          await fs.unlink(tempTiffPath);
          console.log(`Successfully created thumbnail using dcraw PPM + ImageMagick conversion`);
          return true;
        } catch (magickError) {
          console.log(`ImageMagick conversion failed: ${magickError instanceof Error ? magickError.message : 'Unknown error'}`);
          
          // Clean up temporary files
          try {
            await fs.unlink(tempPpmPath);
            await fs.unlink(tempTiffPath);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      } catch (ppmError) {
        console.log(`PPM fallback also failed: ${ppmError instanceof Error ? ppmError.message : 'Unknown error'}`);
      }
    }
    
    return false;
  } catch (error) {
    console.log(`dcraw processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Extract embedded thumbnail from raw file using exifr
async function extractEmbeddedThumbnail(filePath: string, thumbnailPath: string): Promise<boolean> {
  try {
    console.log(`Attempting to extract embedded thumbnail from: ${filePath}`);
    
    // Try to extract thumbnail using exifr
    const thumbnail = await exifr.thumbnail(filePath);
    
    if (thumbnail && thumbnail instanceof Uint8Array) {
      console.log(`Found embedded thumbnail, size: ${thumbnail.length} bytes`);
      
      // Process the thumbnail with sharp to ensure consistent size and format
      await sharp(Buffer.from(thumbnail))
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(300, 300, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      console.log(`Successfully created thumbnail from embedded data`);
      return true;
    }
    
    console.log(`No embedded thumbnail found in raw file`);
    return false;
  } catch (error) {
    console.log(`Failed to extract embedded thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Generate a placeholder thumbnail for raw files
async function generateRawPlaceholder(thumbnailPath: string, filename: string): Promise<void> {
  const ext = path.extname(filename).toLowerCase();
  
  // Create a simple placeholder image with text
  await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 3,
      background: { r: 100, g: 100, b: 100 }
    }
  })
  .composite([{
    input: Buffer.from(
      `<svg width="300" height="300">
        <rect width="300" height="300" fill="#666666"/>
        <text x="150" y="130" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">RAW</text>
        <text x="150" y="160" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">${ext.toUpperCase()}</text>
        <text x="150" y="190" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#cccccc">No preview available</text>
      </svg>`
    ),
    top: 0,
    left: 0,
  }])
  .jpeg({ quality: 80 })
  .toFile(thumbnailPath);
}

export async function generateThumbnail(
  originalPath: string,
  filename: string,
  uploadsDir: string
): Promise<string> {
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  
  // Ensure thumbnails directory exists
  await fs.mkdir(thumbnailsDir, { recursive: true });
  
  const thumbnailFilename = `thumb_${filename}`;
  const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
  
  try {
    // Check if it's a raw file
    if (isRawFile(filename)) {
      console.log(`Processing raw file: ${filename}`);
      
      // First, try to extract embedded thumbnail using exifr
      const embeddedSuccess = await extractEmbeddedThumbnail(originalPath, thumbnailPath);
      
      if (embeddedSuccess) {
        return `thumbnails/${thumbnailFilename}`;
      }
      
      // Second, try dcraw if available
      const dcrawAvailable = await isDcrawAvailable();
      if (dcrawAvailable) {
        console.log(`No embedded thumbnail found, trying dcraw for: ${filename}`);
        const dcrawSuccess = await generateThumbnailWithDcraw(originalPath, thumbnailPath);
        
        if (dcrawSuccess) {
          return `thumbnails/${thumbnailFilename}`;
        }
      }
      
      // If all else fails, generate placeholder
      console.log(`No thumbnail extraction methods succeeded, generating placeholder for: ${filename}`);
      await generateRawPlaceholder(thumbnailPath, filename);
      return `thumbnails/${thumbnailFilename}`;
    }
    
    // For regular image files, use sharp as before
    await sharp(originalPath)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(300, 300, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    return `thumbnails/${thumbnailFilename}`;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    
    // If sharp fails, try raw file processing (might be a raw file with wrong extension)
    try {
      console.log(`Sharp failed for ${filename}, trying raw file processing`);
      
      // Try embedded thumbnail extraction first
      const embeddedSuccess = await extractEmbeddedThumbnail(originalPath, thumbnailPath);
      if (embeddedSuccess) {
        return `thumbnails/${thumbnailFilename}`;
      }
      
      // Try dcraw if available
      const dcrawAvailable = await isDcrawAvailable();
      if (dcrawAvailable) {
        console.log(`Trying dcraw for failed file: ${filename}`);
        const dcrawSuccess = await generateThumbnailWithDcraw(originalPath, thumbnailPath);
        if (dcrawSuccess) {
          return `thumbnails/${thumbnailFilename}`;
        }
      }
      
      // If all methods fail, generate a placeholder
      console.log(`All processing methods failed, generating placeholder thumbnail`);
      await generateRawPlaceholder(thumbnailPath, filename);
      return `thumbnails/${thumbnailFilename}`;
    } catch (fallbackError) {
      console.error('Error in fallback thumbnail generation:', fallbackError);
      throw new Error('Failed to generate thumbnail');
    }
  }
}
