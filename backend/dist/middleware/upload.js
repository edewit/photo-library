"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const promises_1 = __importDefault(require("fs/promises"));
const uploadDir = process.env.UPLOAD_PATH || '../uploads';
// Ensure upload directory exists
promises_1.default.mkdir(uploadDir, { recursive: true }).catch(console.error);
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
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
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const rawExtensions = [
                '.cr2', '.cr3', '.crw', '.nef', '.nrw', '.arw', '.srf', '.sr2',
                '.dng', '.raw', '.rwl', '.rw2', '.orf', '.raf', '.pef', '.ptx',
                '.srw', '.dcr', '.k25', '.kdc', '.mrw', '.x3f', '.3fr', '.ari',
                '.bay', '.cap', '.iiq', '.eip', '.dcs', '.dcr', '.drf', '.erf',
                '.fff', '.mef', '.mos', '.nrw', '.pxn', '.r3d', '.rwz'
            ];
            if (rawExtensions.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new Error('Invalid file type. Only image and raw files are allowed.'));
            }
        }
        else {
            cb(null, true);
        }
    }
    else {
        cb(new Error('Invalid file type. Only image and raw files are allowed.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});
//# sourceMappingURL=upload.js.map