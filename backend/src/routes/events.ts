import express, { Router } from 'express';
import { Event } from '../models/Event';
import { Photo } from '../models/Photo';

const router: Router = express.Router();

// Get all events with cover photo details
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).populate('coverPhotoId');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    
    const event = new Event({
      name,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { name, description, coverPhotoId, startDate, endDate } = req.body;
    
    const updateData: any = { name, description };
    if (coverPhotoId) updateData.coverPhotoId = coverPhotoId;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Delete all photos in this event
    await Photo.deleteMany({ eventId: req.params.id });
    
    // Delete the event
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get photos for an event
router.get('/:id/photos', async (req, res) => {
  try {
    const photos = await Photo.find({ eventId: req.params.id }).sort({ 'metadata.dateTime': 1 });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching event photos:', error);
    res.status(500).json({ error: 'Failed to fetch event photos' });
  }
});

// Set cover photo for an event
router.put('/:id/cover/:photoId', async (req, res) => {
  try {
    const { id, photoId } = req.params;
    
    // Verify the photo exists and belongs to this event
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (photo.eventId.toString() !== id) {
      return res.status(400).json({ error: 'Photo does not belong to this event' });
    }
    
    // Update the event's cover photo
    const event = await Event.findByIdAndUpdate(
      id,
      { coverPhotoId: photoId },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error setting cover photo:', error);
    res.status(500).json({ error: 'Failed to set cover photo' });
  }
});

export default router;
