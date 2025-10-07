// src/routes/voice/index.ts
import { Router } from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { VoiceSessionMessage, VoiceResponseMessage } from '../../types';
import { GeminiLiveService } from '../../services/gemini/liveApi';

// This will be set up in the main index.ts
export function setupVoiceRoutes(app: expressWs.Application) {
  const router = expressWs(Router() as any).app;

  // WebSocket endpoint for voice streaming
  router.ws('/voice', async (ws: WebSocket, req) => {
    console.log('🎙️  New voice WebSocket connection');

    let sessionId: string | null = null;
    let geminiService: GeminiLiveService | null = null;

    ws.on('message', async (data: string) => {
      try {
        const message: VoiceSessionMessage = JSON.parse(data);
        console.log(`📨 Received message: ${message.action}`);

        switch (message.action) {
          case 'start_session':
            sessionId = message.sessionId;
            console.log(`✅ Session started: ${sessionId}`);

            // Initialize Gemini Live service
            try {
              geminiService = new GeminiLiveService({
                systemInstruction: 'You are a helpful banking voice assistant. Keep responses concise and conversational.'
              });
              
              // TODO: Connect to Gemini Live API
              // await geminiService.connect();
              
              // Send confirmation back to client
              const response: VoiceResponseMessage = {
                action: 'transcript',
                sessionId,
                transcript: 'Session started successfully'
              };
              ws.send(JSON.stringify(response));
              
            } catch (error) {
              console.error('❌ Error starting Gemini session:', error);
              const errorResponse: VoiceResponseMessage = {
                action: 'error',
                sessionId,
                error: 'Failed to start Gemini session'
              };
              ws.send(JSON.stringify(errorResponse));
            }
            break;

          case 'audio_chunk':
            if (!sessionId || !geminiService) {
              console.error('❌ No active session');
              return;
            }

            console.log(`🎤 Received audio chunk for session: ${sessionId}`);
            
            // TODO: Send audio to Gemini Live API
            // const audioChunk = {
            //   data: message.audioData!,
            //   mimeType: 'audio/pcm;rate=16000'
            // };
            // await geminiService.sendAudio(audioChunk);
            
            // For now, send a mock response
            const mockResponse: VoiceResponseMessage = {
              action: 'transcript',
              sessionId,
              transcript: '[Mock transcript: audio received]'
            };
            ws.send(JSON.stringify(mockResponse));
            break;

          case 'end_session':
            console.log(`🛑 Ending session: ${sessionId}`);
            
            if (geminiService) {
              await geminiService.disconnect();
              geminiService = null;
            }
            
            sessionId = null;
            break;

          default:
            console.warn(`⚠️  Unknown action: ${message.action}`);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error);
        const errorResponse: VoiceResponseMessage = {
          action: 'error',
          sessionId: sessionId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        ws.send(JSON.stringify(errorResponse));
      }
    });

    ws.on('close', () => {
      console.log('🔌 Voice WebSocket connection closed');
      if (geminiService) {
        geminiService.disconnect();
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  return router;
}