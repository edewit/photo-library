#!/bin/bash

echo "🏗️  Setting up Photo Library Application..."

# Check if MongoDB is available (either installed or can use container)
if ! command -v mongod &> /dev/null && ! command -v podman &> /dev/null && ! command -v docker &> /dev/null; then
    echo "⚠️  MongoDB is not available. You have several options:"
    echo "   1. Install MongoDB locally:"
    echo "      - On Ubuntu/Debian: sudo apt install mongodb"
    echo "      - On macOS: brew install mongodb/brew/mongodb-community"
    echo "   2. Use Podman: sudo dnf install podman (Fedora) or equivalent"
    echo "   3. Use Docker: install Docker Desktop"
    echo "   4. Use MongoDB Atlas for a cloud database"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Create environment file
if [ ! -f backend/.env ]; then
    echo "📄 Creating backend environment file..."
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env - please review and update the settings if needed"
else
    echo "✅ Backend environment file already exists"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/thumbnails
echo "✅ Created uploads directory structure"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install-all

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start MongoDB (choose one option):"
echo ""
echo "   Option A - Using Podman:"
echo "   podman run --name mongodb -d -p 27017:27017 -v mongodb_data:/data/db mongo:latest"
echo ""
echo "   Option B - Using Docker:"
echo "   docker run --name mongodb -d -p 27017:27017 -v mongodb_data:/data/db mongo:latest"
echo ""
echo "   Option C - Local installation:"
echo "   mongod"
echo ""
echo "2. Start the development servers:"
echo "   pnpm dev"
echo ""
echo "3. Open your browser to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"
