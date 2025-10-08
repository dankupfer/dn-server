# DN Server

Express server for DN project services - Figma bridge, customer generation, and AI assist with voice support.

## Features

🎨 **Figma Bridge** - Automatically create React Native modules from Figma designs  
🦁 **Customer Generation** - AI-powered synthetic customer data with Claude  
🤖 **AI Assist** - WebSocket assistant with voice and text support via Gemini 2.0 Live API  
⚡ **TypeScript** - Fully typed with comprehensive error handling  
🌐 **CORS Enabled** - Works with Figma desktop, React Native, and web apps

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- API Keys (see Environment Variables below)

### Installation

```bash
# Clone the repository
git clone https://github.com/dankupfer/dn-server.git
cd dn-server

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Add your API keys to .env (see below)

# Start development server
npm run dev
```

Server will run on `http://localhost:3001`

## Environment Variables

Create a `.env` file in the root directory:

```bash
# === API Keys ===
# Claude API key for customer data generation (optional)
# Get from: https://console.anthropic.com/
CLAUDE_API_KEY=sk-ant-your-claude-api-key-here

# Gemini API key for AI assist (voice and text)
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# === Google Cloud (Required for Gemini Live API) ===
# Your GCP project ID
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# GCP region (e.g., us-central1, europe-west2)
GOOGLE_CLOUD_LOCATION=us-central1

# === Server Configuration ===
PORT=3001
NODE_ENV=development
```

### Getting API Keys

**Claude API Key:**
1. Go to https://console.anthropic.com/
2. Sign up/Login
3. Generate API key
4. Add to `.env` as `CLAUDE_API_KEY`

**Gemini API Key (for development):**
1. Go to https://aistudio.google.com/apikey
2. Click 'Get API key'
3. Copy the key
4. Add to `.env` as `GEMINI_API_KEY`

**Google Cloud (for Gemini Live API):**
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable Vertex AI API
4. Enable Cloud Text-to-Speech API
5. Set up authentication: `gcloud config set project YOUR_PROJECT_ID`
6. Set quota project: `gcloud auth application-default set-quota-project YOUR_PROJECT_ID`
7. Add project ID and location to `.env`

## API Endpoints

### Health Check
**GET** `/api/health`

