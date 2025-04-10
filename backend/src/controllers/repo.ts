import axios from 'axios';
import OpenAI from 'openai';
import { extractRepoInfo, getGitHubHeaders } from '../utils/github';
import { GITHUB_TOKEN } from '../config';

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
    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
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

    // Get file structure
    const fileStructure = response.data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type
    }));

    // Create a prompt for OpenAI
    const prompt = `Given the following repository structure and user query, please provide a detailed response.

Repository Structure:
${JSON.stringify(fileStructure, null, 2)}

User Query: ${query}

Please analyze the repository structure and provide a comprehensive answer based on the actual files present in the repository.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes GitHub repositories and provides detailed information about their contents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      response: completion.choices[0].message?.content || "No response generated"
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
} 