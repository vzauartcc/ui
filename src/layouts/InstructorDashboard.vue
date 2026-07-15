<script setup lang="ts">
import AppFooter from '@/components/layout/Footer.vue';
import AppHeader from '@/components/layout/Header.vue';
import InstructorMenu from '@/components/menu/InstructorMenu.vue';
</script>

<template>
  <div id="container" class="flex h-screen flex-col">
    <AppHeader />
    <main class="mt-2 flex-1-0-auto my-5 mx-auto md:w-10/12">
      <div class="flex flex-col md:flex-row w-full gap-4">
        <div class="md:w-1/4">
          <InstructorMenu />
        </div>
        <div class="main_content md:w-3/4">
          <router-view></router-view>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style lang="css" scoped></style>
