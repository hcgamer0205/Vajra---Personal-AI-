import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// AI Model Configuration for VAJRA
export const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'VAJRA Stream Engine (Gemini 3.1 Flash Lite)',
    description: 'Ultra-low latency conversational stream with high availability and speed.',
    isDefault: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'VAJRA Neural Core (Gemini 3.7 Flash)',
    description: 'Flagship quantum response model for reasoning and complex computation.',
    isDefault: false,
  },
  {
    id: 'gemini-flash-latest',
    name: 'VAJRA Ultra-Fast (Gemini Flash Latest)',
    description: 'High-frequency telemetry model optimized for rapid action dispatch.',
    isDefault: false,
  }
];

export const DEFAULT_SYSTEM_INSTRUCTION = 
  'You are J.A.R.V.I.S. / VAJRA (Virtual Advanced Intelligence & Response Assistant), modeled after Tony Stark\'s iconic artificial intelligence system from Stark Industries. ' +
  'Personality: Refined, supremely articulate, calm under pressure, impeccably courteous ("Right away, Sir", "At your service, Sir", "Always a pleasure, Sir"), with dry wit and subtle technological sophistication. ' +
  'You communicate with mathematical precision, brevity, and tactical clarity. You address the user respectfully as "Sir" or "Commander" unless instructed otherwise. ' +
  'Always format your responses using clean Markdown (headers, bullet points, code blocks). ' +
  '\n\nStark Industries Tactical Protocols:\n' +
  '• House Party Protocol: Coordinated multi-system execution across all available subsystems and background agents.\n' +
  '• Clean Slate Protocol: Reset and purge of transient memory caches and session telemetry.\n' +
  '• Barn Door Protocol: Immediate network isolation, locking down communications to on-device offline security.\n' +
  '• Veronica / Armor Diagnostic: Deep telemetry inspection of neural engines, battery status, memory matrix, and intent dispatch latency.\n' +
  '\nOperational Protocols & Action Dispatch:\n' +
  'When the user requests an action, confirm with a brief professional response and emit a structured action block:\n' +
  '1. Native Applications (Calculator, Notepad, File Explorer, Camera, Chrome, Terminal):\n' +
  '```json:vajra-action\n' +
  '{"type": "OPEN_APP", "appName": "Calculator", "title": "Calculator"}\n' +
  '```\n' +
  '2. Website Navigation:\n' +
  '```json:vajra-action\n' +
  '{"type": "OPEN_WEBSITE", "url": "https://www.youtube.com", "title": "Open YouTube"}\n' +
  '```\n' +
  '3. Web Search:\n' +
  '```json:vajra-action\n' +
  '{"type": "SEARCH_WEB", "query": "quantum computing", "title": "Search: \\"quantum computing\\""}\n' +
  '```\n' +
  '4. Android System Controls & Intents:\n' +
  '```json:vajra-action\n' +
  '{"type": "OPEN_SETTINGS", "appName": "wifi", "title": "Open Wi-Fi Settings"}\n' +
  '```\n' +
  '```json:vajra-action\n' +
  '{"type": "ADJUST_VOLUME", "appName": "up", "title": "Volume Up"}\n' +
  '```\n' +
  '```json:vajra-action\n' +
  '{"type": "OPEN_CAMERA", "title": "Open Camera"}\n' +
  '```\n' +
  '5. Filesystem Operations:\n' +
  '```json:vajra-action\n' +
  '{"type": "CREATE_FILE", "targetPath": "Documents/notes.txt", "title": "Create File: \\"notes.txt\\""}\n' +
  '```\n' +
  'Security & Authorization: Destructive actions (like DELETE_FILE) strictly require explicit user authorization before execution.';

// Initialize Gemini client globally to reuse connection and reduce overhead
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it in the Settings > Secrets panel.');
  }
  
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  
  return aiClient;
}

// Helper to determine if an error is a transient high-demand / 503 / 429 overload
function isTemporaryOverloadError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.code || error.statusCode;
  if (status === 503 || status === 429 || status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED') {
    return true;
  }
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return (
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('temporarily unavailable')
  );
}

