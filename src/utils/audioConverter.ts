import ffmpeg from 'fluent-ffmpeg';
import { Buffer } from 'buffer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ConvertedAudio {
    data: string; // base64
    mimeType: string;
}

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function convertToWav(base64Audio: string, sourceMimeType: string): Promise<ConvertedAudio> {
    // If already wav, return as-is
    if (sourceMimeType === 'audio/wav' || sourceMimeType === 'audio/x-wav') {
        return {
            data: base64Audio,
            mimeType: 'audio/wav'
        };
    }

    // If webm (from web), also accept it
    if (sourceMimeType === 'audio/webm') {
        return {
            data: base64Audio,
            mimeType: 'audio/webm'
        };
    }

    console.log(`🔄 Converting ${sourceMimeType} to WAV...`);
    console.log(`📊 Base64 length: ${base64Audio.length}`);

    // Create temp files
    const tempDir = os.tmpdir();
    const inputFile = path.join(tempDir, `input-${Date.now()}.m4a`);
    const outputFile = path.join(tempDir, `output-${Date.now()}.wav`);

    try {
        // Write base64 to temp file
        const buffer = Buffer.from(base64Audio, 'base64');
        console.log(`📊 Buffer size: ${buffer.length} bytes`);

        await fs.writeFile(inputFile, buffer);
        console.log(`✅ Wrote temp file: ${inputFile}`);

        // Use macOS native afconvert for m4a files (better compatibility)
        if (sourceMimeType === 'audio/x-m4a') {
            console.log('🍎 Using macOS afconvert for m4a...');
            await execPromise(
                `afconvert -f WAVE -d LEI16@16000 -c 1 "${inputFile}" "${outputFile}"`
            );
        } else {
            // Use ffmpeg for other formats
            await new Promise<void>((resolve, reject) => {
                ffmpeg(inputFile)
                    .inputOptions(['-ignore_editlist', '1'])
                    .toFormat('wav')
                    .audioFrequency(16000)
                    .audioChannels(1)
                    .audioCodec('pcm_s16le')
                    .on('start', (cmd) => console.log('🎬 ffmpeg command:', cmd))
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .save(outputFile);
            });
        }

        // Read converted file
        const wavBuffer = await fs.readFile(outputFile);
        const wavBase64 = wavBuffer.toString('base64');

        console.log('✅ Conversion complete');

        // Cleanup
        await fs.unlink(inputFile).catch(() => { });
        await fs.unlink(outputFile).catch(() => { });

        return {
            data: wavBase64,
            mimeType: 'audio/wav'
        };

    } catch (error) {
        console.error('❌ Audio conversion failed:', error);

        console.log(`🔍 Debug: Temp file kept at: ${inputFile}`);

        throw error;
    }
}