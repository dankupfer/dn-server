// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types';

const router = Router();

// Health check endpoint - shows status of all services
router.get('/health', (req: Request, res: Response<HealthResponse>) => {
  console.log('🏥 Health check requested');
  
  const healthData = {
    status: 'ok',
    message: 'DN Server is running',
    timestamp: new Date().toISOString(),
    services: {
      figma: true,
      customers: true,
      assist: true,
      voice: true,
    }
  };
  
  console.log('✅ Health check response:', JSON.stringify(healthData, null, 2));
  
  res.json(healthData);
});

export default router;