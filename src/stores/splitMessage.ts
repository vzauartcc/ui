import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSplitStore = defineStore('split', () => {
  const dismissed = ref(false);

  const isDismissed = computed(() => (): boolean => dismissed.value === true);

  const dismiss = () => {
    dismissed.value = true;
  };

  return {
    isDismissed,
    dismiss,
  };
});
