import express, { Router } from 'express';
import { Person } from '../models/Person';
import { Photo } from '../models/Photo';
import { FaceData, PersonSuggestion } from '../types';
import { updatePersonAvatarIfBetter } from '../utils/avatarGenerator';
import path from 'path';
import fs from 'fs/promises';

const router: Router = express.Router();

// Get all persons
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'name', sortOrder = 'asc', search } = req.query;
    
    let query: any = {};
    if (search) {
      query.$text = { $search: search as string };
    }
    
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    
    const persons = await Person.find(query).sort(sortOptions);
    
    res.json({
      persons,
      total: persons.length
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Failed to fetch persons' });
  }
});

// Get person by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const person = await Person.findById(id);
    
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
});

// Create new person
router.post('/', async (req, res) => {
  try {
    const { name, notes, faceDescriptor } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Person name is required' });
    }
    
    // Check if person with this name already exists
    const existingPerson = await Person.findOne({ name: name.trim() });
    if (existingPerson) {
      return res.status(409).json({ error: 'Person with this name already exists' });
    }
    
    const personData: any = {
      name: name.trim(),
      notes: notes || '',
      faceDescriptors: faceDescriptor ? [faceDescriptor] : []
    };
    
    const person = new Person(personData);
    await person.save();
    
    res.status(201).json(person);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// Update person
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes } = req.body;
    
    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Person name cannot be empty' });
      }
      
      // Check if another person with this name exists
      const existingPerson = await Person.findOne({ 
        name: name.trim(), 
        _id: { $ne: id } 
      });
      if (existingPerson) {
        return res.status(409).json({ error: 'Person with this name already exists' });
      }
      
      person.name = name.trim();
    }
    
    if (notes !== undefined) {
      person.notes = notes;
    }
    
    await person.save();
    res.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

// Delete person
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    // Remove person assignments from all photos
    await Photo.updateMany(
      { 'metadata.faces.data.personId': id },
      { 
        $unset: { 
          'metadata.faces.data.$[elem].personId': '',
          'metadata.faces.data.$[elem].personName': ''
        }
      },
      { arrayFilters: [{ 'elem.personId': id }] }
    );
    
    await Person.findByIdAndDelete(id);
    
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

// Get photos for a person
router.get('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    const [photos, totalCount] = await Promise.all([
      Photo.find({ 'metadata.faces.data.personId': id })
        .populate('eventId', 'name')
        .sort({ 'metadata.dateTime': -1 })
        .skip(skip)
        .limit(limitNum),
      Photo.countDocuments({ 'metadata.faces.data.personId': id })
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
        dateTime: photo.metadata.dateTime,
        faces: photo.metadata.faces?.data.filter(face => face.personId === id) || []
      };
    });
    
    res.json({
      person,
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
    console.error('Error fetching person photos:', error);
    res.status(500).json({ error: 'Failed to fetch person photos' });
  }
});

// Assign face to person
router.post('/assign-face', async (req, res) => {
  try {
    const { photoId, faceIndex, personId } = req.body;
    
    if (!photoId || faceIndex === undefined || !personId) {
      return res.status(400).json({ 
        error: 'photoId, faceIndex, and personId are required' 
      });
    }
    
    const [photo, person] = await Promise.all([
      Photo.findById(photoId),
      Person.findById(personId)
    ]);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    if (!photo.metadata.faces?.data || faceIndex >= photo.metadata.faces.data.length) {
      return res.status(400).json({ error: 'Invalid face index' });
    }
    
    // Update the face assignment
    photo.metadata.faces.data[faceIndex].personId = personId;
    photo.metadata.faces.data[faceIndex].personName = person.name;
    
    // Add face descriptor to person if it has one
    const faceDescriptor = photo.metadata.faces.data[faceIndex].descriptor;
    if (faceDescriptor && faceDescriptor.length === 128) {
      await person.addFaceDescriptor(faceDescriptor);
    }
    
    // Generate or update person avatar from this face
    try {
      const uploadsDir = process.env.UPLOAD_PATH || '../uploads';
      const photoPath = path.join(uploadsDir, photo.filePath);
      const faceData = photo.metadata.faces.data[faceIndex];
      
      const newAvatarPath = await updatePersonAvatarIfBetter(
        photoPath,
        faceData,
        personId,
        person.avatar ?? null,
        uploadsDir
      );
      
      if (newAvatarPath && newAvatarPath !== person.avatar) {
        person.avatar = newAvatarPath;
      }
    } catch (avatarError) {
      console.error('Failed to generate avatar for person:', personId, avatarError);
      // Continue without failing the face assignment
    }
    
    // Update person's photo count
    const personPhotoCount = await Photo.countDocuments({
      'metadata.faces.data.personId': personId
    });
    person.photoCount = personPhotoCount + 1;
    
    await Promise.all([photo.save(), person.save()]);
    
    res.json({
      message: 'Face assigned successfully',
      photo: {
        id: photo.id,
        faces: photo.metadata.faces
      },
      person: {
        id: person.id,
        name: person.name,
        photoCount: person.photoCount,
        avatar: person.avatar
      }
    });
  } catch (error) {
    console.error('Error assigning face:', error);
    res.status(500).json({ error: 'Failed to assign face' });
  }
});

