<script setup lang="ts">
import { splitService } from '@/services/split/split.service';
import { useSplitStore } from '@/stores/splitMessage';
import { useUserStore } from '@/stores/user';
import { setToastInstance } from '@/utils/toast';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { onMounted, onUnmounted, ref } from 'vue';

const userStore = useUserStore();
const { hasQueryCompleted } = storeToRefs(userStore);

const splitStore = useSplitStore();

const toast = useToast();

const splitInterval = ref<number>(0);
const isSplit = ref(false);

onMounted(() => {
  setToastInstance(toast);

  checkSplit();

  splitInterval.value = setInterval(() => {
    checkSplit();
  }, 60_000);
});
onUnmounted(() => {
  if (splitInterval.value > 0) {
    clearInterval(splitInterval.value);
  }
});

const checkSplit = async () => {
  if (splitStore.isDismissed()) return;

  try {
    const data = await splitService.isSplit();

    isSplit.value = data;
  } catch (e) {
    console.error('error getting split status', e);
  }
};

const dismissSplit = () => {
  splitStore.dismiss();
};
</script>

<template>
  <Toast />
  <template v-if="hasQueryCompleted">
    <Message
      v-if="isSplit && !splitStore.isDismissed()"
      closable
      @close="dismissSplit"
      severity="error"
      class="w-full justify-center"
      >Chicago Center is split! Check out the
      <router-link to="/split" class="underline">split map</router-link>.
    </Message>
    <router-view />
  </template>
  <div v-else id="loading" class="flex justify-center items-center h-screen">
    <div id="loading_box" class="text-center p-3">
      <img
        style="height: 100px"
        src="@/assets/images/Discord_Logo_Two.png"
        alt="Virtual Chicago ARTCC Logo"
        class="mx-auto block" />
      <br />
      <h3>Please Wait...</h3>
      <h5>If stuck load, please reload the page!</h5>
      <ProgressSpinner />
    </div>
  </div>
</template>

<style scoped></style>
