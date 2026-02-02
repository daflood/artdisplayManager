# Requirements: Art Display Manager

**Defined:** 2026-02-02
**Core Value:** Art displays beautifully on the living room TV without fighting Samsung's terrible interface

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Media Scanner

- [ ] **SCAN-01**: Scanner can scan specified directories for images and videos
- [ ] **SCAN-02**: Scanner filters for 16:9 aspect ratio content only
- [ ] **SCAN-03**: Scanner outputs list of matching files with metadata (path, dimensions, size)
- [ ] **SCAN-04**: Scanner detects and flags duplicate files

### File Organization

- [ ] **ORG-01**: Filtered files can be copied to NAS destination

### Immich Deployment

- [ ] **IMCH-01**: Immich deployed via Docker compose on QNAP NAS
- [ ] **IMCH-02**: Filtered media imported into Immich library

### Apple TV Display

- [ ] **DISP-01**: Immich-Viewer app installed on Apple TV and connected to Immich server
- [ ] **DISP-02**: Multiple albums/playlists configured for different content
- [ ] **DISP-03**: Setup process documented for future reference

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Organization

- **ORG-02**: Automatic categorization by mood/aesthetic
- **ORG-03**: Season-based organization (spring, summer, fall, winter)
- **ORG-04**: Time-of-day tagging (morning, golden hour, night)

### Advanced Display

- **DISP-04**: Time-based playlist scheduling
- **DISP-05**: Multi-room synchronized display

### Performance

- **IMCH-03**: Hardware transcoding enabled for video playback

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Samsung Frame direct integration | Trying Apple TV approach instead — better control |
| RAW file processing | Stick to processed images; adds complexity |
| Automatic mood detection | Manual organization first; AI categorization is v2 |
| Multi-room sync | Single display for now |
| Mobile app | Using existing Immich mobile apps |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 | TBD | Pending |
| SCAN-02 | TBD | Pending |
| SCAN-03 | TBD | Pending |
| SCAN-04 | TBD | Pending |
| ORG-01 | TBD | Pending |
| IMCH-01 | TBD | Pending |
| IMCH-02 | TBD | Pending |
| DISP-01 | TBD | Pending |
| DISP-02 | TBD | Pending |
| DISP-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after initial definition*