// Unassign face from person
router.post('/unassign-face', async (req, res) => {
  try {
    const { photoId, faceIndex } = req.body;
    
    if (!photoId || faceIndex === undefined) {
      return res.status(400).json({ 
        error: 'photoId and faceIndex are required' 
      });
    }
    
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!photo.metadata.faces?.data || faceIndex >= photo.metadata.faces.data.length) {
      return res.status(400).json({ error: 'Invalid face index' });
    }
    
    const face = photo.metadata.faces.data[faceIndex];
    const personId = face.personId;
    
    // Remove assignment
    delete face.personId;
    delete face.personName;
    
    await photo.save();
    
    // Update person's photo count if they were assigned
    if (personId) {
      const person = await Person.findById(personId);
      if (person) {
        const personPhotoCount = await Photo.countDocuments({
          'metadata.faces.data.personId': personId
        });
        person.photoCount = personPhotoCount;
        await person.save();
      }
    }
    
    res.json({
      message: 'Face unassigned successfully',
      photo: {
        id: photo.id,
        faces: photo.metadata.faces
      }
    });
  } catch (error) {
    console.error('Error unassigning face:', error);
    res.status(500).json({ error: 'Failed to unassign face' });
  }
});

// Get person suggestions for a face
router.post('/suggest-person', async (req, res) => {
  try {
    const { faceDescriptor, threshold = 0.6 } = req.body;
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ 
        error: 'Valid 128-dimensional face descriptor is required' 
      });
    }
    
    const suggestions = await Person.findSimilarPersons(
      faceDescriptor, 
      threshold
    ) as PersonSuggestion[];
    
    res.json({
      suggestions: suggestions.slice(0, 5), // Return top 5 matches
      threshold
    });
  } catch (error) {
    console.error('Error getting person suggestions:', error);
    res.status(500).json({ error: 'Failed to get person suggestions' });
  }
});

// Get unassigned faces
router.get('/unassigned-faces', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    // Find photos with unassigned faces
    const photos = await Photo.find({
      'metadata.faces.detected': true,
      'metadata.faces.data': {
        $elemMatch: {
          personId: { $exists: false }
        }
      }
    })
    .populate('eventId', 'name')
    .sort({ 'metadata.dateTime': -1 })
    .skip(skip)
    .limit(limitNum);
    
    const unassignedFaces = photos.flatMap(photo => {
      const populatedEvent = photo.eventId as any;
      return photo.metadata.faces?.data
        .map((face, index) => ({
          photoId: photo.id,
          faceIndex: index,
          face,
          photo: {
            id: photo.id,
            filename: photo.filename,
            originalName: photo.originalName,
            thumbnailPath: photo.thumbnailPath,
            eventName: populatedEvent?.name || 'Unknown Event'
          }
        }))
        .filter(item => !item.face.personId) || [];
    });
    
    const totalUnassigned = await Photo.aggregate([
      { $match: { 'metadata.faces.detected': true } },
      { $unwind: '$metadata.faces.data' },
      { $match: { 'metadata.faces.data.personId': { $exists: false } } },
      { $count: 'total' }
    ]);
    
    res.json({
      faces: unassignedFaces,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUnassigned[0]?.total || 0,
        totalPages: Math.ceil((totalUnassigned[0]?.total || 0) / limitNum),
        hasNext: pageNum < Math.ceil((totalUnassigned[0]?.total || 0) / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching unassigned faces:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned faces' });
  }
});

// Serve avatar files
router.get('/avatar/:personId', async (req, res) => {
  try {
    const personId = req.params.personId;
    
    // Find the person to get their avatar path
    const person = await Person.findById(personId);
    if (!person || !person.avatar) {
      return res.status(404).json({ error: 'Avatar not found' });
    }
    
    const uploadsDir = process.env.UPLOAD_PATH || '../uploads';
    const avatarPath = path.join(uploadsDir, person.avatar);
    
    // Check if file exists
    await fs.access(avatarPath);
    
    // Serve the avatar file
    res.sendFile(path.resolve(avatarPath));
  } catch (error) {
    console.error('Error serving avatar file:', error);
    res.status(404).json({ error: 'Avatar file not found' });
  }
});

export default router;
