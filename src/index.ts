// src/index.ts
import 'dotenv/config';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import healthRoutes from './routes/health';
import figmaRoutes from './routes/figma';
import customersRoutes from './routes/customers';
import { setupAssistRoutes } from './routes/assist';

// Log environment setup
console.log('🔐 Environment variables loaded:');
console.log('- CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Present' : 'Missing');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('- GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT || 'Not set');
console.log('- GOOGLE_CLOUD_LOCATION:', process.env.GOOGLE_CLOUD_LOCATION || 'Not set');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable WebSocket support
const wsInstance = expressWs(app);

// Enable CORS for Figma plugin and React Native apps
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies (with larger limit for audio data)
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Register HTTP routes
app.use('/api', healthRoutes);
app.use('/api/figma', figmaRoutes);
app.use('/api', customersRoutes);

// Register Assist routes (includes both REST and WebSocket)
const assistRouter = setupAssistRoutes(wsInstance.app);
app.use('/api', assistRouter);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 DN Server running on http://localhost:${PORT}`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   ❤️  Health:    http://localhost:${PORT}/api/health`);
  console.log(`   🎨 Figma:     http://localhost:${PORT}/api/create-module`);
  console.log(`   🦁 Customers: http://localhost:${PORT}/api/create-customer`);
  console.log(`   🤖 Assist:    http://localhost:${PORT}/api/assist/chat`);
  console.log(`   🎙️  Voice:     ws://localhost:${PORT}/api/assist`);
  console.log('');
});