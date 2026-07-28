<script setup lang="ts">
import TrainingWaitlist from '@/components/training/TrainingWaitlist.vue';
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { trainingService } from '@/services/training/training.service';
import type {
  IInstructor,
  ITrainingWaitlist,
} from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Training Waitlist');

const router = useRouter();

const userStore = useUserStore();

const waitlist = ref<ITrainingWaitlist[] | null>(null);
const endorsements = ref<ICertification[] | null>(null);
const instructors = ref<IInstructor[] | null>(null);

onMounted(async () => {
  try {
    const data = await trainingService.getWaitlist();

    waitlist.value = data;
  } catch (e) {
    console.error('error getting waitlist', e);
  }

  try {
    const data = await trainingService.getInstructors();

    instructors.value = data.sort((a, b) => a.cid - b.cid);
  } catch (e) {
    console.error('error getting instructors', e);
  }

  try {
    const data = await controllerService.getCertifications();

    endorsements.value = data.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('error getting certifications', e);
  }
});

const filterWaitlist = (instructor: number, milestone: string) => {
  if (!waitlist.value) return [];

  let tmp = [...waitlist.value];

  if (instructor > 0) {
    tmp = tmp.filter((w) => w.instructorCid === instructor);
  }

  if (milestone) {
    tmp = tmp.filter((w) => w.certCode === milestone);
  }

  return tmp;
};

const handleNewEntry = () => {
  router.push('/ins/waitlist/new');
};
</script>

<template>
  <ProgressSpinner v-if="!waitlist" />
  <Card v-else>
    <template #title>Training Waitlist</template>
    <template #content>
      <Button
        v-if="userStore.isSeniorStaff"
        label="New Entry"
        severity="success"
        @click.prevent="handleNewEntry" />
      <Tabs value="0">
        <TabList>
          <Tab value="0">Waitlist</Tab>
          <Tab value="1" v-if="instructors">By Instructor</Tab>
          <Tab value="2" v-if="endorsements">By Endorsement</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <TrainingWaitlist :waitlist="waitlist" showStats />
          </TabPanel>
          <TabPanel value="1" v-if="instructors">
            <Accordion multiple>
              <AccordionPanel
                v-for="(instructor, idx) of instructors"
                :key="idx"
                :value="idx">
                <AccordionHeader
                  >{{ instructor.name }} ({{
                    filterWaitlist(instructor.cid, '').length
                  }})</AccordionHeader
                >

                <AccordionContent>
                  <TrainingWaitlist
                    :waitlist="filterWaitlist(instructor.cid, '')" />
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </TabPanel>
          <TabPanel value="2" v-if="endorsements">
            <Accordion multiple>
              <AccordionPanel
                v-for="(endorsement, idx) of endorsements"
                :key="idx"
                :value="idx">
                <AccordionHeader
                  >{{ endorsement.name }} ({{
                    filterWaitlist(0, endorsement.code).length
                  }})</AccordionHeader
                >

                <AccordionContent>
                  <TrainingWaitlist
                    :waitlist="filterWaitlist(0, endorsement.code)" />
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
