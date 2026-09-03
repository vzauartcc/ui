<script setup lang="ts">
import { notificationService } from '@/services/notification/notification.service';
import type {
  INotification,
  INotificationResponse,
} from '@/services/notification/notification.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { sanitize } from '@/utils/sanitize';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { useRouter } from 'vue-router';

const props = defineProps<{ notifications: INotificationResponse }>();
const emit = defineEmits(['updateNotifications']);
const router = useRouter();

const { isSubmitting: isDeletingAll, execute: executeDeleteAll } =
  useAsyncSubmit();
const { isSubmitting: isMarkingAllRead, execute: executeMarkAllRead } =
  useAsyncSubmit();
const { execute: executeReadOne } = useAsyncSubmit({ blockNavigation: false });
const { execute: executeDeleteOne } = useAsyncSubmit();

const deleteAll = async () => {
  await executeDeleteAll(async () => {
    await notificationService.deleteAllNotifications();

    emit('updateNotifications');
  });
};

const markAllRead = async () => {
  await executeMarkAllRead(async () => {
    await notificationService.readAllNotifications();

    emit('updateNotifications');
  });
};

const readNotification = async (notification: INotification) => {
  await executeReadOne(async () => {
    await notificationService.readNotification(notification._id);

    emit('updateNotifications');
  });

  if (notification.link) {
    router.push(notification.link);
  }
};

const deleteNotification = async (notification: INotification) => {
  await executeDeleteOne(async () => {
    await notificationService.deleteNotification(notification._id);

    emit('updateNotifications');
  });
};
</script>

<template>
  <ProgressSpinner v-if="!props.notifications" />
  <div v-else class="w-full">
    <div v-if="props.notifications.notif.length === 0" class="italic">
      You do not have any notifications.
    </div>
    <div v-else class="flex flex-col max-h-[80vh]">
      <div class="overflow-y-auto">
        <template
          v-for="(notification, index) in props.notifications.notif"
          :key="index">
          <Card
            class="dark:odd:bg-surface-700 dark:even:bg-surface-800 odd:bg-surface-100 even:bg-surface-300"
            @click.prevent="readNotification(notification)">
            <template #title>
              <div class="flex items-center justify-between w-full">
                <div
                  :class="{
                    'font-bold': !notification.read,
                    'cursor-pointer': notification.link,
                  }"
                  class="flex items-center gap-1">
                  {{ notification.title }}
                  <span v-tooltip.top="'Visit'">
                    <Icon
                      icon="heroicons:arrow-top-right-on-square"
                      class="text-lg -mt-2"
                      v-if="notification.link" />
                  </span>
                </div>
                <span v-tooltip.left="`Delete Notification`">
                  <Icon
                    icon="heroicons:x-mark-16-solid"
                    class="text-red-700 text-lg"
                    @click.stop.prevent="deleteNotification(notification)" />
                </span>
              </div>
            </template>
            <template #content>
              <span v-html="sanitize(notification.content)"></span>
            </template>
            <template #footer>
              <span class="text-xs">{{
                dateAsMMDDHHMM(notification.createdAt)
              }}</span>
            </template>
          </Card>
        </template>
      </div>
      <div class="mt-2">
        <Button
          text
          type="button"
          rounded
          label="Delete All"
          class="text-xs"
          severity="danger"
          @click.prevent="deleteAll"
          :loading="isDeletingAll" />
        <Button
          text
          type="button"
          rounded
          label="Mark All as Read"
          class="text-xs"
          @click.prevent="markAllRead"
          :loading="isMarkingAllRead" />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
