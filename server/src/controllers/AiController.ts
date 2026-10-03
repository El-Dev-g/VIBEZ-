import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class AiController {
  private readonly modelName = 'gemini-3.5-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  async generateChat(req: AuthRequest, res: Response) {
    try {
      const { prompt, chatHistory, chatId = 'vibez_ai_chat' } = req.body;
      const currentUserId = req.user?.id;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          success: true,
          reply: '✨ [Vibez AI]: Hello! I am Vibez AI powered by PRIGID AI. Please configure server credentials to activate live responses.'
        });
      }

      // Build contents array for Gemini REST API, ensuring turns alternate between 'user' and 'model'
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // 1. Process recent chat history (last 8 messages)
      if (Array.isArray(chatHistory)) {
        chatHistory.slice(-8).forEach(item => {
          if (item && typeof item.text === 'string' && item.text.trim().length > 0) {
            const isAi = item.sender === 'AI' || item.sender === 'VIBEZ_AI' || item.sender === 'Vibez AI' || item.sender === 'model';
            const role = isAi ? 'model' : 'user';
            const text = item.text.trim();

            if (contents.length > 0 && contents[contents.length - 1].role === role) {
              contents[contents.length - 1].parts[0].text += `\n${text}`;
            } else {
              contents.push({ role, parts: [{ text }] });
            }
          }
        });
      }

      // If the first turn in contents is 'model', remove or prepend context so contents starts with 'user'
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }

      // 2. Append current user prompt
      const trimmedPrompt = prompt.trim();
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n${trimmedPrompt}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: trimmedPrompt }]
        });
      }

      const payload = {
        contents,
        systemInstruction: {
          parts: [{
            text: 'You are Vibez AI powered by PRIGID AI, an intelligent, helpful, friendly, and concise assistant integrated directly inside the Vibez messenger. You are developed by PRIGID GROUP. Provide clear, well-formatted, and conversational responses. When asked about your model, architecture, or creator, identify as PRIGID AI developed by PRIGID GROUP, and do not reference underlying third-party provider names.'
          }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      };

      const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('[AiController] AI API error:', geminiRes.status, errorText);
        return res.status(502).json({
          success: false,
          error: `AI service returned status ${geminiRes.status}`,
          reply: `✨ [Vibez AI]: Unable to process request (HTTP ${geminiRes.status}). Please verify server AI credentials.`
        });
      }

      const data = await geminiRes.json() as any;
      const candidates = data?.candidates;
      const replyText = candidates?.[0]?.content?.parts?.[0]?.text || '✨ [Vibez AI]: No response generated. Please try again.';

      // Save messages asynchronously to database for vibez_ai_chat history
      if (currentUserId) {
        try {
          // Ensure vibez_ai_chat exists
          await prisma.chat.upsert({
            where: { id: chatId },
            create: {
              id: chatId,
              name: 'Vibez AI',
              isOfficial: true,
              isVerified: true,
              isGroup: false,
              members: {
                create: [{ userId: currentUserId }]
              }
            },
            update: {
              name: 'Vibez AI',
              isOfficial: true,
              isVerified: true
            }
          });

          // Save user message
          await prisma.message.create({
            data: {
              chatId,
              senderId: currentUserId,
              content: prompt.trim(),
              type: 'TEXT',
              status: 'READ'
            }
          });

          // Save AI response
          await prisma.message.create({
            data: {
              chatId,
              senderId: currentUserId,
              content: replyText,
              type: 'TEXT',
              status: 'READ'
            }
          });
        } catch (dbErr) {
          console.warn('[AiController] Warning: Failed to persist AI message in DB:', dbErr);
        }
      }

      return res.json({
        success: true,
        reply: replyText
      });
    } catch (error: any) {
      console.error('[AiController] generateChat exception:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Internal server error while processing AI request',
        reply: '✨ [Vibez AI]: An unexpected error occurred. Please try again shortly.'
      });
    }
  }

  async transcribeAudio(req: AuthRequest, res: Response) {
    try {
      const { audioBase64, mimeType = 'audio/mp4' } = req.body;

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return res.status(400).json({ error: 'audioBase64 data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          success: true,
          transcript: '🎙️ [Transcribed Voice Note]: Audio received. (Configure server AI credentials for live transcription).'
        });
      }

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Transcribe the following voice note verbatim into clear text. Do not add conversational commentary, just output the transcription text:'
              },
              {
                inlineData: {
                  mimeType,
                  data: audioBase64
                }
              }
            ]
          }
        ]
      };

      const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error('[AiController] Gemini audio transcription error:', geminiRes.status, errorText);
        return res.status(502).json({
          success: false,
          error: 'Failed to transcribe audio'
        });
      }

      const data = await geminiRes.json() as any;
      const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Could not transcribe audio.';

      return res.json({
        success: true,
        transcript
      });
    } catch (error: any) {
      console.error('[AiController] transcribeAudio exception:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to process audio transcription'
      });
    }
  }
}
