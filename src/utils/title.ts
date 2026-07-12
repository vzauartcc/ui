import { isRef, watch } from 'vue';

export function useTitle(title: string) {
  const updateTitle = (val: string | null) => {
    document.title = val ? `${val} | Chicago ARTCC` : 'Chicago ARTCC';
  };

  if (isRef(title)) {
    watch(title, (newVal: string | null) => updateTitle(newVal), {
      immediate: true,
    });
  } else {
    updateTitle(title);
  }
}
