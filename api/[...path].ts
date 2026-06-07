import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check endpoint
  if (req.url?.includes('/api/health')) {
    return res.status(200).json({ status: 'ok' });
  }

  // Default API response
  return res.status(200).json({
    message: 'Medical Aid Buddy API',
    success: true,
    timestamp: new Date().toISOString()
  });
}