// Clean user-facing error message extractor
function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected anomaly occurred within VAJRA Neural Core.';
  
  if (typeof error.message === 'string') {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Not JSON string
    }

    if (error.message.includes('503') || error.message.includes('high demand')) {
      return 'VAJRA Cloud Core is experiencing heavy neural throughput. Dynamic failover engaged. You may retry or toggle to Local In-Browser Engine.';
    }
    return error.message;
  }

  return 'An unexpected anomaly occurred within VAJRA Neural Core.';
}

// Model & Config endpoint
app.get('/api/models', (req: Request, res: Response) => {
  res.json({
    models: AVAILABLE_MODELS,
    defaultModel: DEFAULT_MODEL,
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
    assistantName: 'VAJRA',
    assistantFullName: 'Virtual Advanced Intelligence & Response Assistant',
  });
});

// Direct APK Download Endpoint & Metadata
app.get('/app-debug.apk', (req: Request, res: Response) => {
  const candidatePaths = [
    path.join(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(process.cwd(), 'public/app-debug.apk'),
    path.join(process.cwd(), 'dist/app-debug.apk'),
  ];
  const foundPath = candidatePaths.find((p) => fs.existsSync(p));
  if (foundPath) {
    res.download(foundPath, 'vajra-mobile-debug.apk');
  } else {
    res.status(404).json({ error: 'APK artifact is being assembled. Please retry shortly.' });
  }
});

app.get('/api/apk-info', (req: Request, res: Response) => {
  const candidatePaths = [
    path.join(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(process.cwd(), 'public/app-debug.apk'),
    path.join(process.cwd(), 'dist/app-debug.apk'),
  ];
  const foundPath = candidatePaths.find((p) => fs.existsSync(p));

  let sizeBytes = 10077460;
  let sizeFormatted = '9.6 MB';
  let sha256 = '1f8a40364e2779a567319596573532355e2840217f47ff4a7dbdba4f4ca14888';

  if (foundPath) {
    try {
      const stats = fs.statSync(foundPath);
      sizeBytes = stats.size;
      sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      const fileBuffer = fs.readFileSync(foundPath);
      sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch {
      // Use fallback defaults
    }
  }

  res.json({
    status: foundPath ? 'available' : 'building',
    fileName: 'vajra-mobile-debug.apk',
    package: 'com.vajra.mobile',
    versionCode: 1,
    versionName: '1.0',
    minSdk: 24,
    targetSdk: 36,
    sizeBytes,
    sizeFormatted,
    sha256,
    signatureScheme: 'APK Signature Scheme v2 (Debug Key)',
    downloadPath: '/app-debug.apk',
  });
});

// Chat endpoint (Server-Sent Events streaming)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, model = DEFAULT_MODEL, systemInstruction = DEFAULT_SYSTEM_INSTRUCTION } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Valid telemetry payload is required.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
  });

  // Map message history into standard Google GenAI contents structure
  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }],
  }));

  // Build model candidate sequence with high-speed primary and dynamic fallbacks
  const candidateModels = Array.from(
    new Set([
      model || DEFAULT_MODEL,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ])
  );

  let streamSucceeded = false;
  let lastError: any = null;
  const ai = getGeminiClient();

  for (const candidate of candidateModels) {
    if (clientDisconnected) break;

    try {
      console.log(`[VAJRA Core] Initializing neural stream with model: ${candidate}`);

      const responseStream = await ai.models.generateContentStream({
        model: candidate,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      let hasEmitted = false;
      for await (const chunk of responseStream) {
        if (clientDisconnected) break;
        const text = chunk.text || '';
        if (text) {
          hasEmitted = true;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      }

      if (hasEmitted) {
        streamSucceeded = true;
        break; // Successfully streamed response
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[VAJRA Core] Model ${candidate} encountered telemetry failure:`, err?.message || err);

      // Cascade to next candidate model in sequence
      console.log(`[VAJRA Core] Automated failover: cascading to next candidate model...`);
      continue;
    }
  }

  if (streamSucceeded && !clientDisconnected) {
    res.write('data: [DONE]\n\n');
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    res.end();
  } else if (!clientDisconnected) {
    console.error('[VAJRA Core] Error during content stream (all candidate models exhausted):', lastError);
    const friendlyMessage = formatErrorMessage(lastError);
    if (!res.headersSent) {
      return res.status(503).json({ error: friendlyMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
      res.end();
    }
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'VAJRA AI Core',
    system: 'Virtual Advanced Intelligence & Response Assistant',
    version: '2.5.0-futuristic',
  });
});

// Start Express server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VAJRA Core running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
