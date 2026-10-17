<script setup lang="ts">
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { controllerService } from '@/services/controller/controller.service';
import type {
  IVisitApplication,
  IVisitorApplication,
} from '@/services/controller/controller.types';
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Fieldset from 'primevue/fieldset';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import Timeline from 'primevue/timeline';
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

interface IHistory {
  date: Date;
  reason: string;
  isStart: boolean;
}
const history = computed(() => {
  const userHistory = editData.value?.application.user?.history;

  if (!userHistory || userHistory.length === 0) return [];

  const sorted = [...userHistory].sort(
    (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
  );

  const tmp: IHistory[] = [];

  sorted.forEach((h) => {
    tmp.push({
      date: new Date(h.start),
      reason: 'Transferred into facility',
      isStart: true,
    });

    tmp.push({
      date: new Date(h.end),
      reason: h.reason,
      isStart: false,
    });
  });

  return tmp;
});

const accept = async () => {
  if (!editData.value) return;
  const id = editData.value.application._id;
  const name = compileUsersName(editData.value.application);

  await executeAccept(async () => {
    const response = await controllerService.acceptVisitApplication(id);

    if (response.message !== '') {
      alert(response.message);
    }

    toastSuccess(
      'Visit Application Accepted!',
      `${name}'s visit application has been accepted.`,
    );

    editVisible.value = false;

    const data = await controllerService.getVisitApplications();

    visitApplications.value = data;
  });
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

const { isSubmitting: isAccepting, execute: executeAccept } = useAsyncSubmit();
const { isSubmitting: isRejecting, execute: executeReject } = useAsyncSubmit();

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

  const application = rejectData.value.application;
  const name = compileUsersName(application);
  const reason = rejectData.value.reason;

  await executeReject(async () => {
    await controllerService.rejectVisitApplication(application._id, reason);

    toastSuccess(
      'Visit Application Rejected!',
      `You have rejected ${name}'s visit application.`,
    );

    closeReject();

    const data = await controllerService.getVisitApplications();

    visitApplications.value = data;
  });
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
    dismissableMask
    v-model:visible="editVisible"
    class="w-1/2"
    header="Visiting Application"
    @hide="close">
    <div class="grid grid-cols-2 gap-5">
      <Fieldset legend="Name">
        <span>{{ getName }}</span>
      </Fieldset>

      <Fieldset legend="Email">
        <span>{{ editData!.application.email }}</span>
      </Fieldset>

      <Fieldset legend="CID">
        <span>{{ editData!.application.cid }}</span>
      </Fieldset>

      <Fieldset legend="Rating">
        <span>{{ editData!.application.rating }}</span>
      </Fieldset>

      <Fieldset legend="Home Facility">
        <span>{{ editData!.application.home }}</span>
      </Fieldset>

      <Fieldset legend="Submission Date">
        <span>{{ dateAsMMDD(getDate) }}</span>
      </Fieldset>

      <div class="col-span-2">
        <Fieldset legend="Reason to Visit">
          <span class="whitespace-pre-line break-words">{{
            editData!.application.reason
          }}</span>
        </Fieldset>
      </div>
    </div>

    <Divider />

    <Accordion>
      <AccordionPanel value="0" v-if="history.length > 0">
        <AccordionHeader>Facility History</AccordionHeader>
        <AccordionContent>
          <Timeline :value="history" class="overflow-y-auto">
            <template #opposite="{ item }">
              <span
                v-if="!item.isStart"
                class="text-surface-500 dark:text-surface-400">
                {{ dateAsMMDD(item.date) }}
              </span>
              <span v-else class="whitespace-pre-line break-words">
                {{ item.reason }}
              </span>
            </template>
            <template #content="{ item }">
              <span
                v-if="item.isStart"
                class="text-surface-500 dark:text-surface-400">
                {{ dateAsMMDD(item.date) }}
              </span>
              <span v-else class="whitespace-pre-line break-words">
                {{ item.reason }}
              </span>
            </template>
          </Timeline>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>VATUSA Status Checks</AccordionHeader>
        <AccordionContent>
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
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <Message
      class="mt-5"
      severity="success"
      v-if="editData!.statusChecks.visiting">
      Meets VATUSA requirements.
    </Message>
    <Message class="mt-5" severity="warn" v-else>
      Does not meet VATUSA requirements.
    </Message>

    <template #footer>
      <Button
        severity="success"
        label="Accept"
        @click="accept"
        :loading="isAccepting" />
      <Button severity="danger" label="Reject" @click="reject" />
      <Button outlined label="Cancel" @click="close" />
    </template>
  </Dialog>

  <Dialog
    modal
    dismissableMask
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
      <Button
        severity="danger"
        label="Reject"
        @click="rejectApplication"
        :loading="isRejecting" />
      <Button outlined label="Cancel" @click="closeReject" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
