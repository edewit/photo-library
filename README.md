# Photo Library Application

A modern photo library application built with React, Node.js, Express, and MongoDB. The application allows you to upload photos, automatically organize them into events based on EXIF date data, and browse your collection in an intuitive interface.

## Features

- **Photo Upload**: Drag and drop photo upload with support for multiple formats (JPEG, PNG, GIF, WebP, TIFF, BMP)
- **EXIF Data Extraction**: Automatically extracts metadata including GPS coordinates, camera settings, and timestamps
- **Smart Event Organization**: Suggests events based on photo dates with options to split, merge, and rename
- **Grid Views**: Beautiful grid layouts for both events and photos
- **Detailed Photo View**: Full-size photo display with comprehensive metadata sidebar
- **Thumbnail Generation**: Automatic thumbnail creation for fast browsing
- **Modern UI**: Built with PatternFly React components for a professional look

## Architecture

### Backend (Node.js + Express + MongoDB)
- RESTful API with TypeScript
- MongoDB for metadata storage
- Multer for file upload handling
- Sharp for thumbnail generation
- EXIFR for metadata extraction

### Frontend (React + Vite + PatternFly)
- Modern React with TypeScript
- Vite for fast development and building
- PatternFly for UI components
- React Router for navigation
- Axios for API communication

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB (choose one):
  - Local MongoDB installation
  - Podman or Docker for containerized MongoDB
  - MongoDB Atlas (cloud)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd /home/edewit/workspace/private/photo-library
   ```

2. Install dependencies for all packages:
   ```bash
   pnpm install-all
   ```

3. Set up environment variables:
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your MongoDB connection string and other settings
   ```

4. Start MongoDB (choose one option):

   **Option A - Using the provided script (easiest):**
   ```bash
   # Start MongoDB (automatically detects Podman or Docker)
   ./mongodb.sh start
   
   # Other useful commands:
   ./mongodb.sh status    # Check if running
   ./mongodb.sh stop      # Stop MongoDB
   ./mongodb.sh restart   # Restart MongoDB
   ./mongodb.sh logs      # View logs
   ```

   **Option B - Using Podman manually:**
   ```bash
   # Run MongoDB container
   podman run --name photo-library-mongodb -d -p 27017:27017 \
     -v photo-library-mongodb-data:/data/db mongo:latest
   
   # To stop: podman stop photo-library-mongodb
   # To start again: podman start photo-library-mongodb
   ```

   **Option C - Using Docker manually:**
   ```bash
   # Run MongoDB container
   docker run --name photo-library-mongodb -d -p 27017:27017 \
     -v photo-library-mongodb-data:/data/db mongo:latest
   
   # To stop: docker stop photo-library-mongodb
   # To start again: docker start photo-library-mongodb
   ```

   **Option D - Local installation:**
   ```bash
   mongod
   ```

   **Option E - MongoDB Atlas:**
   - Create a free account at https://www.mongodb.com/atlas
   - Create a cluster and get the connection string
   - Update `MONGODB_URI` in `backend/.env`

5. Start the development servers:
   ```bash
   pnpm dev
   ```

This will start both the backend (port 5000) and frontend (port 3000) in development mode.

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/photo-library
UPLOAD_PATH=../uploads
NODE_ENV=development
```

## Usage

1. **Upload Photos**: Click the "Upload Photos" button on the homepage and drag/drop your photos or click to select files.

2. **Organize Events**: After upload, the system will suggest events based on photo dates. You can:
   - Rename events
   - Split events into multiple parts
   - Merge events together
   - Add descriptions

3. **Browse Events**: The homepage shows all your events in a grid layout with cover photos and basic information.

4. **View Event Photos**: Click on an event to see all photos in that event.

5. **View Photo Details**: Click on any photo to see it full-size with detailed metadata including:
   - Camera information
   - Shooting settings (ISO, aperture, shutter speed)
   - GPS coordinates (if available)
   - File information

## API Endpoints

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/:id/photos` - Get photos for event

### Photos
- `POST /api/photos/upload` - Upload photos and get event suggestions
- `POST /api/photos/organize` - Organize photos into events
- `GET /api/photos/:id` - Get specific photo
- `DELETE /api/photos/:id` - Delete photo
- `GET /api/photos/file/:filename` - Serve photo file
- `GET /api/photos/thumbnail/:filename` - Serve thumbnail

## Development

### Backend Development
```bash
cd backend
pnpm dev  # Starts with nodemon for hot reloading
```

### Frontend Development
```bash
cd frontend
pnpm dev  # Starts Vite dev server with HMR
```

### Building for Production
```bash
pnpm build  # Builds both backend and frontend
```

### Type Checking
```bash
# Backend
cd backend && pnpm typecheck

# Frontend
cd frontend && pnpm typecheck
```

## File Structure

```
photo-library/
├── backend/
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── index.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── uploads/                # Uploaded photos and thumbnails
├── package.json           # Workspace root
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License
