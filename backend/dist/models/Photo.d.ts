import mongoose, { Document } from 'mongoose';
import { Photo as IPhoto } from '../types';
export interface PhotoDocument extends Document, Omit<IPhoto, 'id'> {
    filePath: string;
}
export declare const Photo: mongoose.Model<PhotoDocument, {}, {}, {}, mongoose.Document<unknown, {}, PhotoDocument, {}, {}> & PhotoDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Photo.d.ts.map