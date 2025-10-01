import { Person } from '../models/Person';
import { Photo } from '../models/Photo';
import { FaceData } from '../types';

export interface FaceRecognitionResult {
  faceIndex: number;
  personId: string;
  personName: string;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
}

export class FaceRecognitionService {
  // Similarity thresholds for automatic assignment
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.85;
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.75;
  private static readonly LOW_CONFIDENCE_THRESHOLD = 0.65;

  /**
   * Automatically recognize faces in a photo and assign them to known persons
   */
  static async recognizeFaces(photoId: string, faces: FaceData[]): Promise<FaceRecognitionResult[]> {
    const results: FaceRecognitionResult[] = [];
    
    try {
      // Get all persons with face descriptors
      const persons = await Person.find({ 
        faceDescriptors: { $exists: true, $not: { $size: 0 } } 
      });

      if (persons.length === 0) {
        console.log('No persons with face descriptors found for recognition');
        return results;
      }

      // Process each face
      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        
        // Skip faces without descriptors
        if (!face.descriptor || face.descriptor.length !== 128) {
          continue;
        }

        // Find best match among all persons
        let bestMatch: { person: any; similarity: number } | null = null;
        
        for (const person of persons) {
          const similarity = person.calculateSimilarity(face.descriptor);
          
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { person, similarity };
          }
        }

        // Determine if match is good enough for automatic assignment
        if (bestMatch && bestMatch.similarity >= this.LOW_CONFIDENCE_THRESHOLD) {
          const confidence = this.getConfidenceLevel(bestMatch.similarity);
          
          results.push({
            faceIndex: i,
            personId: bestMatch.person.id,
            personName: bestMatch.person.name,
            similarity: bestMatch.similarity,
            confidence
          });

          console.log(`Face ${i} matched to ${bestMatch.person.name} with ${Math.round(bestMatch.similarity * 100)}% similarity (${confidence} confidence)`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in face recognition:', error);
      return results;
    }
  }

  /**
   * Automatically assign recognized faces to a photo
   */
  static async autoAssignFaces(photoId: string, recognitionResults: FaceRecognitionResult[], minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      const photo = await Photo.findById(photoId);
      if (!photo || !photo.metadata.faces) {
        return;
      }

      let assignmentsMade = 0;

      // Filter results by minimum confidence level
      const filteredResults = recognitionResults.filter(result => {
        switch (minConfidence) {
          case 'high':
            return result.confidence === 'high';
          case 'medium':
            return result.confidence === 'high' || result.confidence === 'medium';
          case 'low':
            return true; // All confidence levels
          default:
            return result.confidence === 'medium' || result.confidence === 'high';
        }
      });

      // Assign faces
      for (const result of filteredResults) {
        if (result.faceIndex < photo.metadata.faces.data.length) {
          const face = photo.metadata.faces.data[result.faceIndex];
          
          // Only assign if not already assigned
          if (!face.personId) {
            face.personId = result.personId;
            face.personName = result.personName;
            assignmentsMade++;
          }
        }
      }

      if (assignmentsMade > 0) {
        await photo.save();
        
        // Update person photo counts
        const personIds = [...new Set(filteredResults.map(r => r.personId))];
        for (const personId of personIds) {
          const person = await Person.findById(personId);
          if (person) {
            const photoCount = await Photo.countDocuments({
              'metadata.faces.data.personId': personId
            });
            person.photoCount = photoCount;
            await person.save();
          }
        }

        console.log(`Auto-assigned ${assignmentsMade} faces in photo ${photoId}`);
      }
    } catch (error) {
      console.error('Error in auto-assignment:', error);
    }
  }

