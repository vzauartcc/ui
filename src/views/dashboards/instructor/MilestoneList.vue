<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { trainingService } from '@/services/training/training.service';
import type { ITrainingMilestone } from '@/services/training/training.types';
import { ratingShort } from '@/utils/ratings';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { capitalize, onMounted, ref } from 'vue';

useTitle('Manage Milestones');

const milestones = ref<Record<string, ITrainingMilestone[]>>({});
const milestoneTypes = ref<string[]>([]);
const endorsements = ref<ICertification[]>([]);

const visible = ref(false);
const edit = ref({
  id: '',
  code: '',
  name: '',
  endorsement: '',
  type: '',
  rating: 1,
  active: true,
});

onMounted(async () => {
  await getMilestones();

  try {
    const data = await controllerService.getCertifications();

    endorsements.value = data;
  } catch (e) {
    console.error('error getting certifications', e);
  }
});

const getMilestones = async () => {
  try {
    const data = await trainingService.getMilestones();

    milestoneTypes.value = data.milestoneTypes;
    data.milestoneTypes.forEach((mt) => {
      milestones.value[mt] = data.milestones
        .filter((m) => m.type === mt)
        .sort((a, b) => a.order - b.order);
    });
  } catch (e) {
    console.error('error getting milestones', e);
  }
};

const updateMilestones = async (newArray: ITrainingMilestone[]) => {
  try {
    await trainingService.reorderMilestones(newArray);

    getMilestones();
  } catch (e) {
    console.error('error updating milestone order', e);
  }
};

const moveUp = (id: string, milestoneType: string) => {
  const retval: ITrainingMilestone[] = Array.from({
    length: milestones.value[milestoneType]!.length,
  });

  const type = milestones.value[milestoneType];
  if (!type) return;

  for (let i = type.length - 1; i >= 0; i--) {
    const el = type[i]!;
    if (i === 0 && el._id === id) {
      return;
    }

    if (el._id === id) {
      retval[i] = type[i - 1]!;
      retval[i - 1] = type[i]!;
      i--;
    } else {
      retval[i] = el;
    }
  }

  updateMilestones(retval);
};

const moveDown = (id: string, milestoneType: string) => {
  const retval: ITrainingMilestone[] = [];

  const type = milestones.value[milestoneType];
  if (!type) return;

  for (let i = 0; i < type.length; i++) {
    const el = type[i]!;
    if (i === type.length - 1 && el._id === id) {
      return;
    }

    if (el._id === id) {
      retval.push(type[i + 1]!);
      retval.push(type[i]!);
      i++;
    } else {
      retval.push(el);
    }
  }

  updateMilestones(retval);
};

const loadEdit = (milestone: ITrainingMilestone) => {
  edit.value = {
    id: milestone._id,
    code: milestone.code,
    name: milestone.name,
    rating: milestone.rating,
    endorsement: milestone.certCode,
    type: milestone.type,
    active: milestone.isActive,
  };

  visible.value = true;
};

const closeModal = () => {
  visible.value = false;

  edit.value = {
    id: '',
    code: '',
    name: '',
    endorsement: '',
    type: '',
    rating: 1,
    active: true,
  };
};

const saveEdit = async () => {
  const values = edit.value;
  try {
    if (values.id) {
      await trainingService.editMilestone(values.id, {
        code: values.code.toUpperCase(),
        name: values.name,
        certCode: values.endorsement.toLowerCase(),
        type: values.type,
        rating: values.rating,
        isActive: values.active,
      });
    } else {
      await trainingService.createMilestone({
        code: values.code.toUpperCase(),
        name: values.name,
        certCode: values.endorsement.toLowerCase(),
        type: values.type,
        rating: values.rating,
        isActive: values.active,
      });
    }
  } catch (e) {
    console.error('error saving milestone edit', e);
    return;
  }

  getMilestones();
};
</script>

