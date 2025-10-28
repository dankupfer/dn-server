# Prototype Builder System

## Overview

The Prototype Builder system extends the existing Figma-to-code workflow by generating shareable web prototypes. Users can export their Figma designs as live, interactive web applications with a shareable URL, complete with an iPhone frame for presentation.

## Vision

**From Figma to Live Web in One Click**
- Designer creates screens in Figma
- Clicks 'Generate Prototype' button
- Gets a shareable URL instantly
- Anyone can view the interactive prototype in a browser
- No deployment, no setup, just works

## Architecture

### High-Level Flow

```
Figma Plugin → dn-server → Build Process → Web Bundle → Shareable URL
     ↓              ↓            ↓              ↓            ↓
  Request      Async Job    Expo Export    Static Files   UUID Link
```

### Directory Structure

```
dn-server/
├── src/
│   └── figma-api/
│       └── app-builder/
│           ├── controllers/
│           │   ├── appBuilder.controller.ts          # Existing: Live iOS dev
│           │   └── prototypeBuilder.controller.ts    # NEW: Web prototypes
│           ├── services/
│           │   ├── appBuilder.service.ts             # Existing
│           │   └── prototypeBuilder.service.ts       # NEW: Build orchestration
│           ├── routes/
│           │   ├── appBuilder.routes.ts              # Existing
│           │   └── prototypeBuilder.routes.ts        # NEW
│           └── template/                             # React Native template
│               ├── node_modules/                     # .gitignored, npm install once
│               ├── src/
│               ├── assets/
│               ├── package.json
│               └── app.json
└── public/
    └── prototypes/
        ├── mappings.json                             # UUID → path mapping
        ├── viewer.html                               # iPhone frame viewer template
        └── {file-name}/
            └── {page-name}/
                └── {app-name}/
                    ├── fullAppConfig.json            # Complete app configuration
                    ├── bundle/                       # Expo web export output
                    │   ├── _expo/
                    │   ├── assets/
                    │   └── index.html
                    └── temp/                         # Deleted after build
                        └── [copied template files]
```

## Detailed Build Process

### Step 1: Initialize Build Job

**Endpoint:** `POST /api/prototype/build`

**Request Body:**
```json
{
  "figmaFileId": "abc123",
  "figmaFileName": "MyBankApp",
  "figmaPageName": "Home",
  "appName": "everyday-banking",
  "fullAppConfig": {
    "screens": [...],
    "modules": [...],
    "theme": {...}
  }
}
```

**Response (Immediate):**
```json
{
  "jobId": "job-uuid-123",
  "status": "building",
  "estimatedTime": 60
}
```

### Step 2: Async Build Process

**Service:** `prototypeBuilder.service.ts`

