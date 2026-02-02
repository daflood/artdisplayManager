# Art Display Manager

## What This Is

A digital art display system that replaces the Samsung Frame TV's inadequate built-in slideshow with a proper solution: Immich running on a QNAP NAS, displayed via Apple TV. Includes a media scanner to find and filter 16:9 art from an existing collection spanning multiple hard drives.

## Core Value

Art displays beautifully on the living room TV without fighting Samsung's terrible interface — curated collections that just work.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Media scanner finds all images and videos across specified drives
- [ ] Scanner filters for 16:9 aspect ratio content
- [ ] Scanner outputs list of matching files with metadata
- [ ] Filtered media can be copied to NAS in organized structure
- [ ] Immich deployed and running on QNAP NAS
- [ ] Media imported into Immich
- [ ] Apple TV displays slideshows from Immich via Immich-Viewer app
- [ ] Can create albums/playlists in Immich for different moods

### Out of Scope

- Samsung Frame TV direct integration — trying Apple TV approach instead
- Automatic mood/season categorization — manual organization first
- Time-of-day scheduling — not supported by Immich-Viewer, defer to v2
- RAW file processing — stick to processed images for now
- Multi-room sync — single display for now

## Context

**The Problem**: Samsung Frame TV's built-in slideshow has:
- Awful one-image-at-a-time upload interface via phone
- Unwanted mats and frames it keeps adding
- Almost no playback controls
- No video support

**The Collection**: Thousands of art images and videos accumulated over time across:
- 5 hard drives connected to Windows PC
- Some already on QNAP NAS
- Mix of digital art, photos, and ambient art videos
- Need to filter for 16:9 native aspect ratio

**Research Findings**: Tested solutions exist:
- Immich (91k GitHub stars) — mature self-hosted photo/video management with AI
- Immich-Viewer — Apple TV app that displays from Immich server
- No existing solution has 16:9 filtering, so custom scanner needed

**Hardware**:
- Display: Samsung Frame TV (16:9)
- Controller: Apple TV
- Storage: QNAP NAS (destination for organized media)
- Source: Windows PC with 5 hard drives

## Constraints

- **Platform**: Scanner must run on Windows (where the drives are)
- **Storage**: Final media lives on QNAP NAS
- **Display**: Using Apple TV + Immich-Viewer (not direct Samsung Frame integration)
- **Scale**: Thousands of files to process

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Apple TV + Immich over Samsung Frame direct | Better control, video support, mature ecosystem | — Pending |
| Try existing solutions before building custom | Immich has 91k stars, proven solution | — Pending |
| Custom scanner for 16:9 filtering | No existing tool does this | — Pending |
| Categorization deferred | Get basics working first, organize later | — Pending |

---
*Last updated: 2026-02-02 after initialization*
