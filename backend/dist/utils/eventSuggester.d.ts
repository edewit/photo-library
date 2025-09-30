import { PhotoMetadata } from '../types';
export interface EventSuggestion {
    name: string;
    startDate: Date;
    endDate: Date;
    photos: Array<{
        filename: string;
        metadata: PhotoMetadata;
    }>;
}
export declare function suggestEvents(photos: Array<{
    filename: string;
    metadata: PhotoMetadata;
}>): EventSuggestion[];
//# sourceMappingURL=eventSuggester.d.ts.map