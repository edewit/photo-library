"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFolderName = sanitizeFolderName;
exports.organizePhotosIntoEventFolder = organizePhotosIntoEventFolder;
exports.getEventPhotoPath = getEventPhotoPath;
exports.getEventThumbnailPath = getEventThumbnailPath;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Sanitizes a string to be safe for use as a folder name
 */
function sanitizeFolderName(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .substring(0, 100); // Limit length to 100 characters
}
/**
 * Creates an event folder and moves photos into it
 */
async function organizePhotosIntoEventFolder(eventName, photoFilenames, uploadsDir) {
    const sanitizedEventName = sanitizeFolderName(eventName);
    const eventFolderPath = path_1.default.join(uploadsDir, 'events', sanitizedEventName);
    const thumbnailsFolderPath = path_1.default.join(eventFolderPath, 'thumbnails');
    // Create event folder and thumbnails subfolder
    await promises_1.default.mkdir(eventFolderPath, { recursive: true });
    await promises_1.default.mkdir(thumbnailsFolderPath, { recursive: true });
    const movedFiles = [];
    for (const filename of photoFilenames) {
        try {
            // Move original photo
            const oldPhotoPath = path_1.default.join(uploadsDir, filename);
            const newPhotoPath = path_1.default.join(eventFolderPath, filename);
            // Check if source file exists
            try {
                await promises_1.default.access(oldPhotoPath);
                await promises_1.default.rename(oldPhotoPath, newPhotoPath);
                movedFiles.push({
                    oldPath: oldPhotoPath,
                    newPath: newPhotoPath,
                    filename
                });
            }
            catch (error) {
                console.warn(`Could not move photo ${filename}:`, error);
                continue;
            }
            // Move thumbnail
            const thumbnailFilename = `thumb_${filename}`;
            const oldThumbnailPath = path_1.default.join(uploadsDir, 'thumbnails', thumbnailFilename);
            const newThumbnailPath = path_1.default.join(thumbnailsFolderPath, thumbnailFilename);
            try {
                await promises_1.default.access(oldThumbnailPath);
                await promises_1.default.rename(oldThumbnailPath, newThumbnailPath);
            }
            catch (error) {
                console.warn(`Could not move thumbnail for ${filename}:`, error);
            }
        }
        catch (error) {
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
function getEventPhotoPath(eventName, filename) {
    const sanitizedEventName = sanitizeFolderName(eventName);
    return `events/${sanitizedEventName}/${filename}`;
}
/**
 * Gets the relative path for serving thumbnails from event folders
 */
function getEventThumbnailPath(eventName, filename) {
    const sanitizedEventName = sanitizeFolderName(eventName);
    return `events/${sanitizedEventName}/thumbnails/thumb_${filename}`;
}
//# sourceMappingURL=fileOrganizer.js.map