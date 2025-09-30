// File utility functions

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if a file is a raw camera format
export function isRawFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  const rawExtensions = [
    'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 
    'dng', 'raw', 'rwl', 'rw2', 'orf', 'raf', 'pef', 'ptx', 
    'srw', 'dcr', 'k25', 'kdc', 'mrw', 'x3f', '3fr', 'ari',
    'bay', 'cap', 'iiq', 'eip', 'dcs', 'drf', 'erf',
    'fff', 'mef', 'mos', 'nrw', 'pxn', 'r3d', 'rwz'
  ];
  return rawExtensions.includes(ext);
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Get file type description
export function getFileTypeDescription(filename: string): string {
  const ext = getFileExtension(filename);
  
  if (isRawFile(filename)) {
    const cameraFormats: Record<string, string> = {
      'cr2': 'Canon Raw v2',
      'cr3': 'Canon Raw v3', 
      'crw': 'Canon Raw',
      'nef': 'Nikon Electronic Format',
      'nrw': 'Nikon Raw',
      'arw': 'Sony Raw',
      'srf': 'Sony Raw',
      'sr2': 'Sony Raw v2',
      'dng': 'Adobe Digital Negative',
      'orf': 'Olympus Raw Format',
      'raf': 'Fuji Raw Format',
      'pef': 'Pentax Electronic Format',
      'rw2': 'Panasonic Raw v2',
      'x3f': 'Sigma Raw Format'
    };
    
    return cameraFormats[ext] || `${ext.toUpperCase()} Raw Format`;
  }
  
  const standardFormats: Record<string, string> = {
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'webp': 'WebP Image',
    'tiff': 'TIFF Image',
    'tif': 'TIFF Image',
    'bmp': 'Bitmap Image'
  };
  
  return standardFormats[ext] || `${ext.toUpperCase()} File`;
}

