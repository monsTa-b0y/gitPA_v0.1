import { defineStore } from 'pinia';
import axios from 'axios';

interface RepoState {
  url: string;
  isLoading: boolean;
  error: string | null;
  repoInfo: {
    name: string;
    owner: string;
    description: string;
    summary: string;
  } | null;
  messages: {
    id: number;
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export const useRepoStore = defineStore('repo', {
  state: (): RepoState => ({
    url: '',
    isLoading: false,
    error: null,
    repoInfo: null,
    messages: [],
  }),

  actions: {
    async scanRepository(url: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/repo/scan`, { url });
        this.repoInfo = response.data.repo;
        this.messages = [
          {
            id: Date.now(),
            role: 'assistant',
            content: `Repository scanned successfully! Here's a summary:\n\n${response.data.repo.summary}`,
          },
        ];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to scan repository';
        console.error('Error scanning repository:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async sendQuery(query: string) {
      if (!this.repoInfo) return;

      this.isLoading = true;
      this.messages.push({
        id: Date.now(),
        role: 'user',
        content: query,
      });

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/repo/assist`, {
          repoUrl: this.url,
          query,
        });

        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: response.data.response,
        });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to process query';
        console.error('Error processing query:', error);
      } finally {
        this.isLoading = false;
      }
    },

    clearConversation() {
      this.messages = [];
      this.repoInfo = null;
      this.url = '';
      this.error = null;
    },
  },
}); 