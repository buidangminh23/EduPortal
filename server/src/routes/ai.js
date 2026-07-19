import { Router } from 'express';
import { transcribe } from '../lib/whisper.js';
import { summarize } from '../lib/llm.js';

const router = Router();

// POST /api/transcribe   body: { audioBase64, language? }   -> { text, simulated }
router.post('/transcribe', async (req, res) => {
  try {
    const { audioBase64, language } = req.body || {};
    const buffer = audioBase64 ? Buffer.from(audioBase64, 'base64') : null;
    const out = await transcribe(buffer, { language });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/summarize   body: { transcript } HOẶC { audioBase64 }
//   -> { topics, keyPoints, actions, simulated }
router.post('/summarize', async (req, res) => {
  try {
    let { transcript, audioBase64 } = req.body || {};
    if (!transcript && audioBase64) {
      const t = await transcribe(Buffer.from(audioBase64, 'base64'));
      transcript = t.text;
    }
    const out = await summarize(transcript || '');
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
