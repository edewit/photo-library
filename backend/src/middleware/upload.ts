import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const uploadDir = process.env.UPLOAD_PATH || '../uploads';

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Standard image formats
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
    // Raw formats (many browsers report as application/octet-stream)
    'application/octet-stream',
    'image/x-canon-cr2',
    'image/x-canon-crw',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-adobe-dng',
    'image/x-panasonic-raw',
    'image/x-olympus-orf',
    'image/x-fuji-raf',
    'image/x-pentax-pef',
    'image/x-samsung-srw',
    'image/x-kodak-dcr',
    'image/x-kodak-k25',
    'image/x-kodak-kdc',
    'image/x-minolta-mrw',
    'image/x-sigma-x3f'
  ];
  
  // Check MIME type first
  if (allowedMimes.includes(file.mimetype)) {
    // For application/octet-stream, check file extension to ensure it's a raw file
    if (file.mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      const rawExtensions = [
        '.cr2', '.cr3', '.crw', '.nef', '.nrw', '.arw', '.srf', '.sr2', 
        '.dng', '.raw', '.rwl', '.rw2', '.orf', '.raf', '.pef', '.ptx', 
        '.srw', '.dcr', '.k25', '.kdc', '.mrw', '.x3f', '.3fr', '.ari',
        '.bay', '.cap', '.iiq', '.eip', '.dcs', '.dcr', '.drf', '.erf',
        '.fff', '.mef', '.mos', '.nrw', '.pxn', '.r3d', '.rwz'
      ];
      
      if (rawExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only image and raw files are allowed.'));
      }
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type. Only image and raw files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});
