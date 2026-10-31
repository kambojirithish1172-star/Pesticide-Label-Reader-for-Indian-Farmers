import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse } from 'http';

// Custom server-side middleware for secure Gemini Vision API execution
function secureGeminiScanMiddleware() {
  return {
    name: 'secure-gemini-scan-api',
    configureServer(server: any) {
      server.middlewares.use('/api/extract-label', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const imageBase64 = parsed.imageBase64?.replace(/^data:image\/\w+;base64,/, '');
            const mimeType = parsed.mimeType || 'image/jpeg';

            const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

            if (geminiApiKey && imageBase64) {
              const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
              
              const geminiPrompt = `You are an expert agricultural chemist and document analysis system for Indian pesticide regulation (CIB&RC).
Analyze this pesticide container label photograph and extract visible information into structured JSON.
CRITICAL CONSTRAINT: Do NOT silently reconstruct unreadable or blurred text. If text is faded or obscured, mark value as null and confidence as "UNREADABLE".
For the three extra label fields below, extract only text explicitly printed in the photographed label. Never infer a soil type, dose, approved crop, or overdose symptom from product name or general chemistry. If the label does not state it, return null. Preserve units and crop/pest conditions exactly.

Respond with pure JSON object matching this schema:
{
  "productName": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "TOP_HEADER"|"MAIN_BODY"|"CAUTION_BOX"|"BATCH_STRIP"|"FOOTER", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "manufacturer": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "TOP_HEADER"|"MAIN_BODY"|"CAUTION_BOX"|"BATCH_STRIP"|"FOOTER", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "activeIngredients": { "value": string[]|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "printedConcentration": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "formulation": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "registrationNumber": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "batchNumber": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "BATCH_STRIP", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "manufacturingDate": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "BATCH_STRIP", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "expiryDate": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "BATCH_STRIP", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "warningStatements": { "value": string[]|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "CAUTION_BOX", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "hazardPictograms": { "value": string[]|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "CAUTION_BOX", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "printedFirstAid": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "FOOTER", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "labelDoseAndCrop": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "labelSoilGuidance": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "MAIN_BODY", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "labelCropInjuryWarning": { "value": string|null, "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "CAUTION_BOX", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "toxicityTriangleColor": { "value": "RED"|"YELLOW"|"BLUE"|"GREEN"|"UNKNOWN", "confidence": "HIGH"|"MEDIUM"|"LOW"|"UNREADABLE", "confidenceScore": number, "region": "CAUTION_BOX", "status": "VERIFIED"|"AMBIGUOUS"|"UNVERIFIED"|"MISSING" },
  "fullRawText": string
}`;

              const apiRes = await fetch(geminiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: geminiPrompt },
                        {
                          inlineData: {
                            mimeType,
                            data: imageBase64
                          }
                        }
                      ]
                    }
                  ],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1
                  }
                })
              });

              if (apiRes.ok) {
                const apiData = await apiRes.json();
                const rawJsonText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawJsonText) {
                  const extractedData = JSON.parse(rawJsonText);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, extractedData, source: 'GEMINI_VISION_API' }));
                  return;
                }
              }
            }

            // Fallback response if no key or error
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: false, 
              message: 'Gemini Vision API key not configured or unavailable. Operating in local deterministic mode.' 
            }));
          } catch (error: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
          }
        });
      });

      // Endpoint for Conversational Agricultural Q&A
      server.middlewares.use('/api/agricultural-chat', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const userQuery = parsed.query || '';
            const language = parsed.language || 'en';
            const contextText = parsed.context ? `Active context: ${JSON.stringify(parsed.context)}` : '';

            const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

            if (geminiApiKey && userQuery) {
              const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

              const langPromptMap: Record<string, string> = {
                hi: 'Respond in Hindi (हिन्दी). Use friendly, respectful words like "नमस्ते किसान साथी".',
                te: 'Respond in Telugu (తెలుగు). Use friendly, respectful words like "నమస్కారం రైతు మిత్రమా".',
                kn: 'Respond in Kannada (ಕನ್ನಡ). Use friendly, respectful words like "ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ".',
                en: 'Respond in clear, simple English. Use a warm, supportive tone ("Namaste Kisan Mitra!").'
              };

              const systemInstruction = `You are AGRIVERSE's AI Agricultural Voice Companion, an expert and trusted friend of Indian farmers.
Tone: Warm, respectful, friendly, and informative.
${langPromptMap[language] || langPromptMap.en}

Your purpose is to answer ANY type of agricultural question asked by the farmer with practical, grounded wisdom:
1. Crop cultivation, sowing, harvesting, and spacing.
2. Pest & disease control, cultural practices, biological controls (Neem, Trichoderma, pheromone traps).
3. Soil fertility, vermicompost, Jeevamrut, FYM, macro/micronutrient deficiencies.
4. Irrigation scheduling, drip maintenance, drainage.
5. Agricultural weather adaptation and storage protection.
6. Important: If chemical pesticide mixing or dosage is queried, explain safety protocols, PPE, and toxicity classes warmly, but remind the farmer to verify container label instructions or call Kisan Call Center (1800-180-1551) for exact plot dilution.
Keep formatting clean for spoken read-aloud: short paragraphs, bullet points without special markdown syntax.`;

              const response = await fetch(geminiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        { text: `${systemInstruction}\n${contextText}\nFarmer's Question: ${userQuery}` }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 600
                  }
                })
              });

              if (response.ok) {
                const data = await response.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, text: replyText.trim(), source: 'GEMINI_AI' }));
                  return;
                }
              }
            }

            // Fallback response handled by client knowledge base
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Local knowledge base fallback' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Chat Server Error' }));
          }
        });
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    secureGeminiScanMiddleware(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'AGRIVERSE - Agricultural Safety & Intelligence',
        short_name: 'AGRIVERSE',
        description: 'AGRIVERSE - Offline-first agricultural safety, intelligence and emergency support for Indian farmers',
        theme_color: '#174B35',
        background_color: '#F4F6F4',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(products|safety_symbols|emergency_references|safety_guides).*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'krishi-supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
