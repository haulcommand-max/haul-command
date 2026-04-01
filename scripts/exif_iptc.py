import os
from PIL import Image

# Requires piexif: pip install piexif
try:
    import piexif
    from piexif import helper
except ImportError:
    print("piexif not installed. Install via: pip install piexif")
    exit(1)

IMAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images")

def embed_metadata(filepath):
    try:
        img = Image.open(filepath)
        
        # Load existing exif or create new
        if 'exif' in img.info:
            exif_dict = piexif.load(img.info['exif'])
        else:
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

        # Add heavy haul metadata
        # 270 = ImageDescription, 315 = Artist, 33432 = Copyright
        exif_dict["0th"][piexif.ImageIFD.ImageDescription] = "Haul Command Heavy Haul Escort and Route Visualization".encode('utf-8')
        exif_dict["0th"][piexif.ImageIFD.Artist] = "Haul Command Intelligence Unit".encode('utf-8')
        exif_dict["0th"][piexif.ImageIFD.Copyright] = "Copyright 2026 Haul Command. All rights reserved.".encode('utf-8')

        exif_bytes = piexif.dump(exif_dict)
        
        # Save output
        img.save(filepath, "jpeg", exif=exif_bytes)
        print(f"Successfully tagged: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error processing {os.path.basename(filepath)}: {e}")

if __name__ == "__main__":
    count = 0
    if os.path.exists(IMAGE_DIR):
        for filename in os.listdir(IMAGE_DIR):
            if filename.lower().endswith(('.jpg', '.jpeg')):
                filepath = os.path.join(IMAGE_DIR, filename)
                embed_metadata(filepath)
                count += 1
    print(f"Metadata embedded in {count} images.")
