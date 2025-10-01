import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPerson extends Document {
  name: string;
  avatar?: string; // Path to best face crop image
  faceDescriptors: number[][]; // Array of face descriptors for this person
  photoCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addFaceDescriptor(descriptor: number[]): Promise<IPerson>;
  calculateSimilarity(descriptor: number[]): number;
}

export interface IPersonModel extends Model<IPerson> {
  // Static methods
  findSimilarPersons(descriptor: number[], threshold?: number): Promise<Array<{
    person: IPerson;
    similarity: number;
  }>>;
}

const PersonSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  avatar: { 
    type: String, // File path to avatar image
    default: null 
  },
  faceDescriptors: [{
    type: [Number], // 128-dimensional face descriptor
    validate: {
      validator: function(arr: number[]) {
        return arr.length === 128;
      },
      message: 'Face descriptor must be exactly 128 dimensions'
    }
  }],
  photoCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  notes: { 
    type: String, 
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient name searches
PersonSchema.index({ name: 'text' });
PersonSchema.index({ photoCount: -1 });
PersonSchema.index({ createdAt: -1 });

// Virtual for ID
PersonSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Method to add a face descriptor
PersonSchema.methods.addFaceDescriptor = function(descriptor: number[]) {
  if (descriptor.length !== 128) {
    throw new Error('Face descriptor must be exactly 128 dimensions');
  }
  this.faceDescriptors.push(descriptor);
  return this.save();
};

// Method to calculate similarity to a face descriptor
PersonSchema.methods.calculateSimilarity = function(descriptor: number[]): number {
  if (this.faceDescriptors.length === 0) return 0;
  
  // Calculate similarity to all known descriptors and return the best match
  const similarities = this.faceDescriptors.map((knownDescriptor: number[]) => {
    const distance = Math.sqrt(
      descriptor.reduce((sum, val, i) => sum + Math.pow(val - knownDescriptor[i], 2), 0)
    );
    // Convert distance to similarity score (0-1, where 1 is identical)
    return Math.max(0, 1 - (distance / 2)); // Normalize by dividing by 2 (theoretical max distance)
  });
  
  return Math.max(...similarities);
};

// Static method to find similar persons for a face descriptor
PersonSchema.statics.findSimilarPersons = async function(descriptor: number[], threshold: number = 0.6) {
  const persons = await this.find({ faceDescriptors: { $exists: true, $not: { $size: 0 } } });
  
  const similarities = persons.map((person: IPerson) => ({
    person,
    similarity: person.calculateSimilarity(descriptor)
  })).filter((result: any) => result.similarity >= threshold)
    .sort((a: any, b: any) => b.similarity - a.similarity);
  
  return similarities;
};

export const Person = mongoose.model<IPerson, IPersonModel>('Person', PersonSchema);
