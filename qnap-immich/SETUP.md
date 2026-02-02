# Immich Setup on QNAP

## Prerequisites

- QNAP with Container Station installed
- At least 8GB RAM (16GB recommended)

## Step 1: Create Folders on QNAP

SSH into your QNAP or use File Station to create:

```bash
# Create immich data directories
mkdir -p /share/CACHEDEV1_DATA/immich/library
mkdir -p /share/CACHEDEV1_DATA/immich/postgres
```

Note: Replace `CACHEDEV1_DATA` with your actual volume name if different.

## Step 2: Find Your Art Folder Path

Your art is in "Frame Aspect Ratio Optimized" folder. Find the full QNAP path:

```bash
# SSH into QNAP and find it
find /share -name "Frame Aspect Ratio Optimized" -type d 2>/dev/null
```

Update `EXTERNAL_LIBRARY` in `.env` with this path.

## Step 3: Configure .env

1. Edit `.env` file
2. Update paths for your QNAP volume
3. Change `DB_PASSWORD` to a random string (letters and numbers only)
4. Set your timezone

## Step 4: Deploy via Container Station

**Option A: Container Station UI**
1. Open Container Station
2. Go to "Applications" or "Create"
3. Click "Create Application"
4. Paste the contents of `docker-compose.yml`
5. Name it "immich"
6. Create

**Option B: SSH Command Line**
```bash
# Copy files to QNAP
scp docker-compose.yml .env admin@qnap-ip:/share/CACHEDEV1_DATA/immich/

# SSH in and deploy
ssh admin@qnap-ip
cd /share/CACHEDEV1_DATA/immich
docker-compose up -d
```

## Step 5: Access Immich

1. Open browser: `http://qnap-ip:2283`
2. Create admin account
3. Complete initial setup

## Step 6: Add External Library

1. Go to Administration → External Libraries
2. Click "Create Library"
3. Select a user to own the library
4. Set import path: `/external` (this maps to your art folder)
5. Click "Save"
6. Click "Scan" to import existing photos

## Verification

After scanning completes:
- You should see ~441 images in your library
- All your 16:9 curated art is now in Immich
- No files were copied - Immich reads them in place

## Troubleshooting

**Container won't start:**
- Check Container Station logs
- Verify paths exist and have correct permissions

**Can't access web UI:**
- Check port 2283 is not blocked
- Verify immich_server container is running

**External library not showing images:**
- Verify EXTERNAL_LIBRARY path is correct
- Check folder permissions (container needs read access)
- Trigger manual scan in External Libraries settings
