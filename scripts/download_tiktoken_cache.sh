#!/bin/bash
# Pre-download tiktoken encoding for Zep container
# This avoids the "dial tcp timeout" issue when Zep starts

set -e

echo "=== Tiktoken Cache Pre-download ==="
echo "This script pre-downloads the tiktoken encoding file that Zep needs."
echo ""

# Create cache directory
CACHE_DIR="./zep/tiktoken_cache"
mkdir -p "$CACHE_DIR"

echo "✓ Created cache directory: $CACHE_DIR"

# Download cl100k_base.tiktoken (the encoding Zep uses)
TIKTOKEN_URL="https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken"
TIKTOKEN_FILE="$CACHE_DIR/cl100k_base.tiktoken"

if [ -f "$TIKTOKEN_FILE" ]; then
    echo "✓ Tiktoken file already exists: $TIKTOKEN_FILE"
    FILE_SIZE=$(stat -f%z "$TIKTOKEN_FILE" 2>/dev/null || stat -c%s "$TIKTOKEN_FILE" 2>/dev/null || echo "0")
    echo "  File size: $FILE_SIZE bytes"
else
    echo "Downloading tiktoken encoding from:"
    echo "  $TIKTOKEN_URL"
    echo "  to: $TIKTOKEN_FILE"
    echo ""

    curl -L -o "$TIKTOKEN_FILE" "$TIKTOKEN_URL" \
        || wget -O "$TIKTOKEN_FILE" "$TIKTOKEN_URL" \
        || { echo "❌ Failed to download tiktoken. Install curl or wget."; exit 1; }

    FILE_SIZE=$(stat -f%z "$TIKTOKEN_FILE" 2>/dev/null || stat -c%s "$TIKTOKEN_FILE" 2>/dev/null || echo "0")
    echo ""
    echo "✓ Downloaded successfully!"
    echo "  File size: $FILE_SIZE bytes"
fi

echo ""
echo "=== Pre-download Complete ==="
echo ""
echo "Next steps:"
echo "1. Ensure docker-compose.yml mounts this cache:"
echo "   volumes:"
echo "     - ./zep/tiktoken_cache:/var/lib/zep/tiktoken_cache:ro"
echo ""
echo "2. Start containers:"
echo "   docker compose up -d"
echo ""
