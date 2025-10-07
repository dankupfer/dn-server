// src/services/gemini/liveApi.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';

export interface GeminiLiveConfig {
  model?: string;
  systemInstruction?: string;
  enableTTS?: boolean;
}

export interface AudioChunk {
  data: string; // base64 encoded PCM audio
  mimeType: string; // e.g., "audio/pcm;rate=16000"
}

export class GeminiLiveService {
  private genAI: VertexAI;
  private activeModel: any = null;
  private model: string;
  private systemInstruction: string;
  private enableTTS: boolean;

  constructor(config: GeminiLiveConfig = {}) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.enableTTS = config.enableTTS ?? false;

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT not configured');
    }

    this.genAI = new VertexAI({
      project: projectId,
      location: location,
    });

    this.model = config.model || 'gemini-2.0-flash-exp';
    this.systemInstruction = config.systemInstruction || 'You are a helpful voice assistant.';
  }

  async connect() {
    console.log('🔌 Connecting to Gemini Live API...');
    console.log(`📱 Model: ${this.model}`);
    console.log(`📝 System instruction: ${this.systemInstruction}`);

    try {
      // Get the generative model with multimodal capabilities
      const generativeModel = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: this.systemInstruction,
      });

      console.log('✅ Connected to Gemini Live API');
      this.activeModel = generativeModel;
      console.log('✅ Model stored and ready for streaming');
      return generativeModel;
    } catch (error) {
      console.error('❌ Failed to connect to Gemini Live API:', error);
      throw error;
    }
  }

  async sendAudio(transcript: string): Promise<string> {
    if (!this.activeModel) {
      throw new Error('Not connected. Call connect() first.');
    }

    console.log('🤖 Getting Gemini response to:', transcript);

    try {
      const result = await this.activeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: transcript,
              },
            ],
          },
        ],
      });

      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      console.log('✅ Gemini response:', text);
      return text;
    } catch (error) {
      console.error('❌ Error getting Gemini response:', error);
      throw error;
    }
  }

  async transcribeAudio(audioChunk: AudioChunk): Promise<string> {
    if (!this.activeModel) {
      throw new Error('Not connected. Call connect() first.');
    }

    console.log('🎤 Transcribing user audio...');

    try {
      const result = await this.activeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: audioChunk.mimeType,
                  data: audioChunk.data,
                },
              },
              {
                text: 'What did the person say? Return ONLY their exact words, nothing else. Do not respond or comment.',
              },
            ],
          },
        ],
      });

      const response = result.response;
      const transcript = response.candidates[0].content.parts[0].text;

      console.log('✅ User transcript:', transcript);
      return transcript;
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    }
  }

  async generateAudioResponse(text: string): Promise<string> {
    if (!this.activeModel) {
      throw new Error('Not connected. Call connect() first.');
    }

    console.log('🔊 Generating audio response from text...');

    try {
      // Use Gemini to generate audio from text
      const result = await this.activeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Convert this text to speech: ${text}`,
              },
            ],
          },
        ],
      });

      const response = await result.response;

      // Check if response contains audio
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
            console.log('✅ Audio response generated');
            return part.inlineData.data; // Return base64 audio
          }
        }
      }

      throw new Error('No audio data in response');
    } catch (error) {
      console.error('❌ Error generating audio response:', error);
      throw error;
    }
  }

  async disconnect() {
    console.log('🔌 Disconnecting from Gemini Live API...');

    if (this.activeModel) {
      this.activeModel = null;
      console.log('✅ Disconnected and cleaned up');
    } else {
      console.log('⚠️ No active connection to disconnect');
    }
  }
}