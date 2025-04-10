<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 p-4 shadow-md">
      <h1 class="text-2xl font-bold text-center">GitHub Assistant</h1>
    </header>

    <main class="container mx-auto p-4 flex flex-col items-center">
      <div class="mb-6 w-full max-w-lg">
        <div class="flex gap-2">
          <input
            v-model="repositoryUrl"
            type="text"
            placeholder="Enter GitHub repository URL"
            class="flex-1 px-4 py-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
          />
          <button
            @click="scanRepository"
            :disabled="scanning"
            class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ scanning ? 'Scanning...' : 'Scan' }}
          </button>
        </div>
        <p v-if="scanError" class="mt-2 text-red-500">{{ scanError }}</p>
      </div>

      <div class="flex w-full gap-4 bg-gray-900">
        <!-- File Structure Panel -->
        <div v-if="fileStructure.length > 0" class="flex-shrink-0 bg-gray-800 rounded shadow-lg">
          <FileStructure
            :file-structure="fileStructure"
            class="w-full"
          />
        </div>
        
        <!-- Chat Interface Panel -->
        <div v-if="fileStructure.length > 0" class="flex-1 bg-gray-800 rounded shadow-lg flex flex-col">
          <!-- Chat Messages -->
          <div class="flex-1 p-4 overflow-y-auto" ref="messagesContainer">
            <!-- Initial System Message -->
            <div v-if="repoStore.repoInfo" class="flex justify-start mb-4">
              <div class="max-w-[80%] bg-gray-700 rounded-lg p-4 text-gray-100">
                <h3 class="text-lg font-semibold mb-2">{{ repoStore.repoInfo.name }}</h3>
                <p class="mb-2">{{ repoStore.repoInfo.description }}</p>
                <p class="mb-2">{{ repoStore.repoInfo.summary }}</p>
                <a 
                  :href="repositoryUrl" 
                  target="_blank" 
                  class="text-blue-400 hover:text-blue-300 underline"
                >
                  View on GitHub
                </a>
              </div>
            </div>
            
            <!-- Messages -->
            <div v-for="message in messages" :key="message.id" class="mb-4"
                :class="[
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
            >
              <div
                :class="[
                  'max-w-[80%] rounded-lg p-4',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                ]"
              >
                <MarkdownRenderer v-if="message.role === 'assistant'" :content="message.content" />
                <template v-else>{{ message.content }}</template>
              </div>
            </div>
            
            <!-- Loading indicator -->
            <div v-if="chatLoading && messages.length > 0" class="flex justify-start mb-4">
              <div class="bg-gray-700 rounded-lg p-4 text-gray-300">
                <div class="flex space-x-2">
                  <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Query Input -->
          <div class="p-4 border-t border-gray-700">
            <form @submit.prevent="sendQuery" class="flex gap-2">
              <input
                v-model="query"
                type="text"
                placeholder="Ask a question about the repository..."
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                :disabled="chatLoading"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                :disabled="chatLoading || !query.trim()"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryStore } from './stores/repository';
import { useRepoStore } from './stores/repo';
import FileStructure from './components/FileStructure.vue';
import MarkdownRenderer from './components/MarkdownRenderer.vue';

// Repository store for file structure
const repositoryStore = useRepositoryStore();
const repositoryUrl = ref('');
const { fileStructure, loading: scanning, error: scanError } = storeToRefs(repositoryStore);

// Repo store for chat functionality
const repoStore = useRepoStore();
const query = ref('');
// Use storeToRefs to get reactive access to store state
const { messages, isLoading: chatLoading, error: chatError } = storeToRefs(repoStore);

// Explicitly type the ref as HTMLElement
const messagesContainer = ref<HTMLElement | null>(null);

// Scroll to bottom of messages when new messages are added
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

// Scan repository
const scanRepository = async () => {
  if (repositoryUrl.value) {
    await repositoryStore.scanRepository(repositoryUrl.value);
    if (fileStructure.value.length > 0) {
      // Also update the repo store for chat functionality
      // The repoStore.scanRepository action handles setting the initial message
      await repoStore.scanRepository(repositoryUrl.value);
    }
  }
};

// Send query to backend
const sendQuery = async () => {
  if (!query.value.trim() || chatLoading.value || !repoStore.url) return;
  
  const currentQuery = query.value;
  // Clear input immediately
  query.value = '';
  
  try {
    // Call the repoStore action to send query to the backend
    // This action will update the messages and loading state in the store
    await repoStore.sendQuery(currentQuery);
  } catch (error) {
    console.error('Error sending query:', error);
    // The store might handle error display, or we can add a local error message if needed
    // For simplicity, we rely on the store's error handling
  }
};
</script>

<style scoped>
.input {
  @apply w-full px-4 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-900 text-gray-100 placeholder-gray-400;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
</style>
