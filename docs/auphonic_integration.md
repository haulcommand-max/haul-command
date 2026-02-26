# Auphonic Audio Enhancement Integration
## Real API Integration for Haul Command Content Engine

---

## Setup

### 1. Environment Variable

Store in `.env` (never commit this file):
```
AUPHONIC_API_KEY=sbp_e6e0d5e68ab4fbe2734d4100df1ce8b7ab2aff01
```

### 2. Create Auphonic Preset (One-Time)

Go to [auphonic.com/engine/preset/](https://auphonic.com/engine/preset/) and create a preset named **"HC Content Engine"** with these settings:

| Setting | Value |
|---|---|
| Noise Reduction | ON |
| Denoise Amount | 12 (moderate — preserves voice character) |
| Adaptive Leveler | ON |
| Loudness Normalization | ON |
| Loudness Target | -16 LUFS (YouTube/social standard) |
| Max Peak | -1.0 dB |
| Filtering | ON (hum removal) |
| Silence Cutter | ON |
| Filler Cutter | ON (removes "um", "uh") |
| Cough Cutter | ON |

Save the preset and copy the **Preset UUID** (e.g., `ceigtvDv8jH6NaK52Z5eXH`).

Store in `.env`:
```
AUPHONIC_PRESET_UUID=YOUR_PRESET_UUID_HERE
```

---

## API Calls

### Upload + Start Production (Local File)

```bash
curl -X POST https://auphonic.com/api/simple/productions.json \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
    -F "preset=${AUPHONIC_PRESET_UUID}" \
    -F "title=HC-${DATE}-${FILENAME}" \
    -F "input_file=@/path/to/audio_or_video.mp4" \
    -F "action=start"
```

### Upload from HTTP URL (No Local Download Needed)

```bash
curl -X POST https://auphonic.com/api/simple/productions.json \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
    -F "preset=${AUPHONIC_PRESET_UUID}" \
    -F "title=HC-${DATE}-${FILENAME}" \
    -F "input_file=https://your-cdn.com/raw_video.mp4" \
    -F "action=start"
```

### Full Production with HC Metadata

```bash
curl -X POST https://auphonic.com/api/simple/productions.json \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
    -F "preset=${AUPHONIC_PRESET_UUID}" \
    -F "title=HC Content - ${TITLE}" \
    -F "artist=Haul Command" \
    -F "album=HC Content Engine" \
    -F "publisher=Haul Command LLC" \
    -F "url=https://haulcommand.com" \
    -F "tags=haul command, pilot car, oversize load, escort" \
    -F "image=@./brand-assets/hc-cover.jpg" \
    -F "input_file=@${INPUT_FILE}" \
    -F "filtering=true" \
    -F "leveler=true" \
    -F "normloudness=true" \
    -F "loudnesstarget=-16" \
    -F "maxpeak=-1" \
    -F "denoise=true" \
    -F "denoiseamount=12" \
    -F "silence_cutter=true" \
    -F "filler_cutter=true" \
    -F "cough_cutter=true" \
    -F "action=start"
```

### Check Production Status

```bash
# Get production UUID from the creation response
PRODUCTION_UUID="the-uuid-from-response"

curl https://auphonic.com/api/production/${PRODUCTION_UUID}.json \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}"
```

Status values: `0` = Incomplete, `2` = Done, `3` = Error, `9` = Processing

### Download Enhanced Audio

```bash
# After status == 2 (Done), download result files
curl https://auphonic.com/api/production/${PRODUCTION_UUID}.json \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
    | jq '.data.output_files[0].download_url'

# Then download:
curl -o enhanced_audio.mp4 "${DOWNLOAD_URL}" \
    -H "Authorization: bearer ${AUPHONIC_API_KEY}"
```

---

## Node.js Integration Script

```javascript
// auphonic.js — Auphonic API wrapper for HC Content Engine
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://auphonic.com/api';

class AuphonicClient {
    constructor(apiKey, presetUuid) {
        this.apiKey = apiKey;
        this.presetUuid = presetUuid;
    }

    /**
     * Upload a local file and start processing
     * @param {string} filePath - Absolute path to audio/video file
     * @param {string} title - Production title
     * @returns {Promise<{uuid: string, status_url: string}>}
     */
    async processFile(filePath, title) {
        const FormData = (await import('form-data')).default;
        const form = new FormData();

        form.append('preset', this.presetUuid);
        form.append('title', title || `HC-${Date.now()}`);
        form.append('artist', 'Haul Command');
        form.append('publisher', 'Haul Command LLC');
        form.append('tags', 'haul command, pilot car, oversize load');
        form.append('input_file', fs.createReadStream(filePath));
        form.append('filtering', 'true');
        form.append('leveler', 'true');
        form.append('normloudness', 'true');
        form.append('loudnesstarget', '-16');
        form.append('maxpeak', '-1');
        form.append('denoise', 'true');
        form.append('denoiseamount', '12');
        form.append('silence_cutter', 'true');
        form.append('filler_cutter', 'true');
        form.append('cough_cutter', 'true');
        form.append('action', 'start');

        const response = await fetch(`${API_BASE}/simple/productions.json`, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${this.apiKey}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        return {
            uuid: data.data.uuid,
            status: data.data.status,
            status_url: `${API_BASE}/production/${data.data.uuid}.json`
        };
    }

    /**
     * Upload from URL (no local file needed)
     * @param {string} url - Public URL to audio/video
     * @param {string} title - Production title
     */
    async processUrl(url, title) {
        const FormData = (await import('form-data')).default;
        const form = new FormData();

        form.append('preset', this.presetUuid);
        form.append('title', title || `HC-${Date.now()}`);
        form.append('input_file', url);
        form.append('action', 'start');

        const response = await fetch(`${API_BASE}/simple/productions.json`, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${this.apiKey}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        return {
            uuid: data.data.uuid,
            status: data.data.status,
            status_url: `${API_BASE}/production/${data.data.uuid}.json`
        };
    }

    /**
     * Poll for completion
     * @param {string} uuid - Production UUID
     * @param {number} intervalMs - Poll interval (default 10s)
     * @param {number} maxWaitMs - Max wait time (default 10min)
     */
    async waitForCompletion(uuid, intervalMs = 10000, maxWaitMs = 600000) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            const response = await fetch(
                `${API_BASE}/production/${uuid}.json`,
                { headers: { 'Authorization': `bearer ${this.apiKey}` } }
            );
            const data = await response.json();
            const status = data.data.status;

            // Status codes: 0=Incomplete, 2=Done, 3=Error, 9=Processing
            if (status === 2) {
                return {
                    success: true,
                    output_files: data.data.output_files,
                    statistics: data.data.statistics
                };
            }

            if (status === 3) {
                return {
                    success: false,
                    error: data.data.error_message
                };
            }

            console.log(`[Auphonic] Processing... status=${status}`);
            await new Promise(r => setTimeout(r, intervalMs));
        }

        return { success: false, error: 'Timeout waiting for processing' };
    }

    /**
     * Download the enhanced result file
     * @param {string} downloadUrl - URL from output_files
     * @param {string} outputPath - Local path to save
     */
    async downloadResult(downloadUrl, outputPath) {
        const response = await fetch(downloadUrl, {
            headers: { 'Authorization': `bearer ${this.apiKey}` }
        });

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        console.log(`[Auphonic] Saved enhanced audio to: ${outputPath}`);
        return outputPath;
    }
}

module.exports = { AuphonicClient };

// --- Usage Example ---
// const { AuphonicClient } = require('./auphonic');
//
// const client = new AuphonicClient(
//     process.env.AUPHONIC_API_KEY,
//     process.env.AUPHONIC_PRESET_UUID
// );
//
// async function enhanceVideo(inputPath) {
//     const prod = await client.processFile(inputPath, 'My Video Title');
//     console.log('Production started:', prod.uuid);
//
//     const result = await client.waitForCompletion(prod.uuid);
//     if (result.success) {
//         const outputPath = inputPath.replace('.mp4', '_enhanced.mp4');
//         await client.downloadResult(
//             result.output_files[0].download_url,
//             outputPath
//         );
//     }
// }
```

---

## n8n Integration

For the Content Rail n8n flow, use HTTP Request nodes:

### Node 1: Start Auphonic Production
- **Method:** POST
- **URL:** `https://auphonic.com/api/simple/productions.json`
- **Headers:** `Authorization: bearer {{$env.AUPHONIC_API_KEY}}`
- **Body Type:** Form-Data
- **Fields:**
  - `preset`: `{{$env.AUPHONIC_PRESET_UUID}}`
  - `title`: `HC-{{$json.order_id}}-{{$now.format('YYYYMMDD')}}`
  - `input_file`: `{{$json.video_url}}`
  - `action`: `start`

### Node 2: Wait 30s
- **Type:** Wait node, 30 seconds

### Node 3: Poll Status (Loop)
- **Method:** GET
- **URL:** `https://auphonic.com/api/production/{{$json.data.uuid}}.json`
- **Headers:** `Authorization: bearer {{$env.AUPHONIC_API_KEY}}`
- **Continue if:** `$json.data.status !== 2`
- **Loop back to Wait node**

### Node 4: Download Result
- **Method:** GET
- **URL:** `{{$json.data.output_files[0].download_url}}`
- **Headers:** `Authorization: bearer {{$env.AUPHONIC_API_KEY}}`
- **Save to:** Binary output → next node (Remotion caption overlay)

---

## Audio Algorithm Reference

| Parameter | Type | Description | HC Default |
|---|---|---|---|
| `filtering` | bool | Hum/rumble removal | `true` |
| `leveler` | bool | Adaptive volume leveler | `true` |
| `normloudness` | bool | Loudness normalization | `true` |
| `loudnesstarget` | int | Target LUFS | `-16` |
| `maxpeak` | float | Max true peak dB | `-1.0` |
| `denoise` | bool | Background noise reduction | `true` |
| `denoiseamount` | int | 0-100 (aggressive) | `12` |
| `silence_cutter` | bool | Remove silence gaps | `true` |
| `filler_cutter` | bool | Remove "um", "uh" | `true` |
| `cough_cutter` | bool | Remove coughs | `true` |
| `music_cutter` | bool | Detect music sections | `false` |

### Loudness Targets by Platform

| Platform | Target LUFS | Max Peak |
|---|---|---|
| YouTube | -14 | -1 dB |
| Podcast/Spotify | -16 | -1 dB |
| TikTok/Reels | -14 | -1 dB |
| Broadcast (TV) | -24 | -2 dB |
| HC Default | -16 | -1 dB |

---

## Batch Processing Script

```bash
#!/bin/bash
# batch_enhance.sh — Process all videos in a folder through Auphonic

INPUT_DIR="${1:-.videos-to-edit}"
OUTPUT_DIR="${2:-./completed-edits}"

source .env  # loads AUPHONIC_API_KEY and AUPHONIC_PRESET_UUID

mkdir -p "$OUTPUT_DIR"

for file in "$INPUT_DIR"/*.{mp4,mov,wav,mp3}; do
    [ -f "$file" ] || continue

    FILENAME=$(basename "$file")
    TITLE="HC-$(date +%Y%m%d)-${FILENAME%.*}"

    echo "[Auphonic] Processing: $FILENAME"

    # Start production
    RESPONSE=$(curl -s -X POST https://auphonic.com/api/simple/productions.json \
        -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
        -F "preset=${AUPHONIC_PRESET_UUID}" \
        -F "title=${TITLE}" \
        -F "input_file=@${file}" \
        -F "action=start")

    UUID=$(echo "$RESPONSE" | jq -r '.data.uuid')
    echo "[Auphonic] Production started: $UUID"

    # Poll until done
    while true; do
        sleep 15
        STATUS=$(curl -s https://auphonic.com/api/production/${UUID}.json \
            -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
            | jq -r '.data.status')

        if [ "$STATUS" = "2" ]; then
            echo "[Auphonic] Done! Downloading..."
            DOWNLOAD_URL=$(curl -s https://auphonic.com/api/production/${UUID}.json \
                -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
                | jq -r '.data.output_files[0].download_url')

            curl -o "$OUTPUT_DIR/${FILENAME%.*}_enhanced.${FILENAME##*.}" \
                "$DOWNLOAD_URL" \
                -H "Authorization: bearer ${AUPHONIC_API_KEY}"

            echo "[Auphonic] Saved: ${FILENAME%.*}_enhanced.${FILENAME##*.}"
            break
        elif [ "$STATUS" = "3" ]; then
            echo "[Auphonic] ERROR processing $FILENAME"
            break
        else
            echo "[Auphonic] Still processing... (status=$STATUS)"
        fi
    done
done

echo "[Auphonic] Batch complete. Enhanced files in: $OUTPUT_DIR"
```
