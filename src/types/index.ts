// src/types/index.ts

// ============================================
// Figma Types
// ============================================

export interface CreateModuleRequest {
  moduleName: string;
  moduleId: string;
  screenData: ScreenBuilderConfig;
  folderPath?: string;
  targetSection?: string;
  routerName?: string;
}

export interface CreateModuleSuccessResponse {
  success: true;
  message: string;
  files: string[];
  moduleId: string;
  moduleName: string;
}

export interface CreateModuleErrorResponse {
  success: false;
  error: string;
}

export type CreateModuleResponse = CreateModuleSuccessResponse | CreateModuleErrorResponse;

export interface ScreenBuilderConfig {
  scrollable: boolean;
  style?: Record<string, any>;
  components: ScreenBuilderComponent[];
}

export interface ScreenBuilderComponent {
  type: ComponentType;
  props: Record<string, any>;
  style?: Record<string, any>;
}

export type ComponentType =
  | 'AccountCard'
  | 'CreditCard'
  | 'SectionHeader'
  | 'ServiceCard'
  | 'ServiceGrid'
  | 'PromotionalCard';

// ============================================
// Customer Types
// ============================================

export interface CreateCustomerRequest {
  customerName: string;
  frescoSegment: 'A' | 'B' | 'C1' | 'C2' | 'D' | 'E';
  fromDate: string;
  toDate: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  profession: string;
}

export interface CustomerResponse {
  success: boolean;
  message?: string;
  error?: string;
  customerId?: string;
  filePath?: string;
}

export interface CustomerProfile {
  customerName: string;
  age: number;
  gender: string;
  profession: string;
  frescoSegment: string;
  fromDate: string;
  toDate: string;
}

// ============================================
// Assist/Chat Types
// ============================================

export interface AssistChatRequest {
  message: string;
  aiProvider?: 'gemini' | 'claude' | 'mock';
}

export interface AssistChatResponse {
  response: string;
  timestamp: string;
  fallbackSuggested?: boolean;
}

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
  mimeType?: string;
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
// Health Check Types
// ============================================
export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  services: {
    figma: boolean;
    customers: boolean;
    assist: boolean;
    voice: boolean;
  };
}

// ============================================
// Combined WebSocket Message Types
// ============================================

export type WebSocketIncomingMessage = VoiceSessionMessage | TextChatMessage;
export type WebSocketOutgoingMessage = VoiceResponseMessage | TextChatResponse;