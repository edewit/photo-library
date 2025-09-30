import mongoose, { Document, Schema } from 'mongoose';
import { Photo as IPhoto, PhotoMetadata } from '../types';

const PhotoMetadataSchema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  dateTime: { type: Date },
  gps: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number }
  },
  camera: {
    make: { type: String },
    model: { type: String },
    software: { type: String }
  },
  settings: {
    iso: { type: Number },
    fNumber: { type: Number },
    exposureTime: { type: String },
    focalLength: { type: Number },
    flash: { type: Boolean }
  }
}, { _id: false });

const PhotoSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  filename: { type: String, required: true, unique: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true }, // Relative path from uploads directory
  thumbnailPath: { type: String, required: true },
  metadata: { type: PhotoMetadataSchema, required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export interface PhotoDocument extends Document, Omit<IPhoto, 'id'> {
  filePath: string;
}

export const Photo = mongoose.model<PhotoDocument>('Photo', PhotoSchema);
