import express, { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { Photo } from '../models/Photo';
import { Event } from '../models/Event';
import { upload } from '../middleware/upload';
import { extractExifData } from '../utils/exifExtractor';
import { generateThumbnail } from '../utils/thumbnailGenerator';
import { suggestEvents } from '../utils/eventSuggester';
import { organizePhotosIntoEventFolder, getEventPhotoPath, getEventThumbnailPath } from '../utils/fileOrganizer';

const router: Router = express.Router();
const uploadsDir = process.env.UPLOAD_PATH || '../uploads';

// Upload photos and suggest events
router.post('/upload', upload.array('photos', 100), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedPhotos = [];

    // Process each uploaded file
    for (const file of req.files) {
      const filePath = file.path;
      
      // Extract EXIF data
      const metadata = await extractExifData(
        filePath,
        file.filename,
        file.originalname,
        file.size,
        file.mimetype
      );

      // Generate thumbnail
      const thumbnailPath = await generateThumbnail(
        filePath,
        file.filename,
        uploadsDir
      );

      uploadedPhotos.push({
        filename: file.filename,
        metadata: {
          ...metadata,
          thumbnailPath
        }
      });
    }

    // Suggest events based on photo dates
    const eventSuggestions = suggestEvents(uploadedPhotos);

    res.json({
      message: 'Photos uploaded successfully',
      photos: uploadedPhotos,
      eventSuggestions
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Organize photos into events
router.post('/organize', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    const createdEvents = [];

    for (const eventData of events) {
      // Create event
      const event = new Event({
        name: eventData.name,
        description: eventData.description,
        startDate: eventData.startDate ? new Date(eventData.startDate) : undefined,
        endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
        photoCount: eventData.photos.length
      });

      await event.save();

      // Extract filenames from the event's photos
      const photoFilenames = eventData.photos.map((photo: any) => photo.filename);

      // Organize photos into event folder
      const { movedFiles } = await organizePhotosIntoEventFolder(
        eventData.name,
        photoFilenames,
        uploadsDir
      );

      // Create photos for this event with updated paths
      const eventPhotos = [];
      for (const photoData of eventData.photos) {
        const movedFile = movedFiles.find(f => f.filename === photoData.filename);
        
        const photo = new Photo({
          eventId: event._id,
          filename: photoData.filename,
          originalName: photoData.metadata.originalName,
          filePath: movedFile ? getEventPhotoPath(eventData.name, photoData.filename) : photoData.filename,
          thumbnailPath: getEventThumbnailPath(eventData.name, photoData.filename),
          metadata: photoData.metadata
        });

        await photo.save();
        eventPhotos.push(photo);
      }

      // Set cover photo (first photo by date)
      if (eventPhotos.length > 0) {
        const coverPhoto = eventPhotos.sort((a, b) => {
          const dateA = a.metadata.dateTime || new Date(0);
          const dateB = b.metadata.dateTime || new Date(0);
          return dateA.getTime() - dateB.getTime();
        })[0];
        
        event.coverPhotoId = coverPhoto._id as any;
        await event.save();
      }

      createdEvents.push(event);
    }

    res.json({
      message: 'Photos organized successfully',
      events: createdEvents
    });
  } catch (error) {
    console.error('Error organizing photos:', error);
    res.status(500).json({ error: 'Failed to organize photos' });
  }
});

// Search photos with advanced filtering
router.get('/search', async (req, res) => {
  try {
    const {
      q, // General search query
      eventId,
      startDate,
      endDate,
      cameraModel,
      cameraMake,
      minIso,
      maxIso,
      minFNumber,
      maxFNumber,
      focalLength,
      hasGps,
      fileType,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      sortBy = 'dateTime',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    // Build MongoDB query
    const query: any = {};
    const conditions: any[] = [];
    const textSearchConditions: any[] = [];

    // General text search across multiple fields
    if (q && typeof q === 'string') {
      const searchRegex = new RegExp(q, 'i');
      textSearchConditions.push(
        { originalName: searchRegex },
        { filename: searchRegex },
        { 'metadata.camera.make': searchRegex },
        { 'metadata.camera.model': searchRegex },
        { 'metadata.camera.software': searchRegex }
      );
    }

    // Event filter
    if (eventId) {
      query.eventId = eventId;
    }

    // Date range filters
    if (startDate || endDate) {
      query['metadata.dateTime'] = {};
      if (startDate) {
        query['metadata.dateTime'].$gte = new Date(startDate as string);
      }
      if (endDate) {
        query['metadata.dateTime'].$lte = new Date(endDate as string);
      }
    }

    // Camera filters
    if (cameraModel) {
      query['metadata.camera.model'] = new RegExp(cameraModel as string, 'i');
    }
    if (cameraMake) {
      query['metadata.camera.make'] = new RegExp(cameraMake as string, 'i');
    }

    // ISO filters
    if (minIso || maxIso) {
      query['metadata.settings.iso'] = {};
      if (minIso) {
        query['metadata.settings.iso'].$gte = parseInt(minIso as string);
      }
      if (maxIso) {
        query['metadata.settings.iso'].$lte = parseInt(maxIso as string);
      }
    }

    // F-Number (aperture) filters
    if (minFNumber || maxFNumber) {
      query['metadata.settings.fNumber'] = {};
      if (minFNumber) {
        query['metadata.settings.fNumber'].$gte = parseFloat(minFNumber as string);
      }
      if (maxFNumber) {
        query['metadata.settings.fNumber'].$lte = parseFloat(maxFNumber as string);
      }
    }

    // Focal length filter
    if (focalLength) {
      query['metadata.settings.focalLength'] = parseInt(focalLength as string);
    }

    // GPS filter
    if (hasGps !== undefined) {
      if (hasGps === 'true') {
        query['metadata.gps.latitude'] = { $exists: true, $ne: null };
        query['metadata.gps.longitude'] = { $exists: true, $ne: null };
      } else if (hasGps === 'false') {
        conditions.push({
          $or: [
            { 'metadata.gps.latitude': { $exists: false } },
            { 'metadata.gps.latitude': null },
            { 'metadata.gps.longitude': { $exists: false } },
            { 'metadata.gps.longitude': null }
          ]
        });
      }
    }

    // File type filter
    if (fileType) {
      query['metadata.mimeType'] = new RegExp(fileType as string, 'i');
    }

    // Dimension filters
    if (minWidth || maxWidth) {
      query['metadata.width'] = {};
      if (minWidth) {
        query['metadata.width'].$gte = parseInt(minWidth as string);
      }
      if (maxWidth) {
        query['metadata.width'].$lte = parseInt(maxWidth as string);
      }
    }

    if (minHeight || maxHeight) {
      query['metadata.height'] = {};
      if (minHeight) {
        query['metadata.height'].$gte = parseInt(minHeight as string);
      }
      if (maxHeight) {
        query['metadata.height'].$lte = parseInt(maxHeight as string);
      }
    }

    // Combine all conditions
    if (textSearchConditions.length > 0) {
      conditions.push({ $or: textSearchConditions });
    }

    // If we have multiple conditions, use $and to combine them
    if (conditions.length > 0) {
      if (conditions.length === 1) {
        // If only one condition, merge it directly
        Object.assign(query, conditions[0]);
      } else {
        // Multiple conditions, use $and
        query.$and = conditions;
      }
    }

    // Build sort object
    const sort: any = {};
    const sortField = sortBy === 'dateTime' ? 'metadata.dateTime' : 
                     sortBy === 'filename' ? 'originalName' :
                     sortBy === 'size' ? 'metadata.size' :
                     sortBy === 'camera' ? 'metadata.camera.model' :
                     'metadata.dateTime';
    
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Execute search with pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [photos, totalCount] = await Promise.all([
      Photo.find(query)
        .populate('eventId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Photo.countDocuments(query)
    ]);

    // Format response
    const formattedPhotos = photos.map(photo => {
      const populatedEvent = photo.eventId as any;
      return {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        thumbnailPath: photo.thumbnailPath,
        filePath: photo.filePath,
        eventId: populatedEvent._id || populatedEvent,
        eventName: populatedEvent.name || 'Unknown Event',
        metadata: photo.metadata,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt
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
      },
      searchQuery: {
        q,
        filters: {
          eventId,
          startDate,
          endDate,
          cameraModel,
          cameraMake,
          minIso,
          maxIso,
          minFNumber,
          maxFNumber,
          focalLength,
          hasGps,
          fileType,
          minWidth,
          maxWidth,
          minHeight,
          maxHeight
        },
        sort: { field: sortBy, order: sortOrder }
      }
    });
  } catch (error) {
    console.error('Error searching photos:', error);
    res.status(500).json({ error: 'Failed to search photos' });
  }
});

// Get search suggestions (for autocomplete)
router.get('/search/suggestions', async (req, res) => {
  try {
    const { type, q } = req.query;

    if (!type || !q) {
      return res.status(400).json({ error: 'Type and query parameters are required' });
    }

    const searchRegex = new RegExp(q as string, 'i');
    let suggestions: string[] = [];

    switch (type) {
      case 'camera':
        const cameras = await Photo.distinct('metadata.camera.model', {
          'metadata.camera.model': { $regex: searchRegex, $ne: null }
        });
        suggestions = cameras.filter(Boolean).slice(0, 10) as string[];
        break;

      case 'make':
        const makes = await Photo.distinct('metadata.camera.make', {
          'metadata.camera.make': { $regex: searchRegex, $ne: null }
        });
        suggestions = makes.filter(Boolean).slice(0, 10) as string[];
        break;

      case 'filename':
        const filenames = await Photo.find({
          $or: [
            { originalName: searchRegex },
            { filename: searchRegex }
          ]
        }).select('originalName').limit(10);
        suggestions = filenames.map(p => p.originalName);
        break;

      default:
        return res.status(400).json({ error: 'Invalid suggestion type' });
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get single photo
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Serve photo files (supports both old flat structure and new event folders)
router.get('/file/:photoId', async (req, res) => {
  try {
    const photoId = req.params.photoId;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(photoId)) {
      // It's a photo ID, look up the photo and serve from its path
      const photo = await Photo.findById(photoId);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      const filePath = path.join(uploadsDir, photo.filePath);
      await fs.access(filePath);
      return res.sendFile(path.resolve(filePath));
    } else {
      // It's a direct filename (legacy), serve from root
      const filePath = path.join(uploadsDir, photoId);
      await fs.access(filePath);
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error) {
    console.error('Error serving photo file:', error);
    res.status(404).json({ error: 'Photo file not found' });
  }
});

// Serve thumbnail files (supports both old flat structure and new event folders)
router.get('/thumbnail/:photoId', async (req, res) => {
  try {
    const photoId = req.params.photoId;
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(photoId)) {
      // It's a photo ID, look up the photo and serve thumbnail from its path
      const photo = await Photo.findById(photoId);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      const filePath = path.join(uploadsDir, photo.thumbnailPath);
      await fs.access(filePath);
      return res.sendFile(path.resolve(filePath));
    } else {
      // It's a direct filename (legacy), serve from thumbnails folder
      const filePath = path.join(uploadsDir, 'thumbnails', photoId);
      await fs.access(filePath);
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error) {
    console.error('Error serving thumbnail file:', error);
    res.status(404).json({ error: 'Thumbnail file not found' });
  }
});

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete files
    const photoPath = path.join(uploadsDir, photo.filePath);
    const thumbnailPath = path.join(uploadsDir, photo.thumbnailPath);
    
    try {
      await fs.unlink(photoPath);
      await fs.unlink(thumbnailPath);
    } catch (fileError) {
      console.warn('Could not delete photo files:', fileError);
    }

    // Delete from database
    await Photo.findByIdAndDelete(req.params.id);

    // Update event photo count
    await Event.findByIdAndUpdate(photo.eventId, {
      $inc: { photoCount: -1 }
    });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
