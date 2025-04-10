import express from 'express';
import { z } from 'zod';
import { scanRepository, processQuery } from '../controllers/repo';
import axios from 'axios';
import { GITHUB_TOKEN } from '../config';

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
  const { url } = req.body;
  
  try {
    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid GitHub URL format' 
      });
    }

    const [, owner, repo] = match;

    // Fetch repository contents
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    // Transform GitHub API response into our file structure format
    const fileStructure = response.data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type === 'dir' ? 'dir' : 'file',
      children: item.type === 'dir' ? [] : undefined
    }));

    res.json({ 
      status: 'success', 
      fileStructure 
    });
  } catch (error) {
    console.error('Repository scan error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to scan repository' 
    });
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