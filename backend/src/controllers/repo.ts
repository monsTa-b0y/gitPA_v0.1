import axios from 'axios';
import OpenAI from 'openai';
import { extractRepoInfo, getGitHubHeaders } from '../utils/github';
import { GITHUB_TOKEN } from '../config';
import { fetchRepoContents } from '../routes/repo';

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
  console.log(`[processQuery] Received query: \"${query}\" for repo: ${repoUrl}`); // Log received query
  try {
    // Check for directory listing request
    const dirMatch = query.match(/^(?:what(?: are)?(?: the)?(?: files)?(?: in)?|list(?: the)?(?: files)?(?: in)?|show(?: me)?(?: the)?(?: files)?(?: in)?) (.+?)(?: folder)?$/i);
    if (dirMatch && dirMatch[1]) {
      console.log('[processQuery] Directory listing request identified');
      const dirPath = dirMatch[1].trim();
      
      // Extract owner and repo from GitHub URL
      const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = urlMatch;
      
      try {
        // Fetch directory contents
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        // Format the response
        const items = response.data.map((item: any) => ({
          name: item.name,
          type: item.type,
          path: item.path
        }));

        return {
          response: `Here are the contents of the ${dirPath} directory:`,
          fileContent: {
            content: JSON.stringify(items, null, 2),
            fileName: `${dirPath}/contents.json`
          }
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return {
            response: `The directory "${dirPath}" was not found in the repository. Please check the directory name and try again.`,
            fileContent: null
          };
        }
        throw error;
      }
    }

    // Updated regex to be more flexible
    const fileMatch = query.match(/^(?:show(?: me)?(?: the)?(?: file)?(?: contents of)?|display(?: the)?(?: file)?|get(?: the)?(?: file)?(?: contents of)?|contents of) (.+)$/i);
    console.log(`[processQuery] File match result:`, fileMatch); // Log match result

    if (fileMatch && fileMatch[1]) {
      console.log('[processQuery] File match identified. Attempting direct fetch...');
      const filePath = fileMatch[1].trim();
      console.log(`[processQuery] Extracted file path: "${filePath}"`);
      
      // Extract owner and repo from GitHub URL
      const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        console.error('[processQuery] Invalid GitHub URL format in file fetch path.');
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = urlMatch;
      console.log(`[processQuery] Fetching content for: owner=${owner}, repo=${repo}, path=${filePath}`);

      // Fetch file content directly
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw'
          }
        }
      );
      console.log('[processQuery] Direct file fetch successful.');

      return {
        response: `Here are the contents of ${filePath}:`,
        fileContent: {
          content: response.data,
          fileName: filePath.split('/').pop()
        }
      };
    }

    console.log('[processQuery] No file match. Proceeding with OpenAI processing...');
    // For non-file content queries, proceed with OpenAI processing
    // Extract owner and repo from GitHub URL
    const urlMatchOpenAI = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!urlMatchOpenAI) {
      console.error('[processQuery] Invalid GitHub URL format in OpenAI path.');
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = urlMatchOpenAI;

    // Fetch repository metadata
    const metadataResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    // Fetch all repository contents recursively
    const fileStructure = await fetchRepoContents(owner, repo);

    // Filter and format the file structure to be more concise
    const relevantFiles = fileStructure
      .filter((item: any) => {
        // Only include files that are likely to contain tech stack information
        const relevantExtensions = ['.json', '.js', '.ts', '.py', '.java', '.go', '.rb', '.php', '.cs', '.md'];
        const isConfigFile = ['package.json', 'requirements.txt', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json', 'Cargo.toml'].includes(item.name);
        return item.type === 'dir' || 
               relevantExtensions.some(ext => item.name.endsWith(ext)) || 
               isConfigFile;
      })
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        // Only include content for small configuration files
        content: item.type === 'file' && 
                item.size < 10000 && // Only include files smaller than 10KB
                ['package.json', 'requirements.txt', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json', 'Cargo.toml'].includes(item.name)
                ? item.content
                : undefined
      }));

    // Create a more concise prompt for OpenAI
    const prompt = `Given the following repository information and user query, please provide a detailed response.

Repository Metadata:
- Name: ${metadataResponse.data.name}
- Description: ${metadataResponse.data.description || 'No description provided'}
- Primary Language: ${metadataResponse.data.language || 'Not specified'}

Relevant Files:
${JSON.stringify(relevantFiles, null, 2)}

User Query: ${query}

Please analyze the repository structure and provide a comprehensive answer based on the actual files present in the repository. If the query is about the tech stack, identify key files like package.json, requirements.txt, or other configuration files that indicate the technologies used.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes GitHub repositories and provides detailed information about their contents and tech stack. You have access to key configuration files and can identify the technologies used."
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
    console.error('[processQuery] Error processing query:', error);
    // Log specific Axios error details if available
    if (axios.isAxiosError(error)) {
      console.error('[processQuery] Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config, // Log request config
      });
    }
    throw error; // Re-throw the error to be caught by the route handler
  }
} 