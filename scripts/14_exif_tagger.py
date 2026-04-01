import os
import glob
try:
    import piexif
except ImportError:
    print("❌ Error: 'piexif' module not found. Run: pip install piexif")
    exit(1)

# Default EXIF data to embed for global logistics geo-tagging
# Coordinate data: DFW area (Haul Command HQ geo center)
LATITUDE = 32.776664
LONGITUDE = -96.796988

def dec_to_dms(deg):
    d = int(deg)
    md = abs(deg - d) * 60
    m = int(md)
    sd = (md - m) * 60
    return ((abs(d), 1), (m, 1), (int(sd * 100), 100))

def embed_exif_geodata(image_path: str):
    try:
        exif_dict = piexif.load(image_path)
    except Exception:
        # If no exif, create a fresh dict
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": None}
    
    # Format lat/long
    lat_dms = dec_to_dms(LATITUDE)
    lon_dms = dec_to_dms(LONGITUDE)
    
    lat_ref = b'N' if LATITUDE >= 0 else b'S'
    lon_ref = b'E' if LONGITUDE >= 0 else b'W'

    # Add GPS EXIF Data
    gps_ifd = {
        piexif.GPSIFD.GPSLatitudeRef: lat_ref,
        piexif.GPSIFD.GPSLatitude: lat_dms,
        piexif.GPSIFD.GPSLongitudeRef: lon_ref,
        piexif.GPSIFD.GPSLongitude: lon_dms,
        piexif.GPSIFD.GPSAltitudeRef: 0,
        piexif.GPSIFD.GPSAltitude: (150, 1) # 150m above sea level
    }

    # Add generic image description & copyright
    zeroth_ifd = {
        piexif.ImageIFD.ImageDescription: b"Heavy haul route data visual. Haul Command Global Intelligence.",
        piexif.ImageIFD.Software: b"HaulCommand Visual Matrix v2026.4",
        piexif.ImageIFD.Copyright: b"Haul Command (c) 2026"
    }

    if "GPS" not in exif_dict or not exif_dict["GPS"]:
        exif_dict["GPS"] = gps_ifd
    else:
        exif_dict["GPS"].update(gps_ifd)
        
    exif_dict["0th"].update(zeroth_ifd)
    
    exif_bytes = piexif.dump(exif_dict)
    
    # Save back
    piexif.insert(exif_bytes, image_path)
    print(f"✅ EXIF embedded for: {os.path.basename(image_path)}")

def main():
    print("🚀 Initializing EXIF/IPTC Geodata Tagger...")
    
    public_images_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "images"))
    
    # Only JPG/JPEG is easily hackable via piexif without corruption
    search_pattern = os.path.join(public_images_dir, "**", "*.jpg")
    image_files = glob.glob(search_pattern, recursive=True)
    
    if not image_files:
         print(f"⚠️ No JPG files found in {public_images_dir}")
         return
         
    for img in image_files:
        embed_exif_geodata(img)

    print(f"🎉 Tagged {len(image_files)} images successfully.")

if __name__ == "__main__":
    main()
