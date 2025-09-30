import mongoose, { Document, Schema } from 'mongoose';
import { Event as IEvent } from '../types';

const EventSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverPhotoId: { type: Schema.Types.ObjectId, ref: 'Photo' },
  startDate: { type: Date },
  endDate: { type: Date },
  photoCount: { type: Number, default: 0 }
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

export interface EventDocument extends Document, Omit<IEvent, 'id'> {}

export const Event = mongoose.model<EventDocument>('Event', EventSchema);
