import router from '@/router';
import { userService } from '@/services/user/user.service';
import type { IUser } from '@/services/user/user.types';
import { HTTPError } from 'ky';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const userQueryComplete = ref(false);
  const user = ref<IUser | null>(null);

  const isLoggedIn = computed(() => !!user.value?.cid);
  const hasQueryCompleted = computed(() => userQueryComplete.value);

  const hasRoles = computed(
    () =>
      (requiredRole?: string[] | string): boolean => {
        if (!requiredRole || requiredRole.length === 0) return true;

        const requiredRolesArray = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];

        const allowedRoles = [...requiredRolesArray, 'atm', 'datm'];

        return (
          !!user.value &&
          user.value.roleCodes.some((r) => allowedRoles.includes(r))
        );
      },
  );

  const hasRating = computed(() => (requiredRating?: number): boolean => {
    if (!requiredRating || requiredRating < 0) return true;

    return !!user.value && user.value.rating >= requiredRating;
  });

  const isSelf = computed(
    () =>
      (cid: number): boolean =>
        !!user.value && user.value.cid === cid,
  );

  const isTrainingStaff = computed(
    () => !!user.value?.isTrainingStaff || !!user.value?.isManagement,
  );

  const isStaff = computed(
    () => !!user.value?.isStaff || !!user.value?.isManagement,
  );

  const isSeniorStaff = computed(
    () => !!user.value?.isSeniorStaff || !!user.value?.isManagement,
  );

  const isManagement = computed(() => !!user.value?.isManagement);

  const isEventsTeam = computed(
    () => !!user.value?.isEventsTeam || !!user.value?.isManagement,
  );

  const isFacilityTeam = computed(
    () => !!user.value?.isFacilityTeam || !!user.value?.isManagement,
  );

  const isInstructor = computed(
    () => !!user.value?.isInstructor || !!user.value?.isManagement,
  );

  async function getUser(force = false) {
    if (hasQueryCompleted.value && !force) return;

    try {
      const data = await userService.getSelf();
      user.value = data;
    } catch (e) {
      if (e instanceof HTTPError && e.response?.status !== 401) {
        console.error('[store] error getting user', e);
      } else {
        console.error('[store] non-http error getting user', e);
      }
    }

    userQueryComplete.value = true;
  }

  async function logout() {
    try {
      await userService.processLogout();
      user.value = null;

      const current = router.currentRoute.value;
      await router.push({
        path: current.path,
        query: { ...current.query, _r: Date.now() },
      });
    } catch (e) {
      console.error('[store] error logging out', e);
    }
  }

  return {
    hasQueryCompleted,
    isLoggedIn,
    user,
    getUser,
    logout,
    hasRoles,
    hasRating,
    isSelf,
    isTrainingStaff,
    isStaff,
    isSeniorStaff,
    isManagement,
    isEventsTeam,
    isFacilityTeam,
    isInstructor,
  };
});
