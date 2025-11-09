import express from 'express';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

/**
 * Chat endpoint - forwards requests to Vanna AI service
 * Note: The actual Vanna AI logic is in services/vanna/app.py
 */
router.post('/chat-with-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Forward request to Vanna AI service (FastAPI)
    const vannaUrl = process.env.VANNA_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${vannaUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Vanna service returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
