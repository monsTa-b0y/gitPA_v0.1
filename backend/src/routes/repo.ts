import express from 'express';
import { z } from 'zod';
import { scanRepository, processQuery } from '../controllers/repo';

const router = express.Router();

// Validation schemas
const scanRepoSchema = z.object({
  url: z.string().url().regex(/github\.com\/[^/]+\/[^/]+/)
});

const querySchema = z.object({
  repoUrl: z.string().url().regex(/github\.com\/[^/]+\/[^/]+/),
  query: z.string().min(1)
});

// Scan repository endpoint
router.post('/scan', async (req, res) => {
  try {
    const { url } = scanRepoSchema.parse(req.body);
    const result = await scanRepository(url);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid repository URL' });
    } else {
      console.error('Repository scan error:', error);
      res.status(500).json({ error: 'Failed to scan repository' });
    }
  }
});

// Process query endpoint
router.post('/assist', async (req, res) => {
  try {
    const { repoUrl, query } = querySchema.parse(req.body);
    const result = await processQuery(repoUrl, query);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request parameters' });
    } else {
      console.error('Query processing error:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
});

export const repoRoutes = router; 