```javascript
async function buildPrototype(jobId, config) {
  const buildPath = `public/prototypes/${file}/${page}/${app}`;
  const tempPath = `${buildPath}/temp`;
  
  try {
    // 1. Create directory structure
    await fs.ensureDir(tempPath);
    
    // 2. Copy template to temp
    await fs.copy('src/figma-api/app-builder/template', tempPath, {
      filter: (src) => !src.includes('.git')
    });
    
    // 3. Generate fullAppConfig.json
    await fs.writeJson(
      `${buildPath}/fullAppConfig.json`,
      config.fullAppConfig,
      { spaces: 2 }
    );
    
    // 4. Generate modules in temp
    for (const module of config.modules) {
      await generateModule(tempPath, module);
    }
    
    // 5. Run expo export:web
    await execAsync('npx expo export:web', {
      cwd: tempPath,
      env: { ...process.env }
    });
    
    // 6. Copy bundle output
    await fs.copy(
      `${tempPath}/dist`,
      `${buildPath}/bundle`
    );
    
    // 7. Generate UUID and update mappings
    const uuid = generateUUID();
    await updateMappings(uuid, {
      path: `${file}/${page}/${app}`,
      figmaFileId: config.figmaFileId,
      createdAt: new Date().toISOString()
    });
    
    // 8. Clean up temp
    await fs.remove(tempPath);
    
    // 9. Update job status
    updateJobStatus(jobId, {
      status: 'complete',
      prototypeUrl: `http://localhost:3001/prototypes/${uuid}`
    });
    
  } catch (error) {
    updateJobStatus(jobId, {
      status: 'error',
      error: error.message
    });
  }
}
```

### Step 3: Status Polling

**Endpoint:** `GET /api/prototype/status/:jobId`

**Response (Building):**
```json
{
  "jobId": "job-uuid-123",
  "status": "building",
  "progress": 65,
  "currentStep": "Bundling for web..."
}
```

**Response (Complete):**
```json
{
  "jobId": "job-uuid-123",
  "status": "complete",
  "prototypeUrl": "http://localhost:3001/prototypes/proto-uuid-456",
  "buildTime": 45
}
```

**Response (Error):**
```json
{
  "jobId": "job-uuid-123",
  "status": "error",
  "error": "Build failed: Missing dependencies"
}
```

### Step 4: Serve Prototype

**Endpoint:** `GET /prototypes/:uuid`

Returns the viewer HTML page with iPhone frame that loads the bundle.

## File Formats

### mappings.json

```json
{
  "proto-uuid-456": {
    "path": "MyBankApp/Home/everyday-banking",
    "figmaFileId": "abc123",
    "figmaPageId": "page123",
    "createdAt": "2025-01-28T12:00:00Z",
    "views": 42,
    "lastViewed": "2025-01-28T15:30:00Z"
  }
}
```

### fullAppConfig.json

```json
{
  "appName": "everyday-banking",
  "figmaFile": "MyBankApp",
  "figmaPage": "Home",
  "theme": {
    "brand": "lloyds",
    "mode": "light"
  },
  "screens": [
    {
      "id": "screen-1",
      "name": "Account Overview",
      "route": "/account-overview",
      "components": [...]
    }
  ],
  "modules": [
    {
      "id": "module-1",
      "name": "everyday",
      "type": "feature",
      "files": [...]
    }
  ]
}
```

## Web Viewer (iPhone Frame)

### viewer.html Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>Prototype Viewer</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    .device-frame {
      width: 375px;
      height: 812px;
      background: #000;
      border-radius: 40px;
      padding: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }
    
    .device-notch {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 25px;
      background: #000;
      border-radius: 0 0 20px 20px;
      z-index: 10;
    }
    
    .device-screen {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      overflow: hidden;
      background: #fff;
    }
    
    .device-screen iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .share-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .share-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    
    .share-button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="share-controls">
    <button class="share-button" onclick="copyUrl()">
      📋 Copy Link
    </button>
  </div>
  
  <div class="device-frame">
    <div class="device-notch"></div>
    <div class="device-screen">
      <iframe src="./bundle/index.html"></iframe>
    </div>
  </div>
  
  <script>
    function copyUrl() {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  </script>
</body>
</html>
```

## API Routes

### New Routes (prototypeBuilder.routes.ts)

```typescript
import express from 'express';
import * as controller from '../controllers/prototypeBuilder.controller';

const router = express.Router();

// Build endpoints
router.post('/build', controller.buildPrototype);
router.get('/status/:jobId', controller.getBuildStatus);

// Viewer endpoints
router.get('/:uuid', controller.servePrototype);
router.get('/:uuid/metadata', controller.getPrototypeMetadata);

export default router;
```

### Integration with Main Router

```typescript
// src/routes/index.ts
import prototypeRoutes from '../figma-api/app-builder/routes/prototypeBuilder.routes';

app.use('/api/prototype', prototypeRoutes);
app.use('/prototypes', express.static('public/prototypes'));
```

## Figma Plugin Integration

### UI Updates

**New Button:** "🌐 Generate Web Prototype"

**Flow:**
1. User clicks "Generate Web Prototype"
2. Plugin shows "Building prototype..." with progress
3. Plugin polls `/api/prototype/status/:jobId` every 2 seconds
4. On completion, shows success with shareable URL
5. URL stored in localStorage: `prototypeUrls[{file}/{page}/{app}]`

### Plugin Code Changes (code.ts)

```typescript
// Add to existing code.ts
async function generateWebPrototype() {
  const figmaData = {
    figmaFileId: figma.fileKey,
    figmaFileName: figma.root.name,
    figmaPageName: figma.currentPage.name,
    appName: getAppName(),
    fullAppConfig: generateFullAppConfig()
  };
  
  // Start build
  const response = await fetch('http://localhost:3001/api/prototype/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(figmaData)
  });
  
  const { jobId } = await response.json();
  
  // Poll for completion
  const result = await pollBuildStatus(jobId);
  
  // Store and display URL
  storePrototypeUrl(result.prototypeUrl);
  showSuccessMessage(result.prototypeUrl);
}

async function pollBuildStatus(jobId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `http://localhost:3001/api/prototype/status/${jobId}`
      );
      const status = await response.json();
      
      if (status.status === 'complete') {
        clearInterval(interval);
        resolve(status);
      } else if (status.status === 'error') {
        clearInterval(interval);
        reject(new Error(status.error));
      }
      
      // Update progress UI
      updateProgressUI(status);
    }, 2000);
  });
}
```

## Job Queue System

### In-Memory Job Store (Simple Start)

```typescript
// services/jobQueue.ts
interface BuildJob {
  jobId: string;
  status: 'queued' | 'building' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  result?: {
    prototypeUrl: string;
    buildTime: number;
  };
  error?: string;
  createdAt: Date;
}

