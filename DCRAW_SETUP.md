# DCraw Setup for Enhanced Raw File Support

The photo library now includes optional `dcraw` support for generating thumbnails from raw camera files that don't have embedded thumbnails.

## Installation

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install dcraw
```

### Fedora/RHEL/CentOS
```bash
sudo dnf install dcraw
# or for older versions:
sudo yum install dcraw
```

### macOS
```bash
brew install dcraw
```

### Arch Linux
```bash
sudo pacman -S dcraw
```

## How DCraw Works

DCraw can do **two things** for raw files:

### 1. Extract Embedded Thumbnails
```bash
dcraw -e photo.cr2
# Creates: photo.thumb.jpg (if embedded thumbnail exists)
```

### 2. Create New Thumbnails from Raw Data
```bash
dcraw -T -h -q 0 -w -t 0 photo.cr2
# Converts raw data to TIFF format (photo.tiff)
# -T = TIFF output, -h = half-size, -q 0 = fast, -w = camera white balance
# -t 0 = preserve orientation (Sharp handles rotation automatically)
```

## Multi-Tier Thumbnail System

The system uses this priority order:

1. **🥇 exifr extraction** (pure JavaScript, fastest)
2. **🥈 dcraw embedded extraction** (`dcraw -e`)
3. **🥉 dcraw TIFF conversion** (`dcraw -T -h -q 0 -w`)
4. **🔄 dcraw PPM + ImageMagick fallback** (if TIFF fails)
5. **🏳️ Styled placeholder** (final fallback)

This ensures you get the best possible thumbnail for every raw file!

## Automatic Rotation Support

The system automatically handles photo orientation using EXIF data:

- **Sharp Auto-Rotation**: `.rotate()` automatically reads EXIF orientation tags
- **Proper Orientation**: Thumbnails display correctly regardless of camera orientation
- **Portrait/Landscape**: Vertical photos show as vertical thumbnails
- **Preserves EXIF**: dcraw uses `-t 0` to preserve original orientation data

### Supported Orientations:
- Normal (1)
- Horizontal flip (2)
- 180° rotation (3)
- Vertical flip (4)
- Horizontal flip + 90° CCW (5)
- 90° CW rotation (6)
- Horizontal flip + 90° CW (7)
- 90° CCW rotation (8)

## Benefits of Installing DCraw

- **Better Coverage**: Handles raw files without embedded thumbnails
- **Higher Quality**: Can generate thumbnails from the actual raw data
- **Wider Compatibility**: Supports older camera formats
- **Fallback Safety**: System works fine without dcraw, just with fewer thumbnail options

## Verification

After installation, restart your photo library backend. You should see this message in the logs:
```
dcraw is available for raw file processing
```

If dcraw is not available, you'll see:
```
dcraw is not available, will use embedded thumbnails only
```

## Supported Raw Formats with DCraw

DCraw supports over 400 camera models and formats, including:
- Canon: CR2, CR3, CRW
- Nikon: NEF, NRW
- Sony: ARW, SRF, SR2
- Adobe: DNG
- Fuji: RAF
- Olympus: ORF
- Pentax: PEF
- And many more...

The system automatically detects dcraw availability and uses it when needed.
