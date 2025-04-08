<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">GitHub Assistant</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <!-- Repository URL Input (only shown when no repository is selected) -->
      <div v-if="!repoStore.repoInfo" class="mb-8">
        <form @submit.prevent="handleScan" class="flex gap-4">
          <input
            v-model="repoStore.url"
            type="text"
            placeholder="Enter GitHub repository URL"
            class="input flex-1"
          />
          <button type="submit" class="btn btn-primary" :disabled="repoStore.isLoading">
            {{ repoStore.isLoading ? 'Scanning...' : 'Scan' }}
          </button>
        </form>
        <p v-if="repoStore.error" class="mt-2 text-red-600">{{ repoStore.error }}</p>
      </div>

      <!-- Chat Interface -->
      <div v-if="repoStore.repoInfo" class="bg-white rounded-lg shadow">
        <!-- Repository Info -->
        <div class="border-b border-gray-200 p-4">
          <h2 class="text-lg font-semibold">
            {{ repoStore.repoInfo.owner }}/{{ repoStore.repoInfo.name }}
          </h2>
          <p class="text-gray-600">{{ repoStore.repoInfo.description }}</p>
        </div>

        <!-- Messages -->
        <div class="h-[500px] overflow-y-auto p-4 space-y-4">
          <div
            v-for="message in repoStore.messages"
            :key="message.id"
            :class="[
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-[70%] rounded-lg p-4',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              ]"
            >
              <MarkdownRenderer v-if="message.role === 'assistant'" :content="message.content" />
              <template v-else>{{ message.content }}</template>
            </div>
          </div>
        </div>

        <!-- Query Input -->
        <div class="border-t border-gray-200 p-4">
          <form @submit.prevent="handleQuery" class="flex gap-4">
            <input
              v-model="query"
              type="text"
              placeholder="Ask a question about the repository..."
              class="input flex-1"
              :disabled="repoStore.isLoading"
            />
            <button type="submit" class="btn btn-primary" :disabled="repoStore.isLoading">
              {{ repoStore.isLoading ? 'Processing...' : 'Send' }}
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRepoStore } from './stores/repo';
import MarkdownRenderer from './components/MarkdownRenderer.vue';

const repoStore = useRepoStore();
const query = ref('');

async function handleScan() {
  if (!repoStore.url) return;
  await repoStore.scanRepository(repoStore.url);
}

async function handleQuery() {
  if (!query.value || repoStore.isLoading) return;
  await repoStore.sendQuery(query.value);
  query.value = '';
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
