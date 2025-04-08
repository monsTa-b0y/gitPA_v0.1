import axios from 'axios';
import OpenAI from 'openai';
import { extractRepoInfo, getGitHubHeaders } from '../utils/github';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Scans a GitHub repository and returns its summary
 */
export async function scanRepository(url: string) {
  try {
    const { owner, repo } = extractRepoInfo(url);
    const headers = getGitHubHeaders();

    // Fetch repository metadata
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    // Fetch README content
    const readmeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
      { headers }
    );

    const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString();

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes GitHub repositories.',
        },
        {
          role: 'user',
          content: `Please provide a brief summary of this repository based on its metadata and README:\n\nMetadata: ${JSON.stringify(repoResponse.data)}\n\nREADME: ${readmeContent}`,
        },
      ],
    });

    return {
      status: 'success',
      repo: {
        name: repo,
        owner,
        description: repoResponse.data.description,
        summary: completion.choices[0].message.content,
      },
    };
  } catch (error) {
    console.error('Error scanning repository:', error);
    throw error;
  }
}

/**
 * Processes a user query about a repository
 */
export async function processQuery(repoUrl: string, query: string) {
  try {
    const { owner, repo } = extractRepoInfo(repoUrl);
    const headers = getGitHubHeaders();

    // Fetch relevant files based on the query
    // This is a simplified version - in a real implementation, you'd want to:
    // 1. Use the GitHub search API to find relevant files
    // 2. Fetch and analyze file contents
    // 3. Use embeddings for better context matching
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions about GitHub repositories.',
        },
        {
          role: 'user',
          content: `Repository: ${owner}/${repo}\nQuery: ${query}`,
        },
      ],
    });

    return {
      status: 'success',
      response: completion.choices[0].message.content,
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
} 