Returns server status and available services.

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "DN Server is running",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "figma": true,
    "customers": true,
    "assist": true
  }
}
```

### Figma Bridge

**POST** `/api/create-module`

Creates React Native modules from Figma plugin data.

**Request Body:**
```json
{
  "moduleName": "SaveInvestRedesign",
  "moduleId": "save-invest-redesign",
  "targetSection": "save-invest",
  "screenData": {
    "scrollable": true,
    "components": [
      {
        "type": "SectionHeader",
        "props": { "id": "header-1", "title": "Save & Invest" }
      },
      {
        "type": "AccountCard",
        "props": {
          "id": "account-1",
          "title": "Investment Account",
          "balance": 2500.00,
          "variant": "condensed"
        }
      }
    ]
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Module 'SaveInvestRedesign' created successfully",
  "files": [
    "/path/to/modules/feature/save-invest-redesign/index.tsx",
    "/path/to/modules/feature/save-invest-redesign/screenData.json"
  ],
  "moduleId": "save-invest-redesign",
  "moduleName": "SaveInvestRedesign"
}
```

### Customer Generation

**POST** `/api/create-customer`

Generate AI-powered synthetic customer data for testing.

**Request Body:**
```json
{
  "customerName": "John Smith",
  "frescoSegment": "C1",
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31",
  "age": 35,
  "gender": "male",
  "profession": "Software Engineer"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "AI-enhanced customer 'John Smith' created with 3 accounts and 420 transactions",
  "customerId": "cust_1234567890_abc123",
  "filePath": "/path/to/data/customers/cust_1234567890_abc123.json"
}
```

**GET** `/api/customers`

Get list of all generated customers.

**GET** `/api/customers/:id/full`

Get full customer data including accounts and transactions.

### AI Assist Chat

**POST** `/api/assist/chat`

Chat with AI assistant (Gemini, Claude, or Mock mode).

**Request Body:**
```json
{
  "message": "What's my account balance?",
  "aiProvider": "gemini"
}
```

**Options for `aiProvider`:**
- `gemini` - Use Google Gemini API
- `claude` - Use Anthropic Claude API
- `mock` or omit - Use mock responses (no API calls)

**Response:**
```json
{
  "response": "Your current account balance is £1,234.56",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### AI Assist (WebSocket)

**WS** `/api/assist`

Real-time voice and text interaction via Gemini 2.0 Live API with Vertex AI.

**Features:**
- 🎤 Push-to-talk interface (hold to record, release to send)
- 📝 Real-time speech-to-text transcription
- 🤖 Conversational AI responses from Gemini with full conversation memory
- 🔊 Google Cloud Text-to-Speech with toggleable UI control
- 💬 Separate user and assistant transcript display
- 🧠 Automatic conversation context retention across messages
- 🎭 Mock mode for demos without Gemini API access

**Test Page:**
Open `http://localhost:3001/assist-test.html` in your browser for an interactive test interface with TTS toggle control.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3001/api/assist');
```

**Message Format:**

**Start Session:**
```json
{
  "action": "start_session",
  "sessionId": "unique-session-id",
  "enableTTS": true,
  "useMockMode": false
}
```
Note: `enableTTS` is optional (default: false)  
Note: `useMockMode` is optional (default: false) - Use mock responses instead of Gemini for demos

**Send Audio Chunk:**
```json
{
  "action": "audio_chunk",
  "sessionId": "unique-session-id",
  "audioData": "base64-encoded-webm-audio",
  "sampleRate": 16000
}
```

**End Session:**
```json
{
  "action": "end_session",
  "sessionId": "unique-session-id"
}
```

**Server Responses:**

User transcript (immediate):
```json
{
  "action": "user_transcript",
  "sessionId": "unique-session-id",
  "transcript": "What the user said"
}
```

Assistant response:
```json
{
  "action": "transcript",
  "sessionId": "unique-session-id",
  "transcript": "Assistant's text response"
}
```

Audio response (if TTS enabled):
```json
{
  "action": "audio_response",
  "sessionId": "unique-session-id",
  "audioData": "base64-encoded-audio-response"
}
```

Error:
```json
{
  "action": "error",
  "sessionId": "unique-session-id",
  "error": "Error message"
}
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development mode with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Build and run production server |
| `npm run type-check` | Check TypeScript types without building |

## Project Structure

```
dn-server/
├── src/
│   ├── routes/
│   │   ├── health.ts           # Health check endpoint
│   │   ├── figma/              # Figma bridge routes
│   │   ├── customers/          # Customer generation routes
│   │   └── assist/             # AI assist WebSocket routes
│   ├── services/
│   │   ├── ai/                 # AI service integrations
│   │   │   └── customerGenerator.ts
│   │   ├── gemini/             # Gemini Live API service
│   │   │   └── liveApi.ts      # Voice-to-text and response
│   │   └── mockAssistant.ts    # Mock responses for demos
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── index.ts                # Main Express app
├── public/
│   └── assist-test.html        # Interactive assist test page
├── data/
│   └── customers/              # Generated customer JSON files
├── .env.example                # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

### Testing AI Assist

**Using the Interactive Test Page:**

1. Start the server: `npm run dev`
2. Open `http://localhost:3001/assist-test.html` in your browser
3. **Toggle TTS** on/off (enabled by default) if you want voice responses
4. Click "Connect" to start a WebSocket session
5. Hold down "Hold to Talk" button and speak
6. Release button to send audio
7. Watch transcripts appear in real-time:
   - Blue box: Your speech (transcribed)
   - Pink box: Assistant's response
8. Continue the conversation - Gemini remembers all previous messages!

**Features:**
- Push-to-talk: Hold button to record, release to send
- Real-time transcription of user speech
- Conversational AI responses with memory (Gemini remembers the conversation)
- TTS toggle: Enable/disable voice responses on-the-fly
- Visual feedback for connection/recording status
- Separate display for user vs assistant messages

**Configuration:**

Text-to-speech can be toggled in the UI test page, or configured programmatically when starting a session. The conversation history is maintained automatically per WebSocket connection.

Example with TTS enabled:
```json
{
  "action": "start_session",
  "sessionId": "session_123",
  "enableTTS": true
}
```

Example with mock mode (no Gemini):
```json
{
  "action": "start_session",
  "sessionId": "session_123",
  "enableTTS": false,
  "useMockMode": true
}
```

### Testing WebSocket Connection Programmatically

Create a test file to verify assist WebSocket:

```javascript
// test-assist-ws.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/api/assist');

ws.on('open', () => {
  console.log('Connected to assist WebSocket');
  ws.send(JSON.stringify({
    action: 'start_session',
    sessionId: 'test-session-123',
    enableTTS: false
  }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});
```

Run with: `node test-assist-ws.js`

## Configuration

### Port
Default port is `3001`. Change in `.env`:
```bash
PORT=3001
```

### CORS
Configured to allow all origins for development. Adjust in `src/index.ts` for production:
```typescript
app.use(cors({
  origin: '*', // Change for production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### AI Assist TTS
Text-to-speech can be toggled per session via the `enableTTS` parameter when starting a session. The interactive test page includes a UI toggle for easy testing.

### File Paths
Default paths for Figma bridge assume `dn-server` and `dn-starter` are siblings:
```
workspace/
├── dn-server/
└── dn-starter/
```

Adjust paths in `src/routes/figma/index.ts` if your structure differs.

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :3001

# Kill existing process
kill -9 <PID>

# Restart server
npm run dev
```

### API Key Issues

```bash
# Verify environment variables loaded
npm run dev
# Check console output for 'Environment variables loaded'

# Ensure .env file exists and has correct format
cat .env
```

### WebSocket Connection Fails

1. Verify server is running: `http://localhost:3001/api/health`
2. Check WebSocket URL uses `ws://` not `http://`
3. Ensure no firewall blocking WebSocket connections
4. Check server console for connection logs

### AI Assist Issues

**Microphone not working:**
- Grant browser microphone permissions
- Check browser console for errors
- Try HTTPS if on remote server (getUserMedia requires secure context)

**Transcription errors:**
- Verify `GOOGLE_CLOUD_PROJECT` is set correctly
- Check Vertex AI API is enabled in Google Cloud Console
- Ensure proper authentication: `gcloud config set project YOUR_PROJECT_ID`
- Run: `gcloud auth application-default set-quota-project YOUR_PROJECT_ID`

**Wrong GCP project being used:**
- Check: `gcloud config get-value project`
- Set correct project: `gcloud config set project YOUR_PROJECT_ID`
- Update quota project: `gcloud auth application-default set-quota-project YOUR_PROJECT_ID`

**No response from Gemini:**
- Check server logs for API errors
- Verify `GOOGLE_CLOUD_LOCATION` matches your project
- Test with AI Assist endpoint first to verify Gemini connectivity

**TTS not working:**
- Verify Cloud Text-to-Speech API is enabled
- Check project ID matches in gcloud and .env
- Restart server after changing .env

**Conversation context not working:**
- Each WebSocket connection maintains its own conversation history
- Disconnect and reconnect to start a fresh conversation
- Check server logs for conversation history size

**Demo without Gemini access:**
- Enable mock mode by setting `useMockMode: true` in start_session message
- Mock mode returns 4 random canned responses with 1-2 second simulated delay
- Perfect for demos behind corporate proxies or without API keys
- Audio is received but not transcribed (displays placeholder text)
- Mock responses include: 'That's interesting, tell me more about it', 'I see, can you elaborate on that?', etc.

### TypeScript Errors

```bash
# Check types without building
npm run type-check

# Clean build
rm -rf dist/
npm run build
```

## Related Projects

- **[DN Figma](https://github.com/dankupfer/dn-figma)** - Figma plugin for design-to-code
- **[DN Starter](https://github.com/dankupfer/dn-starter)** - React Native app templates
- **[DN Components](https://github.com/dankupfer/dn-components)** - Component library
- **[DN Tokens](https://github.com/dankupfer/dn-tokens)** - Design tokens

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dankupfer/dn-server/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/dankupfer/dn-server/discussions)
- 📚 **Documentation**: [DN Ecosystem Docs](https://github.com/dankupfer/dn-starter)

---

**Note**: This server is part of the DN ecosystem and designed to work seamlessly with DN Starter, DN Figma plugin, and DN Components library.