const jobs = new Map<string, BuildJob>();

export function createJob(jobId: string): BuildJob {
  const job: BuildJob = {
    jobId,
    status: 'queued',
    progress: 0,
    currentStep: 'Initializing...',
    createdAt: new Date()
  };
  jobs.set(jobId, job);
  return job;
}

export function updateJob(jobId: string, updates: Partial<BuildJob>): void {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}

export function getJob(jobId: string): BuildJob | undefined {
  return jobs.get(jobId);
}
```

## Error Handling

### Common Errors

1. **Template Missing**: Template folder not found
2. **Build Failed**: Expo export command failed
3. **Disk Space**: Not enough space for temp files
4. **Timeout**: Build takes longer than 5 minutes
5. **Invalid Config**: fullAppConfig validation failed

### Error Response Format

```json
{
  "jobId": "job-123",
  "status": "error",
  "error": "Build timeout: Process exceeded 5 minutes",
  "errorCode": "BUILD_TIMEOUT",
  "canRetry": true
}
```

## Performance Considerations

### Build Time Breakdown

- Copy template: ~5s
- Generate modules: ~5s
- Expo export: ~30-40s
- Copy bundle: ~5s
- **Total: ~45-55s**

### Optimization Strategies

1. **Parallel Builds**: Multiple concurrent builds supported via unique temp folders
2. **Template Caching**: node_modules already installed, just copy
3. **Incremental Builds**: Future enhancement - detect what changed
4. **CDN for Assets**: Future enhancement - serve heavy assets from CDN

## Testing Strategy

### Unit Tests
- Job queue operations
- UUID generation and mapping
- File copying utilities
- Config validation

### Integration Tests
- Full build process (mocked expo export)
- API endpoint responses
- Error scenarios

### Manual Testing Checklist
- [ ] Generate prototype from Figma
- [ ] Verify temp folder created
- [ ] Verify temp folder deleted after build
- [ ] Check bundle files exist
- [ ] Verify UUID mapping saved
- [ ] Test prototype URL loads
- [ ] Test iPhone frame renders correctly
- [ ] Test concurrent builds (2+ at once)
- [ ] Test error scenarios

## Future Enhancements

### Phase 2: Analytics
- Track prototype views
- User interaction heatmaps
- Time spent on each screen

### Phase 3: Collaboration
- Share with specific users
- Password protection
- Comments on prototype

### Phase 4: Version History
- Keep multiple versions
- Compare versions
- Rollback capability

### Phase 5: Native App Export
- Generate IPA/APK from fullAppConfig.json
- One-click deployment to TestFlight/Play Store

### Phase 6: Custom Domains
- Allow users to use custom domains
- `prototype.mycompany.com/uuid`

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Set up directory structure
- [ ] Create prototypeBuilder.controller.ts
- [ ] Create prototypeBuilder.service.ts
- [ ] Implement job queue system
- [ ] Create basic API routes

### Week 2: Build Process
- [ ] Implement template copying
- [ ] Implement module generation in temp
- [ ] Integrate expo export:web
- [ ] Implement bundle copying
- [ ] Implement temp cleanup

### Week 3: Viewer & Sharing
- [ ] Create viewer.html template
- [ ] Implement UUID mapping system
- [ ] Create prototype serving endpoint
- [ ] Add error handling

### Week 4: Figma Plugin Integration
- [ ] Add "Generate Prototype" button
- [ ] Implement polling system
- [ ] Add progress UI
- [ ] Add URL storage and sharing

### Week 5: Testing & Polish
- [ ] Manual testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation

## Success Metrics

- ✅ Build completes in under 60 seconds
- ✅ Concurrent builds work without conflicts
- ✅ Shareable URLs work immediately
- ✅ Temp folders cleaned up 100% of time
- ✅ Error rate < 5%
- ✅ Zero impact on existing live iOS dev workflow

## Questions to Resolve

1. **node_modules in template**: Confirm size and if copy is faster than npm install
2. **Polling interval**: 2 seconds good, or should we do 1 second / 5 seconds?
3. **Job retention**: How long to keep completed jobs in memory? 1 hour? 24 hours?
4. **Concurrent limit**: Should we limit to N concurrent builds, or allow unlimited?
5. **Cleanup strategy**: What if temp cleanup fails? Retry? Alert?

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2025  
**Status**: Planning Phase