<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import { useTitle } from '@/utils/title';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, onMounted, ref } from 'vue';

useTitle('Available Operating Initials');

const available = ref<string[] | null>(null);

onMounted(async () => {
  try {
    const data = await controllerService.getTakenOperatingInitials();

    const combinations: string[] = Array.from({ length: 676 });
    let index = 0;

    // Generate all possible operating initials.
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        combinations[index++] = String.fromCharCode(i, j);
      }
    }

    // Filter out initials not returned by API.
    available.value = combinations.filter((x) => !data.includes(x));
  } catch (e) {
    console.error('error getting operating initials', e);
  }
});

const groupByLetter = computed(() => {
  if (!available.value) return {};

  return available.value.reduce((acc: Record<string, string[]>, oi: string) => {
    const letter = oi.charAt(0);
    if (!acc[letter]) {
      const tmp: string[] = [];
      acc[letter] = tmp;
    }
    acc[letter].push(oi);
    return acc;
  }, {});
});
</script>

<template>
  <ProgressSpinner v-if="!available" />
  <Card v-else>
    <template #title>Available Operating Initials</template>
    <template #subtitle>
      If you would like to change your operating initials, please reach out to
      the ATM or DATM with your requested initials. They reserve the right to
      deny your request for any reason.
    </template>
    <template #content>
      <Accordion multiple>
        <AccordionPanel
          v-for="(oi, letter) in groupByLetter"
          :key="letter"
          :value="letter">
          <AccordionHeader>{{ letter }} ({{ oi.length }})</AccordionHeader>
          <AccordionContent>
            <div class="grid grid-cols-7 md:grid-cols-13">
              <span v-for="i in oi" :key="i">{{ i }}</span>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
