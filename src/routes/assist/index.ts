// src/routes/assist/index.ts
import { Router } from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { WebSocketIncomingMessage, VoiceResponseMessage } from '../../types';
import { GeminiLiveService } from '../../services/gemini/liveApi';
import { MockAssistantService } from '../../services/mockAssistant';

// This will be set up in the main index.ts
export function setupAssistRoutes(app: expressWs.Application) {
  const router = expressWs(Router() as any).app;

  router.ws('/assist', async (ws: WebSocket, req) => {
    console.log('🎙️  New assist WebSocket connection');

    let sessionId: string | null = null;
    let geminiService: GeminiLiveService | null = null;
    let mockService: MockAssistantService | null = null; // NEW
    let useMockMode: boolean = false; // NEW
    let conversationHistory: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = [];

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data) as any; // Use 'any' for flexibility in the switch
        console.log(`📨 Received message: ${message.action}`);

        switch (message.action) {
          case 'start_session':
            // TypeScript knows this is VoiceSessionMessage here
            sessionId = message.sessionId;
            useMockMode = message.useMockMode ?? false; // NEW
            console.log(`✅ Session started: ${sessionId} ${useMockMode ? '(MOCK MODE)' : ''}`);

            if (!sessionId) {
              console.error('❌ No active session for text message');
              return;
            }

            try {
              const enableTTS = message.enableTTS ?? false;

              if (useMockMode) {
                // Use mock service
                mockService = new MockAssistantService(enableTTS);
                console.log(`🎭 Mock mode enabled, TTS ${enableTTS ? 'enabled' : 'disabled'}`);
              } else {
                // Use real Gemini service
                geminiService = new GeminiLiveService({
                  systemInstruction: 'You are a helpful banking voice assistant. Keep responses concise and conversational.',
                  enableTTS: enableTTS
                });
                console.log(`🔊 TTS ${enableTTS ? 'enabled' : 'disabled'} for this session`);
                await geminiService.connect();
              }

              // Send confirmation back to client
              const response: VoiceResponseMessage = {
                action: 'transcript',
                sessionId,
                transcript: 'Session started successfully'
              };
              ws.send(JSON.stringify(response));

            } catch (error) {
              console.error('❌ Error processing message:', error);
              
              const errorResponse: VoiceResponseMessage = {
                action: 'error',
                sessionId: sessionId,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
              ws.send(JSON.stringify(errorResponse));
            }
            break;

          case 'audio_chunk':
            if (!sessionId || (!geminiService && !mockService)) {
              console.error('❌ No active session');
              return;
            }

            console.log(`🎤 Received audio chunk for session: ${sessionId}`);

            if (useMockMode && mockService) {
              // MOCK MODE: Simulate processing
              console.log('🎭 Processing in mock mode...');

              // Send a fake user transcript
              const mockUserTranscript = "User said something (mock mode - audio not transcribed)";
              const userTranscriptResponse: VoiceResponseMessage = {
                action: 'user_transcript',
                sessionId,
                transcript: mockUserTranscript
              };
              ws.send(JSON.stringify(userTranscriptResponse));

              // Get mock response with simulated delay
              const mockResult = await mockService.processAudio(message.audioData!);

              // Send mock assistant response
              const mockTranscriptResponse: VoiceResponseMessage = {
                action: 'transcript',
                sessionId,
                transcript: mockResult.transcript
              };
              ws.send(JSON.stringify(mockTranscriptResponse));

              // Send mock audio if TTS enabled (currently empty)
              if (mockResult.audioResponse) {
                const audioResponseMessage: VoiceResponseMessage = {
                  action: 'audio_response',
                  sessionId,
                  audioData: mockResult.audioResponse
                };
                ws.send(JSON.stringify(audioResponseMessage));
              }

            } else if (geminiService) {
              // REAL MODE: Use Gemini
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
            }
            break;

          case 'text_message':
            if (!sessionId) {
              console.error('❌ No active session');
              return;
            }

            console.log(`💬 Received text message for session: ${sessionId}`);

            if (useMockMode && mockService) {
              // MOCK MODE: Return mock text response
              console.log('🎭 Processing text in mock mode...');

              // Simulate processing delay
              await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

              // Get mock response
              const mockResult = await mockService.processAudio(''); // Pass empty string for text mode

              // Send mock response
              const mockTextResponse: any = {
                action: 'text_response',
                sessionId,
                text: mockResult.transcript,
              };
              ws.send(JSON.stringify(mockTextResponse));

            } else if (geminiService) {
              // REAL MODE: Use Gemini for text
              try {
                // Add user message to conversation history
                conversationHistory.push({
                  role: 'user',
                  parts: [{ text: message.text! }]
                });

                // Get Gemini's response with conversation context
                const geminiResponse = await geminiService.sendAudio(conversationHistory);

                // Add assistant response to conversation history
                conversationHistory.push({
                  role: 'model',
                  parts: [{ text: geminiResponse }]
                });

                // Send text response
                const textResponse: any = {
                  action: 'text_response',
                  sessionId,
                  text: geminiResponse,
                };
                ws.send(JSON.stringify(textResponse));

              } catch (error) {
                console.error('❌ Error processing text message:', error);
                const errorResponse: any = {
                  action: 'error',
                  sessionId,
                  error: 'Failed to process text message',
                };
                ws.send(JSON.stringify(errorResponse));
              }
            }
            break;

          case 'end_session':
            console.log(`🛑 Ending session: ${sessionId}`);

            if (geminiService) {
              await geminiService.disconnect();
              geminiService = null;
            }

            if (mockService) {
              mockService = null;
            }

            sessionId = null;
            useMockMode = false;
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
      if (mockService) {
        mockService = null;
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  // Return a regular router for potential REST endpoints
  return router;
}