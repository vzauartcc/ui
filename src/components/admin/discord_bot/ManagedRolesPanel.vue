<script setup lang="ts">
import type {
  IBotConfig,
  IDiscordRole,
  IManagedRole,
} from '@/services/discord/discord.types';
import { Icon } from '@iconify/vue';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { computed, ref } from 'vue';

const props = defineProps<{ config: IBotConfig; allRoles: IDiscordRole[] }>();
const emit = defineEmits(['update:config']);

const localConfig = computed({
  get() {
    return props.config;
  },
  set(newVal) {
    emit('update:config', newVal);
  },
});

const getRoleNameById = (id: string): string => {
  if (!props.allRoles) return '';

  return props.allRoles.find((r) => r.id === id)?.name ?? '';
};

const editRoleVisible = ref(false);
const editRoleData = ref({ index: -1, key: '', roleId: '' });
const loadEditRole = (idx: number, data: IManagedRole) => {
  editRoleData.value = {
    index: idx,
    key: data.key,
    roleId: data.roleId,
  };
  editRoleVisible.value = true;
};
const closeEditRole = () => {
  editRoleData.value = {
    index: -1,
    key: '',
    roleId: '',
  };
  editRoleVisible.value = false;
};
const saveEditRole = () => {
  if (editRoleData.value.key === '' || editRoleData.value.roleId === '') return;

  const updatedVal = { ...localConfig.value };
  if (editRoleData.value.index < 0) {
    updatedVal.managedRoles.push({
      key: editRoleData.value.key,
      roleId: editRoleData.value.roleId,
    });
  } else {
    updatedVal.managedRoles[editRoleData.value.index] = {
      key: editRoleData.value.key,
      roleId: editRoleData.value.roleId,
    };
  }

  localConfig.value = updatedVal;

  closeEditRole();
};

const deleteManagedRole = (idx: number) => {
  const tmp = [...localConfig.value.managedRoles];
  tmp.splice(idx, 1);

  const updatedVal = { ...localConfig.value };
  updatedVal.managedRoles = [...tmp];
  localConfig.value = updatedVal;
};
</script>

<template>
  <AccordionPanel value="0">
    <AccordionHeader>
      <span class="flex justify-between gap-5 items-center"
        ><Icon icon="heroicons:user-plus" /> Managed Roles ({{
          localConfig.managedRoles.length
        }})</span
      ></AccordionHeader
    >
    <AccordionContent>
      <p>
        These roles will be managed by the Discord bot when the user runs the
        <span class="font-mono bg-gray-200 dark:bg-gray-600">/getroles</span>
        command or via the automated role management tasks.
      </p>
      <p>The lookup key should match a website role or VATSIM rating.</p>
      <DataTable :value="localConfig.managedRoles" stripedRows size="small">
        <template #empty
          ><p>There are no managed roles configured.</p></template
        >
        <template #header
          ><div class="flex justify-end">
            <Button label="Add Role" @click="editRoleVisible = true" /></div
        ></template>
        <Column field="key" header="Lookup Key" />
        <Column field="roleId" header="Discord Role">
          <template #body="{ data }"
            ><b>{{ getRoleNameById(data.roleId) }}</b> ({{
              data.roleId
            }})</template
          >
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data, index }">
            <span
              v-tooltip.top="'Edit Managed Role'"
              @click="loadEditRole(index, data)">
              <Icon icon="heroicons:pencil" />
            </span>
            <span
              v-tooltip.top="'Delete Managed Role'"
              @click="deleteManagedRole(index)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>
    </AccordionContent>
  </AccordionPanel>

  <Dialog
    modal
    v-model:visible="editRoleVisible"
    :header="
      editRoleData.index < 0 ? 'Create Managed Role' : 'Edit Managed Role'
    "
    @hide="closeEditRole"
    class="w-1/2">
    <div class="grid grid-cols-2">
      <FloatLabel variant="on">
        <InputText name="webRole" v-model="editRoleData.key" />
        <label for="webRole">Lookup Key</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select
          name="discordRole"
          :options="props.allRoles"
          optionLabel="name"
          optionValue="id"
          v-model="editRoleData.roleId"
          class="w-full"
          filter
          :filterFields="['id', 'name']" />
        <label for="discordRole">Discord Role</label>
      </FloatLabel>
    </div>
    <template #footer>
      <Button label="Save!" @click="saveEditRole" />
      <Button outlined label="Cancel" @click="closeEditRole" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
