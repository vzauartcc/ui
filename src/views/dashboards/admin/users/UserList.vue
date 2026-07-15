<script setup lang="ts">
import UserDetails from '@/components/admin/UserDetails.vue';
import { userService } from '@/services/user/user.service';
import type { IUser } from '@/services/user/user.types';
import { dateAsMMDD } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Users');

const users = ref<IUser[] | null>(null);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(async () => {
  getUsers();
});

const getUsers = async () => {
  try {
    const data = await userService.getUsers();

    const tmp = [...data.home, ...data.visiting, ...data.removed];

    users.value = tmp
      .sort(
        (a, b) =>
          a.lname.localeCompare(b.lname) ||
          a.fname.localeCompare(b.fname) ||
          a.cid - b.cid,
      )
      .filter((u) => u.cid > 0);
  } catch (e) {
    console.error('error getting users', e);
  }
};

const deleteVisible = ref(false);
const deleteData = ref<IUser | null>(null);
const loadDelete = (data: IUser) => {
  deleteData.value = data;
  deleteVisible.value = true;
};

const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = null;
};

const doDelete = async () => {
  if (!deleteData.value) return;

  try {
    await userService.deleteUser(deleteData.value.cid);

    toastSuccess('User Deleted!', 'User deleted successfully!');
    closeDelete();
    getUsers();
  } catch (e) {
    console.error('error deleting user', e);
  }
};

const detailsVisible = ref(false);
const details = ref<IUser | null>(null);
const showDetails = (data: IUser) => {
  details.value = data;
  detailsVisible.value = true;
};
</script>

<template>
  <ProgressSpinner v-if="!users" />
  <Card v-else>
    <template #title>User</template>
    <template #subtitle>
      <p>
        Please use the
        <router-link to="/admin/controllers" class="underline"
          >Roster Management</router-link
        >
        page to manage the roster.
      </p>
    </template>
    <template #content>
      <DataTable
        :value="users"
        stripedRows
        v-model:filters="filters"
        :globalFilterFields="['name', 'cid', 'oi']"
        size="small">
        <template #header>
          <div class="flex justify-end">
            <FloatLabel variant="over">
              <IconField>
                <InputIcon>
                  <Icon class="no-pointer" icon="heroicons:magnifying-glass" />
                </InputIcon>
                <InputText
                  v-model="filters['global'].value"
                  id="globalSearch"
                  placeholder="Search . . ." />
                <label for="globalSearch"
                  >Search by Name, CID, or Operating Initials</label
                >
                <InputIcon
                  v-if="filters['global'].value"
                  @click="filters['global'].value = null"
                  class="pointer-events-auto inline-flex absolute right-3 z-10">
                  <Icon icon="heroicons:x-mark" />
                </InputIcon>
              </IconField>
            </FloatLabel>
          </div>
        </template>
        <template #empty>
          <p>Controller not found</p>
        </template>
        <Column field="name" header="Name" sortable>
          <template #body="{ data }">
            <router-link :to="`/controllers/${data.cid}`">
              <span class="font-bold">{{ data.name }} ({{ data.oi }})</span>
              <br />
              <span>{{ data.ratingLong }}</span>
            </router-link>
          </template>
        </Column>
        <Column field="vis" bodyClass="w-min" sortable class="w-min">
          <template #body="{ data }">
            <span
              class="inline-flex"
              v-tooltip.top="
                `${data.vis === false ? 'Home' : 'Visiting'} Controller`
              ">
              <Icon
                v-if="data.vis === false && data.member === true"
                icon="heroicons:home"
                class="no-pointer" />
              <Icon
                v-else-if="data.vis === true && data.member === true"
                icon="heroicons:briefcase"
                class="no-pointer" />
            </span>
          </template>
        </Column>
        <Column field="cid" sortable header="CID" />
        <Column field="joinDate" sortable header="Join Date">
          <template #body="{ data }">
            {{ dateAsMMDD(data.joinDate) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          bodyClass="text-right"
          headerClass="text-right">
          <template #body="{ data }">
            <span v-tooltip.top="'View Details'" @click="showDetails(data)">
              <Icon icon="heroicons:magnifying-glass" />
            </span>
            <router-link
              :to="`/admin/controllers/${data.cid}`"
              v-tooltip.top="'Edit Controller'">
              <Icon icon="heroicons:pencil" class="" />
            </router-link>
            <span v-tooltip.top="'Erase User'" @click="loadDelete(data)">
              <Icon
                icon="heroicons:shield-exclamation-solid"
                class="text-red-500 text-2xl!" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    modal
    v-model:visible="deleteVisible"
    class="w-1/2"
    @hide="closeDelete"
    header="Permanently Delete User">
    <p>
      Please confirm that you would like to
      <b
        ><span class="text-red-500">permanently delete</span>
        {{ deleteData?.name }}</b
      >. This will remove them and all of their associated data from the Chicago
      ARTCC. Documents, Downloads, Events, and Training Sessions submitted as an
      instructor will be retained and reassigned to the placeholder user.
    </p>
    <template #footer>
      <Button severity="danger" label="Delete" @click="doDelete" />
      <Button outlined label="Cancel" @click="closeDelete" />
    </template>
  </Dialog>

  <UserDetails v-model:visible="detailsVisible" :user="details" />
</template>

<style lang="css" scoped>
:deep(.p-card-subtitle) {
  color: unset;
}
</style>
