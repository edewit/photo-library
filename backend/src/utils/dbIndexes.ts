import mongoose from 'mongoose';
import { Photo } from '../models/Photo';
import { Event } from '../models/Event';

export async function createSearchIndexes() {
  try {
    console.log('Creating database indexes for search optimization...');

    // Photo collection indexes
    await Photo.collection.createIndex({ 
      originalName: 'text', 
      filename: 'text',
      'metadata.camera.make': 'text',
      'metadata.camera.model': 'text',
      'metadata.camera.software': 'text'
    }, { 
      name: 'photo_text_search',
      weights: {
        originalName: 10,
        filename: 8,
        'metadata.camera.model': 6,
        'metadata.camera.make': 4,
        'metadata.camera.software': 2
      }
    });

    // Individual field indexes for filtering
    await Photo.collection.createIndex({ 'metadata.dateTime': -1 }, { name: 'photo_date_desc' });
    await Photo.collection.createIndex({ 'metadata.dateTime': 1 }, { name: 'photo_date_asc' });
    await Photo.collection.createIndex({ eventId: 1 }, { name: 'photo_event' });
    await Photo.collection.createIndex({ 'metadata.camera.make': 1 }, { name: 'photo_camera_make' });
    await Photo.collection.createIndex({ 'metadata.camera.model': 1 }, { name: 'photo_camera_model' });
    await Photo.collection.createIndex({ 'metadata.settings.iso': 1 }, { name: 'photo_iso' });
    await Photo.collection.createIndex({ 'metadata.settings.fNumber': 1 }, { name: 'photo_fnumber' });
    await Photo.collection.createIndex({ 'metadata.settings.focalLength': 1 }, { name: 'photo_focal_length' });
    await Photo.collection.createIndex({ 'metadata.mimeType': 1 }, { name: 'photo_mime_type' });
    await Photo.collection.createIndex({ 'metadata.width': 1 }, { name: 'photo_width' });
    await Photo.collection.createIndex({ 'metadata.height': 1 }, { name: 'photo_height' });
    await Photo.collection.createIndex({ 'metadata.size': 1 }, { name: 'photo_size' });

    // GPS indexes
    await Photo.collection.createIndex({ 
      'metadata.gps.latitude': 1, 
      'metadata.gps.longitude': 1 
    }, { name: 'photo_gps_location' });

    // Compound indexes for common filter combinations
    await Photo.collection.createIndex({ 
      eventId: 1, 
      'metadata.dateTime': -1 
    }, { name: 'photo_event_date' });

    await Photo.collection.createIndex({ 
      'metadata.camera.make': 1, 
      'metadata.camera.model': 1,
      'metadata.dateTime': -1 
    }, { name: 'photo_camera_date' });

    await Photo.collection.createIndex({ 
      'metadata.dateTime': -1,
      'metadata.settings.iso': 1
    }, { name: 'photo_date_iso' });

    // Event collection indexes
    await Event.collection.createIndex({ name: 'text', description: 'text' }, { 
      name: 'event_text_search',
      weights: {
        name: 10,
        description: 5
      }
    });
    await Event.collection.createIndex({ startDate: -1 }, { name: 'event_start_date' });
    await Event.collection.createIndex({ endDate: -1 }, { name: 'event_end_date' });
    await Event.collection.createIndex({ photoCount: -1 }, { name: 'event_photo_count' });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
}

export async function dropSearchIndexes() {
  try {
    console.log('Dropping search-related database indexes...');
    
    const photoIndexes = [
      'photo_text_search',
      'photo_date_desc',
      'photo_date_asc',
      'photo_event',
      'photo_camera_make',
      'photo_camera_model',
      'photo_iso',
      'photo_fnumber',
      'photo_focal_length',
      'photo_mime_type',
      'photo_width',
      'photo_height',
      'photo_size',
      'photo_gps_location',
      'photo_event_date',
      'photo_camera_date',
      'photo_date_iso'
    ];

    const eventIndexes = [
      'event_text_search',
      'event_start_date',
      'event_end_date',
      'event_photo_count'
    ];

    for (const indexName of photoIndexes) {
      try {
        await Photo.collection.dropIndex(indexName);
        console.log(`Dropped photo index: ${indexName}`);
      } catch (err) {
        // Index might not exist, ignore error
      }
    }

    for (const indexName of eventIndexes) {
      try {
        await Event.collection.dropIndex(indexName);
        console.log(`Dropped event index: ${indexName}`);
      } catch (err) {
        // Index might not exist, ignore error
      }
    }

    console.log('Search indexes dropped successfully');
  } catch (error) {
    console.error('Error dropping database indexes:', error);
  }
}
