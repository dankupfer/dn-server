// src/services/mockAssistant.ts

const MOCK_RESPONSES = [
  "That's interesting, tell me more about it.",
  "I see, can you elaborate on that?",
  "That's fascinating! What else would you like to share?",
  "Hmm, that's a good point. What do you think about it?"
];

export class MockAssistantService {
  private enableTTS: boolean;

  constructor(enableTTS: boolean = false) {
    this.enableTTS = enableTTS;
  }

  async processAudio(audioData: string): Promise<{ transcript: string; audioResponse?: string }> {
    // Simulate processing delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000; // Random between 1-2 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Pick a random response
    const transcript = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

    // If TTS is enabled, we'd need to generate audio
    // For now, we'll return undefined and handle TTS separately
    return {
      transcript,
      audioResponse: this.enableTTS ? await this.generateMockAudio(transcript) : undefined
    };
  }

  private async generateMockAudio(text: string): Promise<string> {
    // TODO: Generate actual TTS audio
    // For now, return empty string - client won't play anything
    // We can implement Google TTS here later if needed
    console.log('🔊 Mock TTS requested but not implemented yet');
    return '';
  }

  setEnableTTS(enable: boolean): void {
    this.enableTTS = enable;
  }
}