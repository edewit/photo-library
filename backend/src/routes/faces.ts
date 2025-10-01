import express, { Router } from 'express';
import { Photo } from '../models/Photo';
import { FaceData } from '../types';
import { FaceRecognitionService } from '../services/faceRecognition';

const router: Router = express.Router();

// Update photo with face detection results
router.post('/photos/:id/faces', async (req, res) => {
  try {
    const { id } = req.params;
    const { faces }: { faces: FaceData[] } = req.body;

    if (!Array.isArray(faces)) {
      return res.status(400).json({ error: 'Faces must be an array' });
    }

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Update photo with face data
    photo.metadata.faces = {
      count: faces.length,
      detected: true,
      data: faces,
      processedAt: new Date()
    };

    await photo.save();

    // Automatically attempt face recognition if faces have descriptors
    let recognitionResults: any[] = [];
    const facesWithDescriptors = faces.filter(face => face.descriptor && face.descriptor.length === 128);
    
    if (facesWithDescriptors.length > 0) {
      try {
        recognitionResults = await FaceRecognitionService.processPhotoForRecognition(id, 'medium');
        console.log(`Auto-recognition found ${recognitionResults.length} matches for photo ${id}`);
      } catch (error) {
        console.error('Auto-recognition failed:', error);
      }
    }

    res.json({
      message: 'Face data updated successfully',
      faceCount: faces.length,
      photoId: id,
      autoRecognition: {
        attempted: facesWithDescriptors.length > 0,
        matches: recognitionResults.length,
        results: recognitionResults
      }
    });
  } catch (error) {
    console.error('Error updating face data:', error);
    res.status(500).json({ error: 'Failed to update face data' });
  }
});

// Get photos with face detection status
router.get('/photos/detection-status', async (req, res) => {
  try {
    const { processed } = req.query;
    
    const query: any = {};
    if (processed === 'true') {
      query['metadata.faces.detected'] = true;
    } else if (processed === 'false') {
      query['metadata.faces.detected'] = { $ne: true };
    }

    const photos = await Photo.find(query)
      .select('filename originalName metadata.faces eventId')
      .populate('eventId', 'name')
      .sort({ 'metadata.dateTime': -1 });

    const formattedPhotos = photos.map(photo => {
      const populatedEvent = photo.eventId as any;
      return {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        eventName: populatedEvent?.name || 'Unknown Event',
        faces: photo.metadata.faces || { count: 0, detected: false, data: [] }
      };
    });

    res.json({
      photos: formattedPhotos,
      total: photos.length
    });
  } catch (error) {
    console.error('Error fetching face detection status:', error);
    res.status(500).json({ error: 'Failed to fetch face detection status' });
  }
});

// Get face statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPhotos,
      processedPhotos,
      photosWithFaces,
      totalFaces
    ] = await Promise.all([
      Photo.countDocuments({}),
      Photo.countDocuments({ 'metadata.faces.detected': true }),
      Photo.countDocuments({ 'metadata.faces.count': { $gt: 0 } }),
      Photo.aggregate([
        { $match: { 'metadata.faces.count': { $gt: 0 } } },
        { $group: { _id: null, totalFaces: { $sum: '$metadata.faces.count' } } }
      ])
    ]);

    res.json({
      totalPhotos,
      processedPhotos,
      unprocessedPhotos: totalPhotos - processedPhotos,
      photosWithFaces,
      photosWithoutFaces: processedPhotos - photosWithFaces,
      totalFaces: totalFaces[0]?.totalFaces || 0,
      averageFacesPerPhoto: photosWithFaces > 0 ? (totalFaces[0]?.totalFaces || 0) / photosWithFaces : 0
    });
  } catch (error) {
    console.error('Error fetching face stats:', error);
    res.status(500).json({ error: 'Failed to fetch face statistics' });
  }
});

