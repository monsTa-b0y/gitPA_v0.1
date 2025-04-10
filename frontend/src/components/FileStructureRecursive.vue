<template>
  <div>
    <div v-for="file in files" :key="file.path" class="item mb-1">
      <div 
        @click="handleToggle(file)" 
        class="item-header flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
      >
        <span v-if="file.type === 'dir'" class="arrow mr-2 text-blue-400 w-4 text-center">
          {{ file.expanded ? '▼' : '▶' }}
        </span>
        <span v-else class="mr-2 text-gray-400 w-4 text-center">
          <span class="text-xs">•</span>
        </span>
        <span :class="{ 'font-bold text-blue-400': file.type === 'dir' }">
          {{ file.name }}
        </span>
      </div>
      <div v-if="file.type === 'dir' && file.expanded" class="children pl-4 ml-2 border-l border-gray-700 mt-1">
        <FileStructureRecursive :files="file.children || []" @toggle-expand="handleToggle" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';

interface FileStructureItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: FileStructureItem[];
  expanded?: boolean;
}

const props = defineProps({
  files: {
    type: Array as PropType<FileStructureItem[]>,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['toggle-expand']);

const handleToggle = (file: FileStructureItem) => {
  emit('toggle-expand', file);
};
</script> 