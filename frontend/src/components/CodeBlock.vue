<template>
  <div class="bg-gray-800 rounded-lg my-4 overflow-hidden">
    <div class="flex items-center justify-between bg-gray-700 px-4 py-2 rounded-t-lg">
      <span class="text-sm text-gray-300">{{ fileName }}</span>
      <button 
        @click="copyToClipboard" 
        class="text-gray-300 hover:text-white text-sm"
      >
        {{ copyButtonText }}
      </button>
    </div>
    <div class="max-h-[500px] overflow-auto min-w-0">
      <pre class="p-4 whitespace-pre-wrap break-words"><code class="text-sm text-left block">{{ content }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  content: string;
  fileName: string;
}>();

const copyButtonText = ref('Copy');

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.content);
    copyButtonText.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
pre {
  font-family: 'Fira Code', monospace;
  margin: 0;
  /* white-space is now handled by Tailwind class */
  /* word-break is now handled by Tailwind class */
}

code {
  display: block;
  text-align: left;
}

/* Custom scrollbar styles */
div.max-h-\[500px\]::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

div.max-h-\[500px\]::-webkit-scrollbar-track {
  background: #2d3748;
  border-radius: 4px;
}

div.max-h-\[500px\]::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 4px;
}

div.max-h-\[500px\]::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

/* Firefox scrollbar */
div.max-h-\[500px\] {
  scrollbar-width: thin;
  scrollbar-color: #4a5568 #2d3748;
}
</style> 