<template>
  <ProgressSpinner v-if="!milestoneTypes" />
  <Card v-else>
    <template #title>Training Milestones</template>
    <template #content>
      <Button
        @click="visible = true"
        label="Create Milestone"
        severity="success" />
      <Tabs value="0">
        <TabList>
          <Tab v-for="(type, idx) of milestoneTypes" :value="idx" :key="idx"
            >{{ capitalize(type) }} Milestones</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel
            v-for="(type, idx) of milestoneTypes"
            :value="idx"
            :key="idx">
            <DataTable :value="milestones[type]" stripedRows size="small">
              <template #empty
                ><p>There are no milestones to display.</p></template
              >
              <Column field="code" header="Code" />
              <Column field="name" header="Name" />
              <Column
                field="certCode"
                header="Associated Endorsement"
                headerClass="w-min"
                bodyClass="w-min">
                <template #body="{ data }">
                  <span
                    v-if="endorsements?.find((e) => e.code === data.certCode)">
                    {{
                      endorsements.find((e) => e.code === data.certCode)!.name
                    }}
                  </span>
                  <span v-else>{{ data.certCode }}</span>
                </template>
              </Column>
              <Column
                field="rating"
                header="Associated Rating"
                headerClass="w-min"
                bodyClass="w-min">
                <template #body="{ data }">
                  {{ ratingShort[data.rating] }}
                </template>
              </Column>
              <Column field="isActive" header="Active">
                <template #body="{ data }">
                  {{ data.isActive ? 'Yes' : 'No' }}
                </template>
              </Column>
              <Column
                field="options"
                header="Options"
                bodyClass="text-right"
                headerClass="text-right">
                <template #body="{ data }">
                  <span
                    @click="moveUp(data._id, type)"
                    v-if="data.order > 0"
                    v-tooltip.top="'Move Up'">
                    <Icon icon="heroicons:arrow-up" />
                  </span>
                  <span
                    @click="moveDown(data._id, type)"
                    v-if="data.order < milestones[type]!.length - 1"
                    v-tooltip.top="'Move Down'">
                    <Icon icon="heroicons:arrow-down" />
                  </span>
                  <span
                    @click="loadEdit(data)"
                    v-tooltip.top="'Edit Milestone'">
                    <Icon icon="heroicons:pencil" />
                  </span>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>

  <Dialog
    v-model:visible="visible"
    modal
    header="Edit Milestone"
    class="w-1/2"
    @hide="closeModal">
    <div class="grid grid-cols-1 gap-3 my-3">
      <FloatLabel variant="on">
        <InputText
          name="code"
          v-model="edit.code"
          :maxlength="4"
          :disabled="!!edit.id"
          class="w-full" />
        <label for="code">Short code (4 chars max). Cannot be modified.</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText name="name" v-model="edit.name" class="w-full" />
        <label for="name">Display Name</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          name="type"
          v-model="edit.type"
          class="w-1/2"
          :options="milestoneTypes"
          :optionLabel="(val) => capitalize(val)" />
        <label for="type">Milestone Type</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          name="endorsement"
          v-model="edit.endorsement"
          class="w-1/2"
          :options="endorsements"
          optionLabel="name"
          optionValue="code" />
        <label for="endorsement">Associated Endorsement</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          name="rating"
          v-model="edit.rating"
          class="w-1/2"
          :options="ratingShort"
          :optionValue="(option) => ratingShort.indexOf(option)" />
        <label for="rating">Associated Rating</label>
      </FloatLabel>
      <template v-if="edit.id">
        <div class="flex flex-row gap-2">
          <Checkbox v-model="edit.active" binary size="large" />
          <span>Active</span>
        </div>
        <span>Milestones cannot be deleted, only deactivated.</span>
      </template>
    </div>
    <template #footer>
      <Button @click="saveEdit" label="Save" />
      <Button @click="closeModal" outlined label="Cancel" severity="contrast" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
