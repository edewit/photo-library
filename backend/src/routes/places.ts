import express, { Router } from 'express';
import { Photo } from '../models/Photo';
import { Event } from '../models/Event';

const router: Router = express.Router();

// Get all photos with GPS coordinates grouped by location
router.get('/', async (req, res) => {
  try {
    // Find all photos that have GPS coordinates
    const photosWithLocation = await Photo.find({
      'metadata.gps.latitude': { $exists: true, $ne: null },
      'metadata.gps.longitude': { $exists: true, $ne: null }
    }).populate('eventId', 'name');

    // Group photos by approximate location (rounded to reduce clustering)
    const locationGroups = new Map();
    
    for (const photo of photosWithLocation) {
      const lat = photo.metadata.gps?.latitude;
      const lng = photo.metadata.gps?.longitude;
      
      if (lat && lng) {
        // Round coordinates to group nearby photos (approximately 1km precision)
        const roundedLat = Math.round(lat * 100) / 100;
        const roundedLng = Math.round(lng * 100) / 100;
        const locationKey = `${roundedLat},${roundedLng}`;
        
        if (!locationGroups.has(locationKey)) {
          locationGroups.set(locationKey, {
            latitude: roundedLat,
            longitude: roundedLng,
            photos: [],
            events: new Set()
          });
        }
        
        const group = locationGroups.get(locationKey);
        const populatedEvent = photo.eventId as any;
        group.photos.push({
          id: photo.id,
          filename: photo.filename,
          originalName: photo.originalName,
          thumbnailPath: photo.thumbnailPath,
          eventId: populatedEvent._id || populatedEvent,
          eventName: populatedEvent.name || 'Unknown Event',
          dateTime: photo.metadata.dateTime
        });
        group.events.add(populatedEvent.name || 'Unknown Event');
      }
    }

    // Convert to array and add summary info
    const places = Array.from(locationGroups.values()).map(group => ({
      latitude: group.latitude,
      longitude: group.longitude,
      photoCount: group.photos.length,
      eventCount: group.events.size,
      events: Array.from(group.events),
      photos: group.photos.sort((a: any, b: any) => {
        const dateA = a.dateTime || new Date(0);
        const dateB = b.dateTime || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      }).slice(0, 10) // Limit to 10 photos per location for performance
    }));

    // Sort by photo count (most photos first)
    places.sort((a, b) => b.photoCount - a.photoCount);

    res.json({
      places,
      totalPlaces: places.length,
      totalPhotosWithLocation: photosWithLocation.length
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Get photos for a specific location
router.get('/location/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Find photos within a small radius of the given coordinates
    const radius = 0.01; // Approximately 1km
    const photos = await Photo.find({
      'metadata.gps.latitude': { 
        $gte: latitude - radius, 
        $lte: latitude + radius 
      },
      'metadata.gps.longitude': { 
        $gte: longitude - radius, 
        $lte: longitude + radius 
      }
    }).populate('eventId', 'name').sort({ 'metadata.dateTime': -1 });

    const photosWithEvent = photos.map(photo => {
      const populatedEvent = photo.eventId as any;
      return {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        thumbnailPath: photo.thumbnailPath,
        filePath: photo.filePath,
        eventId: populatedEvent._id || populatedEvent,
        eventName: populatedEvent.name || 'Unknown Event',
        dateTime: photo.metadata.dateTime,
        gps: photo.metadata.gps
      };
    });

    res.json({
      location: { latitude, longitude },
      photos: photosWithEvent,
      photoCount: photosWithEvent.length
    });
  } catch (error) {
    console.error('Error fetching location photos:', error);
    res.status(500).json({ error: 'Failed to fetch location photos' });
  }
});

export default router;
