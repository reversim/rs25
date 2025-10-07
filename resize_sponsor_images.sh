#!/bin/bash

# Script to resize all images in the sponsors folder to max 1000px width or height
# while maintaining aspect ratio using ffmpeg

# Set the sponsors directory path
SPONSORS_DIR="src/assets/sponsors/phasev"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install ffmpeg first."
    echo "On macOS: brew install ffmpeg"
    echo "On Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg"
    exit 1
fi

# Check if ffprobe is installed
if ! command -v ffprobe &> /dev/null; then
    echo "Error: ffprobe is not installed. Please install ffmpeg (which includes ffprobe)."
    exit 1
fi

# Check if sponsors directory exists
if [ ! -d "$SPONSORS_DIR" ]; then
    echo "Error: Sponsors directory '$SPONSORS_DIR' not found."
    exit 1
fi

echo "Starting image resize process..."
echo "Target directory: $SPONSORS_DIR"
echo "Max dimensions: 1200x1200 (maintaining aspect ratio)"
echo "ffmpeg version: $(ffmpeg -version | head -n1)"
echo "ffprobe version: $(ffprobe -version | head -n1)"
echo "----------------------------------------"

# Counter for processed files
processed_count=0
skipped_count=0
error_count=0

# Create temporary file list to avoid subshell issues
temp_file_list=$(mktemp)
find "$SPONSORS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.gif" -o -iname "*.bmp" -o -iname "*.tiff" \) > "$temp_file_list"

echo "Found $(wc -l < "$temp_file_list") image files to process"
echo "----------------------------------------"

# Process each image file
while IFS= read -r image_file; do
    echo "Processing: $image_file"
    
    # Check if file exists and is readable
    if [ ! -f "$image_file" ]; then
        echo "  ❌ File does not exist: $image_file"
        ((error_count++))
        continue
    fi
    
    if [ ! -r "$image_file" ]; then
        echo "  ❌ File is not readable: $image_file"
        ((error_count++))
        continue
    fi
    
    # Get file size for logging
    file_size=$(ls -lh "$image_file" | awk '{print $5}')
    echo "  File size: $file_size"
    
    # Get image dimensions using ffprobe
    echo "  Getting dimensions with ffprobe..."
    dimensions=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$image_file" 2>&1)
    ffprobe_exit_code=$?
    
    if [ $ffprobe_exit_code -ne 0 ]; then
        echo "  ❌ ffprobe failed with exit code $ffprobe_exit_code"
        echo "  ffprobe output: $dimensions"
        ((error_count++))
        continue
    fi
    
    if [ -z "$dimensions" ]; then
        echo "  ❌ Could not get dimensions for $image_file"
        ((error_count++))
        continue
    fi
    
    # Parse width and height
    width=$(echo "$dimensions" | cut -d',' -f1)
    height=$(echo "$dimensions" | cut -d',' -f2)
    
    echo "  Current dimensions: ${width}x${height}"
    
    # Validate dimensions are numbers
    if ! [[ "$width" =~ ^[0-9]+$ ]] || ! [[ "$height" =~ ^[0-9]+$ ]]; then
        echo "  ❌ Invalid dimensions: width='$width', height='$height'"
        ((error_count++))
        continue
    fi
    
    # Check if image needs resizing
    if [ "$width" -le 1200 ] && [ "$height" -le 1200 ]; then
        echo "  ✅ Image already within limits, skipping..."
        ((skipped_count++))
        continue
    fi
    
    # Create backup
    backup_file="${image_file}.backup"
    echo "  Creating backup: $backup_file"
    if ! cp "$image_file" "$backup_file"; then
        echo "  ❌ Failed to create backup file"
        ((error_count++))
        continue
    fi
    
    # Create temporary file for the resized image (preserve extension for ffmpeg)
    file_extension="${image_file##*.}"
    temp_file="${image_file%.*}_temp.${file_extension}"
    echo "  Temporary file: $temp_file"
    
    # Resize image using ffmpeg
    echo "  Running ffmpeg resize command..."
    ffmpeg_cmd="ffmpeg -i \"$image_file\" -vf \"scale=1200:1200:force_original_aspect_ratio=decrease\" -y \"$temp_file\""
    echo "  Command: $ffmpeg_cmd"
    
    if ffmpeg -i "$image_file" -vf "scale=1200:1200:force_original_aspect_ratio=decrease" -y "$temp_file" 2>&1; then
        echo "  ✅ ffmpeg completed successfully"
        
        # Check if temp file was created and has content
        if [ ! -f "$temp_file" ] || [ ! -s "$temp_file" ]; then
            echo "  ❌ Temporary file is empty or doesn't exist"
            rm -f "$temp_file"
            mv "$backup_file" "$image_file"
            ((error_count++))
            continue
        fi
        
        # Get new dimensions
        echo "  Getting new dimensions..."
        new_dimensions=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$temp_file" 2>&1)
        
        if [ -z "$new_dimensions" ]; then
            echo "  ❌ Could not get new dimensions"
            rm -f "$temp_file"
            mv "$backup_file" "$image_file"
            ((error_count++))
            continue
        fi
        
        new_width=$(echo "$new_dimensions" | cut -d',' -f1)
        new_height=$(echo "$new_dimensions" | cut -d',' -f2)
        
        # Get new file size
        new_file_size=$(ls -lh "$temp_file" | awk '{print $5}')
        
        # Replace original with resized image
        echo "  Replacing original file..."
        mv "$temp_file" "$image_file"
        
        echo "  ✅ Resized to: ${new_width}x${new_height} (size: $new_file_size)"
        
        # Remove backup if successful
        rm "$backup_file"
        ((processed_count++))
    else
        echo "  ❌ ffmpeg failed, restoring backup..."
        mv "$backup_file" "$image_file"
        rm -f "$temp_file"
        ((error_count++))
    fi
    
    echo ""
done < "$temp_file_list"

# Clean up temporary file
rm "$temp_file_list"

echo "----------------------------------------"
echo "Resize process completed!"
echo "Images processed: $processed_count"
echo "Images skipped: $skipped_count"
echo "Images with errors: $error_count"
echo ""
echo "Note: Original images were backed up during processing and removed after successful resize."
echo "If you need to revert changes, you can restore from git." 