#!/bin/bash
# batch_enhance.sh — Process all videos in a folder through Auphonic
# Usage: bash batch_enhance.sh [input_dir] [output_dir]

INPUT_DIR="${1:-./videos-to-edit}"
OUTPUT_DIR="${2:-./completed-edits}"

# Load API keys from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "[ERROR] No .env file found. Create one with AUPHONIC_API_KEY and AUPHONIC_PRESET_UUID."
    exit 1
fi

if [ -z "$AUPHONIC_API_KEY" ]; then
    echo "[ERROR] AUPHONIC_API_KEY not set in .env"
    exit 1
fi

if [ -z "$AUPHONIC_PRESET_UUID" ]; then
    echo "[ERROR] AUPHONIC_PRESET_UUID not set in .env"
    echo "Create a preset at https://auphonic.com/engine/preset/ and add UUID to .env"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "========================================"
echo "  Auphonic Batch Enhancer"
echo "  Input:  $INPUT_DIR"
echo "  Output: $OUTPUT_DIR"
echo "========================================"

PROCESSED=0
FAILED=0

for file in "$INPUT_DIR"/*.mp4 "$INPUT_DIR"/*.mov "$INPUT_DIR"/*.wav "$INPUT_DIR"/*.mp3; do
    [ -f "$file" ] || continue

    FILENAME=$(basename "$file")
    TITLE="HC-$(date +%Y%m%d)-${FILENAME%.*}"

    echo ""
    echo "[Auphonic] Processing: $FILENAME"
    echo "[Auphonic] Title: $TITLE"

    # Start production
    RESPONSE=$(curl -s -X POST https://auphonic.com/api/simple/productions.json \
        -H "Authorization: bearer ${AUPHONIC_API_KEY}" \
        -F "preset=${AUPHONIC_PRESET_UUID}" \
        -F "title=${TITLE}" \
        -F "artist=Haul Command" \
        -F "publisher=Haul Command LLC" \
        -F "tags=haul command, pilot car, oversize load" \
        -F "input_file=@${file}" \
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
        -F "action=start")

    UUID=$(echo "$RESPONSE" | jq -r '.data.uuid // empty')

    if [ -z "$UUID" ]; then
        echo "[ERROR] Failed to start production for $FILENAME"
        echo "$RESPONSE" | jq '.error_message // .status_code // .'
        FAILED=$((FAILED + 1))
        continue
    fi

    echo "[Auphonic] Production started: $UUID"

    # Poll until done (max 10 minutes per file)
    ATTEMPTS=0
    MAX_ATTEMPTS=40  # 40 * 15s = 10 minutes

    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
        sleep 15
        ATTEMPTS=$((ATTEMPTS + 1))

        STATUS_RESPONSE=$(curl -s https://auphonic.com/api/production/${UUID}.json \
            -H "Authorization: bearer ${AUPHONIC_API_KEY}")

        STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')

        if [ "$STATUS" = "2" ]; then
            echo "[Auphonic] Done! Downloading..."

            DOWNLOAD_URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.output_files[0].download_url')
            EXT="${FILENAME##*.}"
            OUTPUT_FILE="$OUTPUT_DIR/${FILENAME%.*}_enhanced.${EXT}"

            curl -s -o "$OUTPUT_FILE" "$DOWNLOAD_URL" \
                -H "Authorization: bearer ${AUPHONIC_API_KEY}"

            echo "[Auphonic] Saved: $OUTPUT_FILE"
            PROCESSED=$((PROCESSED + 1))
            break

        elif [ "$STATUS" = "3" ]; then
            ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.data.error_message')
            echo "[ERROR] Processing failed for $FILENAME: $ERROR_MSG"
            FAILED=$((FAILED + 1))
            break

        else
            echo "[Auphonic] Still processing... (status=$STATUS, attempt $ATTEMPTS/$MAX_ATTEMPTS)"
        fi
    done

    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        echo "[ERROR] Timeout processing $FILENAME (UUID: $UUID)"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "========================================"
echo "  Batch Complete"
echo "  Processed: $PROCESSED"
echo "  Failed:    $FAILED"
echo "  Output:    $OUTPUT_DIR"
echo "========================================"