  /**
   * Process a photo for automatic face recognition and assignment
   */
  static async processPhotoForRecognition(photoId: string, minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<FaceRecognitionResult[]> {
    try {
      const photo = await Photo.findById(photoId);
      if (!photo || !photo.metadata.faces?.detected || !photo.metadata.faces.data) {
        return [];
      }

      // Recognize faces
      const results = await this.recognizeFaces(photoId, photo.metadata.faces.data);
      
      // Auto-assign if results found
      if (results.length > 0) {
        await this.autoAssignFaces(photoId, results, minConfidence);
      }

      return results;
    } catch (error) {
      console.error('Error processing photo for recognition:', error);
      return [];
    }
  }

  /**
   * Batch process multiple photos for face recognition
   */
  static async batchProcessPhotos(photoIds: string[], minConfidence: 'high' | 'medium' | 'low' = 'medium'): Promise<{ [photoId: string]: FaceRecognitionResult[] }> {
    const results: { [photoId: string]: FaceRecognitionResult[] } = {};
    
    console.log(`Starting batch face recognition for ${photoIds.length} photos`);
    
    for (const photoId of photoIds) {
      try {
        results[photoId] = await this.processPhotoForRecognition(photoId, minConfidence);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing photo ${photoId}:`, error);
        results[photoId] = [];
      }
    }

    console.log(`Completed batch face recognition for ${photoIds.length} photos`);
    return results;
  }

  /**
   * Find unprocessed photos (detected faces but no recognition attempted)
   */
  static async findUnprocessedPhotos(limit: number = 50): Promise<string[]> {
    try {
      const photos = await Photo.find({
        'metadata.faces.detected': true,
        'metadata.faces.count': { $gt: 0 },
        // Find photos where at least one face has no person assignment
        'metadata.faces.data': {
          $elemMatch: {
            descriptor: { $exists: true, $ne: null },
            personId: { $exists: false }
          }
        }
      })
      .select('_id')
      .limit(limit)
      .sort({ 'metadata.dateTime': -1 }); // Process newest first

      return photos.map(photo => photo.id);
    } catch (error) {
      console.error('Error finding unprocessed photos:', error);
      return [];
    }
  }

  /**
   * Get confidence level based on similarity score
   */
  private static getConfidenceLevel(similarity: number): 'high' | 'medium' | 'low' {
    if (similarity >= this.HIGH_CONFIDENCE_THRESHOLD) {
      return 'high';
    } else if (similarity >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recognition statistics
   */
  static async getRecognitionStats(): Promise<{
    totalPhotosWithFaces: number;
    photosWithUnassignedFaces: number;
    totalUnassignedFaces: number;
    recognitionCandidates: number;
  }> {
    try {
      const [
        totalPhotosWithFaces,
        photosWithUnassignedFaces,
        unassignedFacesAgg,
        recognitionCandidatesAgg
      ] = await Promise.all([
        // Total photos with detected faces
        Photo.countDocuments({
          'metadata.faces.detected': true,
          'metadata.faces.count': { $gt: 0 }
        }),
        
        // Photos with at least one unassigned face
        Photo.countDocuments({
          'metadata.faces.data': {
            $elemMatch: { personId: { $exists: false } }
          }
        }),
        
        // Total count of unassigned faces
        Photo.aggregate([
          { $match: { 'metadata.faces.detected': true } },
          { $unwind: '$metadata.faces.data' },
          { $match: { 'metadata.faces.data.personId': { $exists: false } } },
          { $count: 'total' }
        ]),
        
        // Faces with descriptors that could be recognized
        Photo.aggregate([
          { $match: { 'metadata.faces.detected': true } },
          { $unwind: '$metadata.faces.data' },
          { 
            $match: { 
              'metadata.faces.data.personId': { $exists: false },
              'metadata.faces.data.descriptor': { $exists: true, $ne: null }
            } 
          },
          { $count: 'total' }
        ])
      ]);

      return {
        totalPhotosWithFaces,
        photosWithUnassignedFaces,
        totalUnassignedFaces: unassignedFacesAgg[0]?.total || 0,
        recognitionCandidates: recognitionCandidatesAgg[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting recognition stats:', error);
      return {
        totalPhotosWithFaces: 0,
        photosWithUnassignedFaces: 0,
        totalUnassignedFaces: 0,
        recognitionCandidates: 0
      };
    }
  }
}
