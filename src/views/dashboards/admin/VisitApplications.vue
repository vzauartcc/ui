<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type {
  IVisitApplication,
  IVisitorApplication,
} from '@/services/controller/controller.types';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import { computed, nextTick, onMounted, ref } from 'vue';

useTitle('Visit Applications');

const visitApplications = ref<IVisitApplication[] | null>(null);

onMounted(async () => {
  try {
    const data = await controllerService.getVisitApplications();

    visitApplications.value = data;
  } catch (e) {
    console.error('error getting visit applications', e);
  }
});

const editVisible = ref(false);
const editData = ref<IVisitApplication | null>(null);
const loadEdit = (data: IVisitApplication) => {
  editData.value = data;
  editVisible.value = true;
};
const getName = computed(() => {
  if (!editData.value) return '';

  return `${editData.value.application.fname} ${editData.value.application.lname}`;
});
const getDate = computed(() => {
  if (!editData.value) return new Date(0);

  return new Date(editData.value.application.createdAt);
});

const ratingConsolidation = computed(
  () => !!editData.value?.statusChecks.ratingConsolidation,
);
const promo = computed(() => !!editData.value?.statusChecks.promo);
const hasRating = computed(() => !!editData.value?.statusChecks.hasRating);
const recentlyRostered = computed(
  () => !!editData.value?.statusChecks.recentlyRostered,
);
const hasHome = computed(() => !!editData.value?.statusChecks.hasHome);
const needsBasic = computed(() => !!editData.value?.statusChecks.needsBasic);

const accept = async () => {
  try {
    await controllerService.acceptVisitApplication(
      editData.value!.application.cid,
    );

    toastSuccess(
      'Visit Application Accepted!',
      `${compileUsersName(editData.value!.application)}'s visit application has been accepted.`,
    );

    editVisible.value = false;

    const data = await controllerService.getVisitApplications();

    visitApplications.value = data;
  } catch (e) {
    console.error('error accepting visit application', e);
  }
};
const reject = async () => {
  rejectData.value = {
    application: { ...editData.value!.application },
    reason: '',
  };

  editData.value = null;
  editVisible.value = false;

  await nextTick();
  rejectVisible.value = true;
};

const close = () => {
  editData.value = null;
  editVisible.value = false;
};

interface IRejectData {
  application: IVisitorApplication;
  reason: string;
}
const rejectVisible = ref(false);
const rejectData = ref<IRejectData | null>(null);

const closeReject = () => {
  rejectData.value = null;
  rejectVisible.value = false;
};
const rejectApplication = async () => {
  if (!rejectData.value || !rejectData.value.reason.trim()) {
    return;
  }

  try {
    await controllerService.rejectVisitApplication(
      rejectData.value.application.cid,
      rejectData.value.reason,
    );

    toastSuccess(
      'Visit Application Rejected!',
      `You have rejected ${compileUsersName(rejectData.value.application)}'s visit application.`,
    );

    closeReject();

    const data = await controllerService.getVisitApplications();

    visitApplications.value = data;
  } catch (e) {
    console.error('error rejecting application', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!visitApplications" />
  <Card v-else>
    <template #title>Pending Visitor Applications</template>
    <template #content>
      <DataTable :value="visitApplications" stripedRows size="small">
        <template #empty
          ><p class="italic">
            There are no visit applications to display.
          </p></template
        >
        <Column field="name" header="Name">
          <template #body="{ data }">
            {{ compileUsersName(data.application) }}
          </template>
        </Column>
        <Column field="rating" header="Rating">
          <template #body="{ data }">
            {{ data.application.rating }}
          </template>
        </Column>
        <Column field="data.application.home" header="Home ARTCC">
          <template #body="{ data }">
            {{ data.application.home }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span v-tooltip.top="'View Application'" @click="loadEdit(data)">
              <Icon icon="heroicons:magnifying-glass" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    modal
    v-model:visible="editVisible"
    class="w-1/2"
    header="Visiting Application"
    @hide="close">
    <div class="grid grid-cols-2 gap-5">
      <FloatLabel variant="on">
        <InputText name="name" v-model="getName" disabled />
        <label for="name">Name</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText
          name="email"
          v-model="editData!.application.email"
          disabled />
        <label for="email">Email</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputNumber
          name="cid"
          v-model="editData!.application.cid"
          :useGrouping="false"
          disabled />
        <label for="cid">CID</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText
          name="rating"
          v-model="editData!.application.rating"
          disabled />
        <label for="rating">Rating</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText name="home" v-model="editData!.application.home" disabled />
        <label for="home">Home Facility</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <DatePicker name="createdAt" v-model="getDate" disabled />
        <label for="createdAt">Submission Date</label>
      </FloatLabel>

      <div class="col-span-2">
        <FloatLabel variant="on">
          <Textarea
            name="reason"
            v-model="editData!.application.reason"
            disabled
            class="w-full" />
          <label for="reason">Reason to Visit</label>
        </FloatLabel>
      </div>
    </div>

    <Divider />

    <div class="flex flex-col gap-5">
      <div class="gap-5">
        <Icon
          :icon="`heroicons:${ratingConsolidation ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !ratingConsolidation,
            'text-green-500': ratingConsolidation,
          }" />
        <span>Rating Consolidation (50 hours in rating)</span>
      </div>

      <div>
        <Icon
          :icon="`heroicons:${promo ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !promo,
            'text-green-500': promo,
          }" />
        <span>90 days in rating</span>
      </div>

      <div>
        <Icon
          :icon="`heroicons:${hasRating ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !hasRating,
            'text-green-500': hasRating,
          }" />
        <span>S3+ Rating</span>
      </div>

      <div>
        <Icon
          :icon="`heroicons:${recentlyRostered ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !recentlyRostered,
            'text-green-500': recentlyRostered,
          }" />
        <span>60 days since added to a VATUSA subdivision</span>
      </div>

      <div>
        <Icon
          :icon="`heroicons:${hasHome ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !hasHome,
            'text-green-500': hasHome,
          }" />
        <span>Has Home Facility</span>
      </div>

      <div>
        <Icon
          :icon="`heroicons:${needsBasic ? 'check' : 'x-mark'}`"
          :class="{
            'text-red-500': !needsBasic,
            'text-green-500': needsBasic,
          }" />
        <span>Needs Basic Training</span>
      </div>

      <Message severity="success" v-if="editData!.statusChecks.visiting">
        Meets VATUSA requirements.
      </Message>
      <Message severity="warn" v-else>
        Does not meet VATUSA requirements.
      </Message>
    </div>

    <template #footer>
      <Button severity="success" label="Accept" @click="accept" />
      <Button severity="danger" label="Reject" @click="reject" />
      <Button outlined label="Cancel" @click="close" />
    </template>
  </Dialog>

  <Dialog
    modal
    v-model:visible="rejectVisible"
    header="Reject Visitor Application"
    @hide="closeReject">
    <p>
      This will reject <b>{{ compileUsersName(rejectData!.application) }}</b
      >'s visit application. You must provide a reason, which will be visible to
      the applicant.
    </p>
    <FloatLabel variant="on">
      <Textarea
        name="rejectReason"
        v-model="rejectData!.reason"
        class="w-full" />
      <label for="rejectReason">Reason</label>
    </FloatLabel>
    <template #footer>
      <Button severity="danger" label="Reject" @click="rejectApplication" />
      <Button outlined label="Cancel" @click="closeReject" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
