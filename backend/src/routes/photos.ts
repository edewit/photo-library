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
