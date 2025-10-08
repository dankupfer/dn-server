// ============================================
// Voice/Gemini Live Types
// ============================================

export interface VoiceSessionMessage {
  action: 'start_session' | 'audio_chunk' | 'end_session';
  sessionId: string;
  audioData?: string; // base64 encoded PCM audio
  sampleRate?: number;
  enableTTS?: boolean;
  useMockMode?: boolean;
}

export interface VoiceResponseMessage {
  action: 'transcript' | 'user_transcript' | 'audio_response' | 'error';
  sessionId: string;
  audioData?: string; // base64 encoded audio response
  transcript?: string;
  error?: string;
}

// ============================================
// Text Chat Types
// ============================================

export interface TextChatMessage {
  action: 'text_message';
  sessionId: string;
  text: string;
}

export interface TextChatResponse {
  action: 'text_response' | 'error';
  sessionId: string;
  text?: string;
  error?: string;
}

// ============================================
// Combined WebSocket Message Types
// ============================================

export type WebSocketIncomingMessage = VoiceSessionMessage | TextChatMessage;
export type WebSocketOutgoingMessage = VoiceResponseMessage | TextChatResponse;