// src/routes/assist/index.ts
import { Router } from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { VoiceSessionMessage, VoiceResponseMessage } from '../../types';
import { GeminiLiveService } from '../../services/gemini/liveApi';

// This will be set up in the main index.ts
export function setupAssistRoutes(app: expressWs.Application) {
  const router = expressWs(Router() as any).app;

  router.ws('/assist', async (ws: WebSocket, req) => {
    console.log('🎙️  New assist WebSocket connection');

    let sessionId: string | null = null;
    let geminiService: GeminiLiveService | null = null;
    let conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = [];

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
              const enableTTS = message.enableTTS ?? false;

              geminiService = new GeminiLiveService({
                systemInstruction: 'You are a helpful banking voice assistant. Keep responses concise and conversational.',
                enableTTS: enableTTS
              });

              console.log(`🔊 TTS ${enableTTS ? 'enabled' : 'disabled'} for this session`);

              await geminiService.connect();

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

            // Prepare audio chunk
            const audioChunk = {
              data: message.audioData!,
              mimeType: `audio/pcm;rate=${message.sampleRate || 16000}`
            };

            // 1. Transcribe user speech immediately
            const userTranscript = await geminiService.transcribeAudio(audioChunk);

            // Send user transcript right away
            const userTranscriptResponse: VoiceResponseMessage = {
              action: 'user_transcript',
              sessionId,
              transcript: userTranscript
            };
            ws.send(JSON.stringify(userTranscriptResponse));

            // 2. Add user message to conversation history
            conversationHistory.push({
              role: 'user',
              parts: [{ text: userTranscript }]
            });

            // 3. Get Gemini's response with full conversation context
            const geminiResponse = await geminiService.sendAudio(conversationHistory);

            // 4. Add assistant response to conversation history
            conversationHistory.push({
              role: 'model',
              parts: [{ text: geminiResponse }]
            });

            // Send Gemini's transcript
            const geminiTranscriptResponse: VoiceResponseMessage = {
              action: 'transcript',
              sessionId,
              transcript: geminiResponse
            };
            ws.send(JSON.stringify(geminiTranscriptResponse));

            // 5. Only generate audio if TTS is enabled
            if (geminiService['enableTTS']) {
              const audioResponse = await geminiService.generateAudioResponse(geminiResponse);

              const audioResponseMessage: VoiceResponseMessage = {
                action: 'audio_response',
                sessionId,
                audioData: audioResponse
              };
              ws.send(JSON.stringify(audioResponseMessage));
            }
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
      console.log('🔌 Assist WebSocket connection closed');
      if (geminiService) {
        geminiService.disconnect();
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  // Return a regular router for potential REST endpoints
  return router;
}