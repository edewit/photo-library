import exifr from 'exifr';
import { PhotoMetadata } from '../types';

export async function extractExifData(
  filePath: string,
  filename: string,
  originalName: string,
  size: number,
  mimeType: string
): Promise<PhotoMetadata> {
  try {
    // Check if it's a raw file for logging
    const ext = originalName.split('.').pop()?.toLowerCase();
    const isRaw = ext && [
      'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 
      'dng', 'raw', 'rwl', 'rw2', 'orf', 'raf', 'pef', 'ptx', 
      'srw', 'dcr', 'k25', 'kdc', 'mrw', 'x3f', '3fr', 'ari',
      'bay', 'cap', 'iiq', 'eip', 'dcs', 'drf', 'erf',
      'fff', 'mef', 'mos', 'pxn', 'r3d', 'rwz'
    ].includes(ext);
    
    if (isRaw) {
      console.log(`Extracting EXIF from raw file: ${originalName}`);
    }
    
    const exifData = await exifr.parse(filePath, {
      gps: true,
      ifd0: true,
      exif: true,
      // Enable additional parsing for raw files
      tiff: true,
      ifd1: true,
      iptc: true,
      icc: true
    } as any);

    const metadata: PhotoMetadata = {
      filename,
      originalName,
      size,
      mimeType
    };

    if (exifData) {
      // Basic image properties
      if (exifData.ExifImageWidth) metadata.width = exifData.ExifImageWidth;
      if (exifData.ExifImageHeight) metadata.height = exifData.ExifImageHeight;
      if (exifData.DateTimeOriginal) {
        metadata.dateTime = new Date(exifData.DateTimeOriginal);
      } else if (exifData.DateTime) {
        metadata.dateTime = new Date(exifData.DateTime);
      }

      // GPS data
      if (exifData.latitude && exifData.longitude) {
        metadata.gps = {
          latitude: exifData.latitude,
          longitude: exifData.longitude
        };
        if (exifData.GPSAltitude) {
          metadata.gps.altitude = exifData.GPSAltitude;
        }
      }

      // Camera information
      metadata.camera = {
        make: exifData.Make,
        model: exifData.Model,
        software: exifData.Software
      };

      // Camera settings
      metadata.settings = {
        iso: exifData.ISO,
        fNumber: exifData.FNumber,
        exposureTime: exifData.ExposureTime?.toString(),
        focalLength: exifData.FocalLength,
        flash: exifData.Flash === 1
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return {
      filename,
      originalName,
      size,
      mimeType
    };
  }
}
