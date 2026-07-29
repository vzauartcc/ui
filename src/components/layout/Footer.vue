<script setup lang="ts">
import { getS3Url } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import { onMounted, onUnmounted, ref } from 'vue';

const s3Url = getS3Url();

const zuluTime = ref('');

let timer: number | null = null;

const updateTime = () => {
  zuluTime.value = ` Time now: ${new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })}z`;
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <footer class="bg-bg-5 text-white">
    <div class="md:w-10/12 mx-auto text-center">
      <div class="m-5">
        <p>
          This site is not affiliated with the FAA, or any governing aviation
          body. All content contained herein is approved only for use on the
          VATSIM network.
        </p>
      </div>
      <div class="flex justify-center items-center">
        <div class="grid md:grid-cols-3 gap-4">
          <router-link to="/" class="flex justify-center">
            <img
              class="h-16 object-contain"
              :src="`${s3Url}/site-logo/Main-Logo.png`"
              draggable="false"
              alt="Virtual Chicago ARTCC Logo" />
          </router-link>
          <a href="https://vatusa.net" class="flex justify-center">
            <img
              class="h-16 object-contain"
              :src="`${s3Url}/site-logo/vatusa.svg`"
              :draggable="false"
              alt="VATUSA Subdivision Logo" />
          </a>
          <a href="https://vatsim.net" class="flex justify-center">
            <img
              class="h-16 object-contain"
              :src="`${s3Url}/site-logo/vatsim.png`"
              :draggable="false"
              alt="VATSIM Network Logo" />
          </a>
        </div>
      </div>

      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 my-5 text-sm text-center">
        <div class="">
          Copyright &copy; {{ new Date().getFullYear() }} Virtual Chicago ARTCC
        </div>

        <div class="hidden sm:block">•</div>

        <div class="font-bold">
          <router-link to="/privacy-policy"> Privacy Policy </router-link>
        </div>

        <div class="hidden sm:block">•</div>

        <div class="inline-flex items-center gap-1">
          Open source on
          <a
            href="https://github.com/vzauartcc"
            class="inline-flex gap-1 items-center text-white"
            target="_blank"
            rel="noopener noreferrer">
            <Icon icon="mdi:github" class="text-lg! mt-0!" />
            <span>GitHub</span>
          </a>
        </div>

        <div class="hidden sm:block">•</div>

        <div class="inline-flex items-center">{{ zuluTime }}</div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="css"></style>
