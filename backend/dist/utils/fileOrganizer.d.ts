/**
 * Sanitizes a string to be safe for use as a folder name
 */
export declare function sanitizeFolderName(name: string): string;
/**
 * Creates an event folder and moves photos into it
 */
export declare function organizePhotosIntoEventFolder(eventName: string, photoFilenames: string[], uploadsDir: string): Promise<{
    eventFolderPath: string;
    movedFiles: Array<{
        oldPath: string;
        newPath: string;
        filename: string;
    }>;
}>;
/**
 * Gets the relative path for serving photos from event folders
 */
export declare function getEventPhotoPath(eventName: string, filename: string): string;
/**
 * Gets the relative path for serving thumbnails from event folders
 */
export declare function getEventThumbnailPath(eventName: string, filename: string): string;
//# sourceMappingURL=fileOrganizer.d.ts.map