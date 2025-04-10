<template>
  <div class="file-structure bg-gray-800 text-white p-4 rounded-lg">
    <div v-for="item in fileStructure" :key="item.path" class="item mb-1">
      <div 
        @click="toggleExpand(item)" 
        class="item-header flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
      >
        <span v-if="item.type === 'dir'" class="arrow mr-2 text-blue-400 w-4 text-center">
          {{ item.expanded ? '▼' : '▶' }}
        </span>
        <span v-else class="mr-2 text-gray-400 w-4 text-center">
          <span class="text-xs">•</span>
        </span>
        <span :class="{ 'font-bold text-blue-400': item.type === 'dir' }">
          {{ item.name }}
        </span>
      </div>
      <div v-if="item.type === 'dir' && item.expanded" class="children pl-4 ml-2 border-l border-gray-700 mt-1">
        <!-- Recursively display children if any -->
        <div v-for="child in item.children" :key="child.path" class="item mb-1">
          <div 
            @click="toggleExpand(child)" 
            class="item-header flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
          >
            <span v-if="child.type === 'dir'" class="arrow mr-2 text-blue-400 w-4 text-center">
              {{ child.expanded ? '▼' : '▶' }}
            </span>
            <span v-else class="mr-2 text-gray-400 w-4 text-center">
              <span class="text-xs">•</span>
            </span>
            <span :class="{ 'font-bold text-blue-400': child.type === 'dir' }">
              {{ child.name }}
            </span>
          </div>
          <div v-if="child.type === 'dir' && child.expanded" class="children pl-4 ml-2 border-l border-gray-700 mt-1">
            <FileStructureRecursive :files="child.children || []" @toggle-expand="toggleExpand" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType, defineAsyncComponent } from 'vue';

// Lazily load recursive component to avoid circular reference issue
const FileStructureRecursive = defineAsyncComponent(() => 
  import('./FileStructureRecursive.vue')
);

interface FileStructureItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: FileStructureItem[];
  expanded?: boolean;
}

defineProps({
  fileStructure: {
    type: Array as PropType<FileStructureItem[]>,
    required: true,
    default: () => []
  }
});

const toggleExpand = (item: FileStructureItem) => {
  if (item.type === 'dir') {
    item.expanded = !item.expanded;
  }
};
</script>

<style scoped>
.file-structure {
  min-width: 250px;
  max-width: 300px;
  max-height: 80vh;
  overflow-y: auto;
}

.file-structure::-webkit-scrollbar {
  width: 8px;
}

.file-structure::-webkit-scrollbar-track {
  background: #1f2937;
}

.file-structure::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.file-structure::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style> 