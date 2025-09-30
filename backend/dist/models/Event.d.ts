import mongoose, { Document } from 'mongoose';
import { Event as IEvent } from '../types';
export interface EventDocument extends Document, Omit<IEvent, 'id'> {
}
export declare const Event: mongoose.Model<EventDocument, {}, {}, {}, mongoose.Document<unknown, {}, EventDocument, {}, {}> & EventDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Event.d.ts.map