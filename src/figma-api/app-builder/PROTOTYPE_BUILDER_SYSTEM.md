Perfect! Let's update the README to document the Prototype Builder system we just built.

I'll add a new section after the existing content. Here's what to add:

```markdown

## Prototype Builder System

### Overview

The Prototype Builder extends the App Builder to create shareable web prototypes with unique URLs. It takes a `fullAppConfig.json` and automatically:

1. Generates a complete React Native app
2. Bundles it for web using Expo
3. Creates an iPhone-framed viewer
4. Generates a shareable UUID link
5. Tracks views and analytics

### Architecture

**Async Job Queue**
- Non-blocking build process (builds take 30-40 seconds)
- Progress tracking with percentage and status messages
- Job status polling endpoint
- Error handling with retry capability

**File Structure**
```
public/prototypes/
├── {figma-file}/{page}/{app}/
│   ├── bundle/              # Expo web build output
│   │   ├── _expo/static/    # JS bundles (relative paths)
│   │   ├── assets/          # Images, fonts, etc.
│   │   └── index.html       # App entry point
│   ├── fullAppConfig.json   # Original configuration
│   └── index.html           # iPhone viewer frame
└── mappings.json            # UUID → path mappings
```

**Routing System**
- `/api/figma/app-builder/prototype/build` - Start async build
- `/api/figma/app-builder/prototype/status/:jobId` - Poll build status
- `/prototypes/:uuid` - Serve viewer with iPhone frame
- `/prototypes/:uuid/bundle/*` - Serve bundle assets

### API Usage

#### 1. Start Build

```http
POST /api/figma/app-builder/prototype/build
Content-Type: application/json

{
  "figmaFileId": "test-file-123",
  "figmaFileName": "TestBankApp",
  "figmaPageName": "HomePage",
  "appName": "test-prototype",
  "fullAppConfig": {
    "appName": "test-prototype",
    "version": "1.0.0",
    "appFrame": { ... },
    "components": [ ... ]
  }
}
```

**Response:**
```json
{
  "jobId": "job-a1b2c3d4",
  "status": "building",
  "estimatedTime": 60,
  "message": "Build started. Poll /api/prototype/status/{jobId} for progress."
}
```

#### 2. Check Status

```http
GET /api/figma/app-builder/prototype/status/job-a1b2c3d4
```

**Response (Building):**
```json
{
  "jobId": "job-a1b2c3d4",
  "status": "building",
  "progress": 50,
  "currentStep": "Bundling for web (this may take 30-40s)...",
  "createdAt": "2025-10-28T20:00:00.000Z",
  "startedAt": "2025-10-28T20:00:01.000Z"
}
```

**Response (Complete):**
```json
{
  "jobId": "job-a1b2c3d4",
  "status": "complete",
  "progress": 100,
  "currentStep": "Complete",
  "result": {
    "prototypeUrl": "http://localhost:3001/prototypes/proto-87c49fcf-0da0-4200-b905-16a4ac511b7a",
    "buildTime": 37
  },
  "createdAt": "2025-10-28T20:00:00.000Z",
  "startedAt": "2025-10-28T20:00:01.000Z",
  "completedAt": "2025-10-28T20:00:38.000Z"
}
```

#### 3. View Prototype

Simply open the URL in a browser:
```
http://localhost:3001/prototypes/proto-87c49fcf-0da0-4200-b905-16a4ac511b7a
```

Features:
- iPhone 14 Pro Max frame
- Realistic device mockup
- Copy link button
- Fullscreen mode
- View counter
- Shareable URL

### Build Process

**Phase 1: Setup (10%)**
- Create directory structure
- Save fullAppConfig.json

**Phase 2: App Generation (20-45%)**
- Use appBuilder.controller to generate React Native app
- Create modules, routers, components

**Phase 3: Bundling (50-80%)**
- Copy node_modules for Expo
- Run `npx expo export --platform web`
- Generate optimized production bundle
- Configure relative paths for subdirectory serving

**Phase 4: Finalization (85-100%)**
- Copy bundle to final location
- Generate viewer HTML with iPhone frame
- Create UUID mapping
- Clean up temporary files

### Viewer Features

**iPhone Frame**
- Accurate iPhone 14 Pro Max dimensions (375x812px)
- Device notch
- Black bezels with rounded corners
- Gradient background

**Controls**
- 📋 Copy Link - Copies prototype URL to clipboard
- 🔍 Fullscreen - Expands to fullscreen (keeps phone frame)
- Toast notifications

**Analytics**
- View counter per prototype
- Last viewed timestamp
- Creation date tracking

### Technical Details

**Expo Configuration**
```json
{
  "expo": {
    "experiments": {
      "baseUrl": "./"
    }
  }
}
```
This ensures bundle assets use relative paths for subdirectory serving.

**Bundle File Serving**
Custom Express route resolves UUID to file path:
```
/prototypes/proto-abc123/bundle/index.html
    ↓ (lookup UUID in mappings.json)
/prototypes/testbankapp/homepage/test-prototype/bundle/index.html
```

**Job Queue System**
- In-memory storage (resets on server restart)
- Status: pending → building → complete/error
- Progress tracking: 0-100%
- Step descriptions for user feedback

### Testing

Run the test script:
```bash
node test-prototype-build.js
```

This will:
1. Start a prototype build
2. Poll for status every 5 seconds
3. Display progress updates
4. Show final prototype URL

### Error Handling

**Build Failures**
- Missing node_modules → Error with installation instructions
- Expo export failure → Logs stderr, returns build error
- Invalid fullAppConfig → Validation error with details

**File System Errors**
- Directory creation failures
- File copy errors
- Permissions issues

**Not Found**
- Invalid UUID returns styled 404 page
- Missing bundle files return 404

### Future Enhancements

- [ ] Persistent job queue (database storage)
- [ ] Build caching (skip rebuild if config unchanged)
- [ ] Multiple device frames (iPhone, Android, iPad)
- [ ] Password protection for prototypes
- [ ] Expiration dates for shareable links
- [ ] Analytics dashboard
- [ ] QR code generation for easy mobile testing
- [ ] Version history and rollback

---
