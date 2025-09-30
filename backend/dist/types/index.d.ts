export interface PhotoMetadata {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    dateTime?: Date;
    gps?: {
        latitude: number;
        longitude: number;
        altitude?: number;
    };
    camera?: {
        make?: string;
        model?: string;
        software?: string;
    };
    settings?: {
        iso?: number;
        fNumber?: number;
        exposureTime?: string;
        focalLength?: number;
        flash?: boolean;
    };
}
export interface Event {
    id: string;
    name: string;
    description?: string;
    coverPhotoId?: string;
    createdAt: Date;
    updatedAt: Date;
    startDate?: Date;
    endDate?: Date;
    photoCount: number;
}
export interface Photo {
    id: string;
    eventId: string;
    filename: string;
    originalName: string;
    filePath: string;
    thumbnailPath: string;
    metadata: PhotoMetadata;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map