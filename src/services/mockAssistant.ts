// src/services/mockAssistant.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execPromise = promisify(exec);

export class MockAssistantService {
  private enableTTS: boolean;

  private mockResponses = [
    "That's interesting, tell me more about it.",
    "I see, can you elaborate on that?",
    "That's fascinating! What else would you like to share?",
    "Hmm, that's a good point. What do you think about it?"
  ];

  constructor(enableTTS: boolean = false) {
    this.enableTTS = enableTTS;
  }

  async processAudio(audioData: string): Promise<{ transcript: string; audioResponse?: string }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Get random response
    const transcript = this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)];

    // Generate TTS if enabled
    let audioResponse: string | undefined;
    if (this.enableTTS) {
      audioResponse = await this.generateMockTTS(transcript);
    }

    return { transcript, audioResponse };
  }

  private async generateMockTTS(text: string): Promise<string> {
    console.log('🔊 Generating mock TTS using macOS say...');

    const tempDir = os.tmpdir();
    const outputFile = path.join(tempDir, `mock-tts-${Date.now()}.aiff`);
    const mp3File = path.join(tempDir, `mock-tts-${Date.now()}.mp3`);

    try {
      // Use macOS 'say' command to generate audio
      await execPromise(`say -o "${outputFile}" "${text}"`);
      console.log('✅ Generated audio with say');

      // Convert AIFF to MP3 using ffmpeg (smaller file size)
      await execPromise(`ffmpeg -i "${outputFile}" -y "${mp3File}"`);
      console.log('✅ Converted to MP3');

      // Read MP3 file and convert to base64
      const audioBuffer = await fs.readFile(mp3File);
      const base64Audio = audioBuffer.toString('base64');

      // Cleanup temp files
      await fs.unlink(outputFile).catch(() => { });
      await fs.unlink(mp3File).catch(() => { });

      console.log('✅ Mock TTS complete');
      return base64Audio;

    } catch (error) {
      console.error('❌ Mock TTS generation failed:', error);

      // Cleanup on error
      await fs.unlink(outputFile).catch(() => { });
      await fs.unlink(mp3File).catch(() => { });

      throw error;
    }
  }
}