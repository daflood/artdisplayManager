# Roadmap: Art Display Manager

## Overview

Transform a scattered art collection across multiple drives into a curated display system. Phase 1 builds a scanner to find and filter 16:9 content. Phase 2 establishes the Immich infrastructure and imports the filtered media. Phase 3 configures the Apple TV display and creates albums for different moods.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Media Scanner** - Find and filter 16:9 art across drives
- [ ] **Phase 2: Import Pipeline** - Deploy Immich and load filtered media
- [ ] **Phase 3: Display Setup** - Configure Apple TV and create albums

## Phase Details

### Phase 1: Media Scanner
**Goal**: Scanner identifies all 16:9 art across source drives and outputs filtered list
**Depends on**: Nothing (first phase)
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04
**Success Criteria** (what must be TRUE):
  1. Scanner can scan specified directories across multiple drives for images and videos
  2. Only 16:9 aspect ratio content appears in output
  3. Output includes file path, dimensions, and size for each match
  4. Duplicate files are detected and flagged in output
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Project foundation + TypeScript types
- [x] 01-02-PLAN.md — Image & video readers with rotation handling
- [x] 01-03-PLAN.md — Aspect ratio filter + duplicate detection
- [x] 01-04-PLAN.md — Scanner orchestration + output formatters
- [x] 01-05-PLAN.md — CLI integration + end-to-end verification

### Phase 2: Import Pipeline
**Goal**: Immich runs on NAS with all filtered media imported and organized
**Depends on**: Phase 1
**Requirements**: ORG-01, IMCH-01, IMCH-02
**Success Criteria** (what must be TRUE):
  1. Filtered files are copied from source drives to NAS in organized structure
  2. Immich is deployed via Docker compose and accessible from network
  3. All filtered media appears in Immich library with correct metadata
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: Display Setup
**Goal**: Apple TV displays curated art slideshows from Immich
**Depends on**: Phase 2
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. Immich-Viewer app is installed on Apple TV and connected to Immich server
  2. Multiple albums exist for different content categories (abstract, photography, ambient video, etc.)
  3. Setup process is documented for future reference or troubleshooting
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Media Scanner | 5/5 | Complete | 2026-02-02 |
| 2. Import Pipeline | 0/TBD | Not started | - |
| 3. Display Setup | 0/TBD | Not started | - |
