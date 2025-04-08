/**
 * Extracts owner and repo name from a GitHub URL
 */
export function extractRepoInfo(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  return {
    owner: match[1],
    repo: match[2],
  };
}

/**
 * Returns GitHub API headers with authentication
 */
export function getGitHubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GitHub token not found in environment variables');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
} 