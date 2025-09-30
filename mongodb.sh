#!/bin/bash

# MongoDB management script for Podman/Docker
CONTAINER_NAME="photo-library-mongodb"
MONGODB_PORT="27017"
VOLUME_NAME="photo-library-mongodb-data"

# Detect container runtime
if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo "❌ Neither Podman nor Docker found. Please install one of them."
    exit 1
fi

function start_mongodb() {
    echo "🚀 Starting MongoDB with $RUNTIME..."
    
    # Check if container already exists
    if $RUNTIME ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        echo "📦 Container exists, starting it..."
        $RUNTIME start $CONTAINER_NAME
    else
        echo "📦 Creating new MongoDB container..."
        $RUNTIME run --name $CONTAINER_NAME \
            -d \
            -p $MONGODB_PORT:27017 \
            -v $VOLUME_NAME:/data/db \
            -e MONGO_INITDB_DATABASE=photo-library \
            mongo:latest
    fi
    
    echo "✅ MongoDB is running on port $MONGODB_PORT"
    echo "🔗 Connection string: mongodb://localhost:$MONGODB_PORT/photo-library"
}

function stop_mongodb() {
    echo "🛑 Stopping MongoDB..."
    $RUNTIME stop $CONTAINER_NAME
    echo "✅ MongoDB stopped"
}

function remove_mongodb() {
    echo "🗑️  Removing MongoDB container..."
    $RUNTIME stop $CONTAINER_NAME 2>/dev/null || true
    $RUNTIME rm $CONTAINER_NAME
    echo "✅ Container removed"
    echo "ℹ️  To also remove data volume, run: $RUNTIME volume rm $VOLUME_NAME"
}

function status_mongodb() {
    echo "📊 MongoDB Status:"
    if $RUNTIME ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q $CONTAINER_NAME; then
        $RUNTIME ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep $CONTAINER_NAME
        echo "✅ MongoDB is running"
    else
        echo "❌ MongoDB is not running"
    fi
}

function logs_mongodb() {
    echo "📋 MongoDB Logs:"
    $RUNTIME logs -f $CONTAINER_NAME
}

function usage() {
    echo "MongoDB Management Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|remove|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start   - Start MongoDB container"
    echo "  stop    - Stop MongoDB container"
    echo "  restart - Restart MongoDB container"
    echo "  remove  - Remove MongoDB container (data volume preserved)"
    echo "  status  - Show MongoDB container status"
    echo "  logs    - Show MongoDB logs (follow mode)"
    echo ""
    echo "Using container runtime: ${RUNTIME:-"none detected"}"
}

case "$1" in
    start)
        start_mongodb
        ;;
    stop)
        stop_mongodb
        ;;
    restart)
        stop_mongodb
        start_mongodb
        ;;
    remove)
        remove_mongodb
        ;;
    status)
        status_mongodb
        ;;
    logs)
        logs_mongodb
        ;;
    *)
        usage
        exit 1
        ;;
esac
