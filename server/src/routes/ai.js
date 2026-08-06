/**
 * Phiên âm và tóm tắt cuộc họp, chạy trên model đặt tại trường.
 *
 * These two endpoints used to take no authentication at all. On a machine
 * behind a tunnel that was merely untidy; on a machine with a public IP it
 * means a stranger can post 25 MB of audio (the body limit index.js sets for
 * exactly this route) at the school's own GPU, as often as they like, and read
 * back whatever the local model says. Nothing in the request identifies them
 * and nothing in the school's logs would either.
 *
 * FIREWALL.md answers this with an nginx `deny`, and should keep doing so —
 * but a rule in a config file the school copies by hand is not where a control
 * belongs. The caller is now checked here, against Supabase, using the same
 * resolver the camera wall uses: the token comes with the request, the role is
 * read from the `profiles` row that token can reach, and this process never
 * holds a service key.
 */

import { Router } from 'express';
import { transcribe } from '../lib/whisper.js';
import { summarize } from '../lib/llm.js';
import { createViewerResolver, tokenFromHeader } from '../lib/viewerIdentity.js';

/**
 * Who may spend the school's model time. Meeting notes are staff work, so
 * pupils and parents are not on the list; a school that wants to widen it
 * edits AI_ALLOWED_ROLES rather than this file.
 */
export const DEFAULT_ALLOWED_ROLES = ['teacher', 'admin'];

export function createAiRouter({ viewerResolver, allowedRoles = DEFAULT_ALLOWED_ROLES } = {}) {
  const router = Router();
  const configured = Boolean(viewerResolver?.isConfigured);

  /**
   * Refuses anybody Supabase does not recognise as staff.
   *
   * An unconfigured server refuses too, rather than falling open. A deployment
   * that cannot check who is asking is not a deployment that should answer —
   * the same call the camera relay makes, and for the same reason.
   */
  async function requireStaff(req, res, next) {
    if (!configured) {
      return res.status(503).json({
        error: 'ai_not_configured',
        message: 'Máy chủ chưa cấu hình xác thực (SUPABASE_URL, SUPABASE_ANON_KEY).'
      });
    }

    const viewer = await viewerResolver.resolve(tokenFromHeader(req.get('authorization')));
    if (!viewer) return res.status(401).json({ error: 'unauthenticated' });
    if (!allowedRoles.includes(viewer.role)) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Chỉ giáo viên và Ban Giám Hiệu dùng được phần phiên âm, tóm tắt.'
      });
    }

    req.viewer = viewer;
    return next();
  }

  // POST /api/transcribe   body: { audioBase64, language? }   -> { text, simulated }
  router.post('/transcribe', requireStaff, async (req, res) => {
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
  router.post('/summarize', requireStaff, async (req, res) => {
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

  return router;
}

export function createAiRouterFromEnv(env = process.env) {
  return createAiRouter({
    viewerResolver: createViewerResolver({
      supabaseUrl: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY
    }),
    allowedRoles: (env.AI_ALLOWED_ROLES || DEFAULT_ALLOWED_ROLES.join(','))
      .split(',')
      .map(role => role.trim())
      .filter(Boolean)
  });
}