// Get photos by face count
router.get('/photos/by-face-count', async (req, res) => {
  try {
    const { min, max, page = 1, limit = 20 } = req.query;
    
    const query: any = { 'metadata.faces.detected': true };
    
    if (min !== undefined || max !== undefined) {
      query['metadata.faces.count'] = {};
      if (min !== undefined) {
        query['metadata.faces.count'].$gte = parseInt(min as string);
      }
      if (max !== undefined) {
        query['metadata.faces.count'].$lte = parseInt(max as string);
      }
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [photos, totalCount] = await Promise.all([
      Photo.find(query)
        .populate('eventId', 'name')
        .sort({ 'metadata.faces.count': -1, 'metadata.dateTime': -1 })
        .skip(skip)
        .limit(limitNum),
      Photo.countDocuments(query)
    ]);

    const formattedPhotos = photos.map(photo => {
      const populatedEvent = photo.eventId as any;
      return {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        thumbnailPath: photo.thumbnailPath,
        eventId: populatedEvent._id || populatedEvent,
        eventName: populatedEvent.name || 'Unknown Event',
        faceCount: photo.metadata.faces?.count || 0,
        faces: photo.metadata.faces?.data || []
      };
    });

    res.json({
      photos: formattedPhotos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching photos by face count:', error);
    res.status(500).json({ error: 'Failed to fetch photos by face count' });
  }
});

// Reset face detection for a photo (for reprocessing)
router.delete('/photos/:id/faces', async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Reset face data
    photo.metadata.faces = {
      count: 0,
      detected: false,
      data: []
    };

    await photo.save();

    res.json({
      message: 'Face data reset successfully',
      photoId: id
    });
  } catch (error) {
    console.error('Error resetting face data:', error);
    res.status(500).json({ error: 'Failed to reset face data' });
  }
});

// Automatic face recognition routes

// Process a single photo for face recognition
router.post('/photos/:id/recognize', async (req, res) => {
  try {
    const { id } = req.params;
    const { minConfidence = 'medium' } = req.body;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (!photo.metadata.faces?.detected) {
      return res.status(400).json({ error: 'Photo has no detected faces' });
    }

    const results = await FaceRecognitionService.processPhotoForRecognition(id, minConfidence);

    res.json({
      message: 'Face recognition completed',
      photoId: id,
      recognitionResults: results,
      assignmentsCount: results.length
    });
  } catch (error) {
    console.error('Error in face recognition:', error);
    res.status(500).json({ error: 'Failed to process face recognition' });
  }
});

// Batch process multiple photos
router.post('/batch-recognize', async (req, res) => {
  try {
    const { photoIds, minConfidence = 'medium' } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'photoIds array is required' });
    }

    if (photoIds.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 photos per batch' });
    }

    const results = await FaceRecognitionService.batchProcessPhotos(photoIds, minConfidence);

    const totalAssignments = Object.values(results).reduce((sum, photoResults) => sum + photoResults.length, 0);

    res.json({
      message: 'Batch face recognition completed',
      processedPhotos: photoIds.length,
      totalAssignments,
      results
    });
  } catch (error) {
    console.error('Error in batch face recognition:', error);
    res.status(500).json({ error: 'Failed to process batch face recognition' });
  }
});

// Auto-process unprocessed photos
router.post('/auto-process', async (req, res) => {
  try {
    const { limit = 50, minConfidence = 'medium' } = req.body;

    // Find unprocessed photos
    const photoIds = await FaceRecognitionService.findUnprocessedPhotos(limit);

    if (photoIds.length === 0) {
      return res.json({
        message: 'No unprocessed photos found',
        processedPhotos: 0,
        totalAssignments: 0
      });
    }

    // Process them
    const results = await FaceRecognitionService.batchProcessPhotos(photoIds, minConfidence);
    const totalAssignments = Object.values(results).reduce((sum, photoResults) => sum + photoResults.length, 0);

    res.json({
      message: 'Auto-processing completed',
      processedPhotos: photoIds.length,
      totalAssignments,
      results
    });
  } catch (error) {
    console.error('Error in auto-processing:', error);
    res.status(500).json({ error: 'Failed to auto-process photos' });
  }
});

// Get recognition statistics
router.get('/recognition-stats', async (req, res) => {
  try {
    const stats = await FaceRecognitionService.getRecognitionStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting recognition stats:', error);
    res.status(500).json({ error: 'Failed to get recognition statistics' });
  }
});

// Get unprocessed photos list
router.get('/unprocessed-photos', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const photoIds = await FaceRecognitionService.findUnprocessedPhotos(parseInt(limit as string));
    
    // Get photo details
    const photos = await Photo.find({ _id: { $in: photoIds } })
      .populate('eventId', 'name')
      .select('filename originalName metadata.faces eventId metadata.dateTime')
      .sort({ 'metadata.dateTime': -1 });

    const formattedPhotos = photos.map(photo => {
      const populatedEvent = photo.eventId as any;
      const unassignedFaces = photo.metadata.faces?.data.filter(face => !face.personId) || [];
      
      return {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        eventName: populatedEvent?.name || 'Unknown Event',
        totalFaces: photo.metadata.faces?.count || 0,
        unassignedFaces: unassignedFaces.length,
        facesWithDescriptors: unassignedFaces.filter(face => face.descriptor).length,
        dateTime: photo.metadata.dateTime
      };
    });

    res.json({
      photos: formattedPhotos,
      total: formattedPhotos.length
    });
  } catch (error) {
    console.error('Error getting unprocessed photos:', error);
    res.status(500).json({ error: 'Failed to get unprocessed photos' });
  }
});

export default router;
