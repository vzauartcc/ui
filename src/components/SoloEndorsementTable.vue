<script setup lang="ts">
import { trainingService } from '@/services/training/training.service';
import type { ISoloEndorsement } from '@/services/training/training.types';
import { dateAsMMDD, localToUTC, utcToLocal } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = withDefaults(
  defineProps<{
    endorsements: ISoloEndorsement[];
    active?: boolean;
  }>(),
  { active: false },
);

const editVisible = ref(false);
const deleteVisible = ref(false);

const editVal = ref({
  _id: '',
  name: '',
  position: '',
  issuedAt: new Date(0),
  expires: new Date(0),
  newExpiration: new Date(1),
  acknowledgement: false,
  maxExpiration: new Date(1),
});
const deleteVal = ref<ISoloEndorsement | null>(null);

const loadDelete = (endorsement: ISoloEndorsement) => {
  deleteVal.value = endorsement;
  deleteVisible.value = true;
};

const loadEdit = (endorsement: ISoloEndorsement) => {
  editVal.value = {
    _id: endorsement._id,
    name: compileUsersName(endorsement.student),
    position: endorsement.position,
    issuedAt: utcToLocal(endorsement.createdAt),
    expires: utcToLocal(endorsement.expires),
    newExpiration: getMaxExpiration(endorsement.createdAt),
    maxExpiration: getMaxExpiration(endorsement.createdAt),
    acknowledgement: false,
  };

  editVisible.value = true;
};

const clearDelete = () => {
  deleteVisible.value = false;

  deleteVal.value = null;
};

const clearEdit = () => {
  editVisible.value = false;

  editVal.value = {
    _id: '',
    name: '',
    position: '',
    issuedAt: new Date(0),
    expires: new Date(0),
    newExpiration: new Date(1),
    acknowledgement: false,
    maxExpiration: new Date(1),
  };
};

const saveEdit = async () => {
  if (!editVal.value._id) {
    return;
  }

  const values = editVal.value;

  try {
    await trainingService.editSoloEndorsement(values._id, {
      expirationDate: localToUTC(values.newExpiration),
      confirmation: values.acknowledgement,
    });

    toastSuccess(
      'Solo Endorsement Updated!',
      `${values.name}'s solo endorsement has been updated.`,
    );
    clearEdit();
  } catch (e) {
    console.error('error updating solo endorsement', e);
  }
};

const deleteEndorsement = async () => {
  if (!deleteVal.value || !deleteVal.value._id) {
    return;
  }
  try {
    await trainingService.deleteSoloEndorsement(deleteVal.value._id);

    toastSuccess(
      'Solo Endorsement Revoked!',
      `Successfully revoked solo endorsement.`,
    );

    router.replace('/ins/solo');
  } catch (e) {
    console.error('error deleting solo endorsement', e);
  }
};

const getMaxExpiration = (issuedAt: string): Date => {
  const now = new Date(issuedAt);

  now.setDate(now.getDate() + 90);

  return now;
};
</script>

<template>
  <DataTable :value="props.endorsements" stripedRows size="small">
    <template #empty
      ><p>There are no solo endorsements to display.</p></template
    >

    <Column field="student" header="Controller">
      <template #body="{ data }">{{ compileUsersName(data.student) }}</template>
    </Column>
    <Column field="instructor" header="Instructor">
      <template #body="{ data }">
        <span v-if="data.instructor">{{
          compileUsersName(data.instructor)
        }}</span>
        <span v-else>Unknown</span>
      </template>
    </Column>
    <Column field="position" header="Position" />
    <Column field="expires" :header="`Expire${props.active ? 's' : 'd'} On`">
      <template #body="{ data }">
        {{ dateAsMMDD(data.expires) }}
      </template>
    </Column>
    <Column
      field="options"
      header="Options"
      v-if="props.active"
      headerClass="text-right"
      bodyClass="text-right">
      <template #body="{ data }">
        <span
          v-tooltip.top="'Edit Endorsement'"
          @click.prevent="loadEdit(data)">
          <Icon icon="heroicons:pencil" />
        </span>
        <span
          v-tooltip.top="'Revoke Endorsement'"
          @click.prevent="loadDelete(data)"
          class="text-red-500">
          <Icon icon="heroicons:trash" />
        </span>
      </template>
    </Column>
    <template #footer>
      <Button
        severity="success"
        label="New Solo Endorsement"
        @click="router.push('/ins/solo/new')"
        v-if="props.active" />
    </template>
  </DataTable>
  <Dialog
    v-model:visible="editVisible"
    modal
    class="w-1/2"
    header="Edit Solo Endorsement"
    @hide="clearEdit">
    <p>
      Solo endorsements may be extended up to <b>one time</b> with prior
      approval from VATUSA.
    </p>
    <p>
      Solo endorsements may not be extended beyond <b>90 days</b> from the date
      of issuance.
    </p>

    <div class="grid grid-cols-1 gap-5">
      <FloatLabel variant="on">
        <InputText v-model="editVal.name" disabled name="student" />
        <label for="student">Student Name</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText v-model="editVal.position" disabled name="position" />
        <label for="position">Position</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <DatePicker
          v-model="editVal.issuedAt"
          disabled
          dateFormat="mm/dd/y"
          name="issued" />
        <label for="issued">Issued On</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <DatePicker v-model="editVal.expires" disabled name="current" />
        <label for="current">Current Expiration</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <DatePicker
          v-model="editVal.newExpiration"
          :maxDate="editVal.maxExpiration"
          :minDate="editVal.expires"
          name="new" />
        <label for="new">New Expiration</label>
      </FloatLabel>

      <div class="flex flex-row gap-2">
        <Checkbox v-model="editVal.acknowledgement" binary />
        <span
          >I acknowledge that by submitting this extension, VATUSA has approved
          of this Solo Endorsement extension per VATUSA DP002.</span
        >
      </div>
    </div>
    <template #footer>
      <Button
        label="Save"
        @click="saveEdit"
        :disabled="!editVal.acknowledgement" />
      <Button label="Cancel" @click="clearEdit" severity="secondary" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="deleteVisible"
    modal
    class="w-1/2"
    header="Revoke Solo Endorsement"
    @hide="clearDelete">
    <p>
      Are you sure you want to revoke
      <b>{{ compileUsersName(deleteVal?.student) }}</b
      >'s solo endorsement to control <b>{{ deleteVal!.position }}</b
      >?
    </p>
    <template #footer>
      <Button label="Revoke" @click="deleteEndorsement" severity="danger" />
      <Button label="Cancel" @click="clearDelete" severity="secondary" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
