// src/routes/assist/index.ts
import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AssistChatRequest, AssistChatResponse } from '../../types';

const router = Router();

// System prompt for AI assistants
const SYSTEM_PROMPT = `You are a helpful banking assistant. Keep your responses concise and conversational - aim for 2-3 sentences maximum since the interface is small. Never use markdown, formatting, bullet points, or special characters. Write in plain text only, as if you're having a natural conversation.`;

// Dummy responses for mock mode
const dummyResponses = [
  "That's a great question! Let me help you with that.",
  "I understand what you're asking. Here's what I can tell you...",
  "Interesting! Based on what you've shared, I'd suggest...",
  "Let me think about that for a moment... I believe the answer is...",
  "That's something I can definitely help with!",
];

// POST /api/assist/chat
router.post('/assist/chat', async (req: Request<{}, AssistChatResponse, AssistChatRequest>, res: Response<AssistChatResponse>) => {
  try {
    const { message, aiProvider } = req.body;

    if (!message) {
      return res.status(400).json({ 
        response: 'Message is required',
        timestamp: new Date().toISOString()
      });
    }

    let response: string;

    // Check if live mode with AI provider
    if (aiProvider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          response: 'Gemini API key not configured',
          timestamp: new Date().toISOString()
        });
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-pro',
          systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();
        response = responseText;
      } catch (error: any) {
        console.error('Gemini API error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          errorDetails: error.errorDetails,
        });

        if (error.status === 429) {
          return res.json({
            response: "Something went wrong! Please check the server console!!",
            timestamp: new Date().toISOString(),
            fallbackSuggested: true,
          });
        }
        throw error;
      }

    } else if (aiProvider === 'claude') {
      const apiKey = process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          response: 'Claude API key not configured',
          timestamp: new Date().toISOString()
        });
      }

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: message }
          ],
        }),
      });

      if (!claudeResponse.ok) {
        const errorData = await claudeResponse.json();
        console.error('Claude API error:', errorData);
        return res.status(claudeResponse.status).json({ 
          response: 'Claude API request failed',
          timestamp: new Date().toISOString()
        });
      }

      const data = await claudeResponse.json() as any;
      response = data.content[0].text;

    } else {
      // Mock mode - random response with simulated delay
      const thinkingTime = Math.random() * 1000 + 500;
      await new Promise(resolve => setTimeout(resolve, thinkingTime));
      response = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
    }

    res.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in assist chat:', error);
    res.status(500).json({ 
      response: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;