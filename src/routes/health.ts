// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types';

const router = Router();

// Health check endpoint - shows status of all services
router.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'ok',
    message: 'DN Server is running',
    timestamp: new Date().toISOString(),
    services: {
      figma: true,
      customers: true,
      assist: true,
      voice: false, // Will be true once we implement voice
    }
  });
});

export default router;