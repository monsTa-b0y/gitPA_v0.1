import axios from 'axios';
import OpenAI from 'openai';
import { extractRepoInfo, getGitHubHeaders } from '../utils/github';

// Debug logging for API key
const apiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key (masked):', apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Scans a GitHub repository and returns its summary
 */
export async function scanRepository(url: string) {
  try {
    console.log('Scanning repository:', url);
    const { owner, repo } = extractRepoInfo(url);
    console.log('Extracted repo info:', { owner, repo });
    
    const headers = getGitHubHeaders();
    console.log('Using GitHub headers:', headers);

    // Fetch repository metadata
    console.log('Fetching repository metadata...');
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );
    console.log('Repository metadata fetched successfully');

    // Fetch README content
    console.log('Fetching README content...');
    const readmeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
      { headers }
    );
    console.log('README content fetched successfully');

    const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString();

    // Generate summary using OpenAI
    console.log('Generating summary using OpenAI...');
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
    console.log('Summary generated successfully');

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
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    throw error;
  }
}

/**
 * Processes a user query about a repository
 */
export async function processQuery(repoUrl: string, query: string) {
  try {
    console.log('Processing query:', { repoUrl, query });
    const { owner, repo } = extractRepoInfo(repoUrl);
    const headers = getGitHubHeaders();

    // Fetch relevant files based on the query
    // This is a simplified version - in a real implementation, you'd want to:
    // 1. Use the GitHub search API to find relevant files
    // 2. Fetch and analyze file contents
    // 3. Use embeddings for better context matching
    console.log('Generating response using OpenAI...');
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
    console.log('Response generated successfully');

    return {
      status: 'success',
      response: completion.choices[0].message.content,
    };
  } catch (error) {
    console.error('Error processing query:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    throw error;
  }
} 