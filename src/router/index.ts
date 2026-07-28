import AdminDashboard from '@/layouts/AdminDashboard.vue';
import ControllerDashboard from '@/layouts/ControllerDashboard.vue';
import InstructorDashboard from '@/layouts/InstructorDashboard.vue';
import Main from '@/layouts/Main.vue';
import { useUserStore } from '@/stores/user';
import * as uriHelper from '@/utils/uriHelper';
import { vatsimAuthRedirectUrl } from '@/utils/uriHelper';
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    loggedIn?: boolean;
    requiredRating?: number;
    isAdmin?: boolean;
    isStaff?: boolean;
    isTrainingStaff?: boolean;
    isStaffOrTrainingStaff?: boolean;
    requiredRoles?: string[];
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '',
        component: () => import('@/views/Home.vue'),
        meta: {},
      },

      {
        path: '/privacy',
        component: () => import('@/views/PrivacyPolicy.vue'),
        meta: {},
      },
      {
        path: '/privacy-policy',
        component: () => import('@/views/PrivacyPolicy.vue'),
        meta: {},
      },

      {
        path: '/login',
        component: { render: () => null },
        beforeEnter() {
          location.href = uriHelper.vatsimAuthRedirectUrl;
          return false;
        },
      },
      {
        path: '/login/verify',
        component: () => import('@/views/LoginVerify.vue'),
        meta: {},
      },
      {
        path: '/login/discord',
        component: { render: () => null },
        beforeEnter() {
          location.href = uriHelper.discordRedirectUrl;
          return false;
        },
      },

      {
        path: '/controllers',
        component: () => import('@/views/roster/RosterTable.vue'),
        meta: {},
      },
      {
        path: '/controllers/staff',
        component: () => import('@/views/roster/StaffTree.vue'),
        meta: {},
      },
      {
        path: '/controllers/:cid',
        component: () => import('@/views/roster/ControllerInfo.vue'),
        meta: {
          loggedIn: true,
        },
      },

      {
        path: '/events',
        component: () => import('@/views/events/Index.vue'),
        meta: {},
      },
      {
        path: '/event/:slug',
        component: () => import('@/views/events/EventDetails.vue'),
        meta: {},
      },

      {
        path: '/news',
        component: () => import('@/views/news/Index.vue'),
        meta: {},
      },
      {
        path: '/news/:slug',
        component: () => import('@/views/news/ArticleDetails.vue'),
        meta: {},
      },

      {
        path: '/files/documents',
        component: () => import('@/views/files/DocumentList.vue'),
        meta: {},
      },
      {
        path: '/files/downloads',
        component: () => import('@/views/files/DownloadList.vue'),
        meta: {},
      },

      {
        path: '/feedback',
        component: () => import('@/views/LeaveFeedback.vue'),
        meta: {},
      },
      {
        path: '/feedback/:cid',
        component: () => import('@/views/LeaveFeedback.vue'),
        meta: {},
      },

      {
        path: '/staffingrequest',
        component: () => import('@/views/StaffingRequestForm.vue'),
        meta: {},
      },

      {
        path: '/split',
        component: () => import('@/views/SplitMap.vue'),
        meta: {},
      },

      {
        path: '/visit',
        component: () => import('@/views/VisitApplication.vue'),
        meta: {},
      },
    ],
  },
  {
    path: '/dash',
    component: ControllerDashboard,
    children: [
      {
        path: '',
        component: () => import('@/views/dashboards/user/Index.vue'),
        meta: {},
      },
      {
        path: 'feedback',
        component: () => import('@/views/dashboards/user/FeedbackList.vue'),
        meta: {},
      },
      {
        path: 'available-operating-initials',
        component: () =>
          import('@/views/dashboards/user/AvailableOperatingInitials.vue'),
        meta: {},
      },
      {
        path: 'training',
        component: () =>
          import('@/views/dashboards/user/training/SessionList.vue'),
        meta: {},
      },
      {
        path: 'training/session/:id',
        component: () =>
          import('@/views/dashboards/user/training/SessionDetails.vue'),
        meta: {},
      },
      {
        path: 'training/waitlist',
        component: () =>
          import('@/views/dashboards/user/training/TrainingWaitlist.vue'),
        meta: {},
      },
      {
        path: 'training/exams',
        component: () =>
          import('@/views/dashboards/user/training/ExamCenter.vue'),
        meta: {},
      },
      {
        path: 'training/exams/:id',
        component: () =>
          import('@/views/dashboards/user/training/ExamAttempt.vue'),
        meta: {},
      },

      {
        path: 'split-map',
        component: () => import('@/views/dashboards/user/SplitMap.vue'),
        meta: {
          requiredRating: 5,
        },
      },
    ],
    meta: {
      loggedIn: true,
    },
  },
  {
    path: '/ins',
    component: InstructorDashboard,
    children: [
      {
        path: '',
        component: () => import('@/views/dashboards/instructor/Index.vue'),
        meta: {},
      },
      {
        path: 'downloads',
        component: () =>
          import('@/views/dashboards/instructor/DownloadList.vue'),
        meta: {},
      },
      {
        path: 'controllers',
        component: () =>
          import('@/views/dashboards/instructor/controllers/ControllerList.vue'),
        meta: {},
      },
      {
        path: 'controllers/:cid',
        component: () =>
          import('@/views/dashboards/instructor/controllers/EditController.vue'),
        meta: {},
      },

      {
        path: 'training/sessions/:cid',
        component: () =>
          import('@/views/dashboards/instructor/controllers/ControllerSessions.vue'),
        meta: {},
      },
      {
        path: 'training/session/:id',
        component: () =>
          import('@/views/dashboards/user/training/SessionDetails.vue'),
        meta: {},
      },

      {
        path: 'milestones',
        component: () =>
          import('@/views/dashboards/instructor/MilestoneList.vue'),
        meta: {},
      },

      {
        path: 'solo',
        component: () =>
          import('@/views/dashboards/instructor/solo/SoloEndorsements.vue'),
        meta: {},
      },
      {
        path: 'solo/new',
        component: () =>
          import('@/views/dashboards/instructor/solo/NewSoloEndorsement.vue'),
        meta: {},
      },

      {
        path: 'waitlist',
        component: () =>
          import('@/views/dashboards/instructor/waitlist/TrainingWaitlist.vue'),
        meta: {},
      },
      {
        path: 'waitlist/new',
        component: () =>
          import('@/views/dashboards/instructor/waitlist/NewWaitlist.vue'),
        meta: {
          isAdmin: true,
        },
      },
      {
        path: 'waitlist/:id',
        component: () =>
          import('@/views/dashboards/instructor/waitlist/EditWaitlist.vue'),
        meta: {
          isAdmin: true,
        },
      },

      {
        path: 'sessions',
        component: () =>
          import('@/views/dashboards/instructor/sessions/SessionList.vue'),
        meta: {},
      },
      {
        path: 'sessions/new',
        component: () =>
          import('@/views/dashboards/instructor/sessions/NewSession.vue'),
        meta: {},
      },
      {
        path: 'sessions/edit/:id',
        component: () =>
          import('@/views/dashboards/instructor/sessions/EditSession.vue'),
        meta: {},
      },

      {
        path: 'exams',
        component: () =>
          import('@/views/dashboards/instructor/exams/ExamCenter.vue'),
        meta: {},
      },
      {
        path: 'exams/new',
        component: () =>
          import('@/views/dashboards/instructor/exams/EditExam.vue'),
        meta: {},
      },
      {
        path: 'exams/:id',
        component: () =>
          import('@/views/dashboards/instructor/exams/EditExam.vue'),
        meta: {},
      },
      {
        path: 'exams/attempt/:id',
        component: () =>
          import('@/views/dashboards/instructor/exams/ExamAttempt.vue'),
        meta: {},
      },
    ],
    meta: {
      loggedIn: true,
      isTrainingStaff: true,
    },
  },
  {
    path: '/admin',
    component: AdminDashboard,
    children: [
      {
        path: '',
        component: () => import('@/views/dashboards/admin/Index.vue'),
        meta: {},
      },
      {
        path: 'controllers',
        component: () =>
          import('@/views/dashboards/admin/controllers/ControllerList.vue'),
        meta: {},
      },
      {
        path: 'controllers/:cid',
        component: () =>
          import('@/views/dashboards/instructor/controllers/EditController.vue'),
        meta: {},
      },
      {
        path: 'controllers/activity',
        component: () =>
          import('@/views/dashboards/admin/controllers/ControllerActivity.vue'),
        meta: {},
      },
      {
        path: 'files/documents',
        component: () =>
          import('@/views/dashboards/admin/documents/DocumentList.vue'),
        meta: {},
      },
      {
        path: 'files/downloads',
        component: () =>
          import('@/views/dashboards/admin/documents/DownloadList.vue'),
        meta: {},
      },
      {
        path: 'files/documents/:slug',
        component: () =>
          import('@/views/dashboards/admin/documents/EditDocument.vue'),
        meta: {},
      },
      {
        path: 'files/downloads/:id',
        component: () =>
          import('@/views/dashboards/admin/documents/EditDownload.vue'),
        meta: {},
      },

      {
        path: 'news',
        component: () => import('@/views/dashboards/admin/news/Index.vue'),
        meta: {},
      },
      {
        path: 'news/:slug',
        component: () => import('@/views/dashboards/admin/news/EditNews.vue'),
        meta: {},
      },

      {
        path: 'events',
        component: () => import('@/views/dashboards/admin/events/Index.vue'),
        meta: {},
      },
      {
        path: 'events/split',
        component: () => import('@/views/dashboards/user/SplitMap.vue'),
        meta: {},
      },
      {
        path: 'events/assign/:slug',
        component: () =>
          import('@/views/dashboards/admin/events/AssignEvent.vue'),
        meta: {},
      },
      {
        path: 'events/requests/:id',
        component: () =>
          import('@/views/dashboards/admin/events/EditStaffingRequest.vue'),
        meta: {},
      },
      {
        path: 'events/:slug',
        component: () =>
          import('@/views/dashboards/admin/events/EditEvent.vue'),
        meta: {},
      },

      {
        path: 'feedback',
        component: () => import('@/views/dashboards/admin/FeedbackList.vue'),
        meta: {
          requiredRoles: ['ta'],
        },
      },

      {
        path: 'visitors',
        component: () =>
          import('@/views/dashboards/admin/VisitApplications.vue'),
        meta: {
          requiredRoles: ['datm'],
        },
      },

      {
        path: 'action-log',
        component: () => import('@/views/dashboards/admin/users/ActionLog.vue'),
        meta: {
          requiredRoles: ['ta'],
        },
      },

      {
        path: 'users',
        component: () => import('@/views/dashboards/admin/users/UserList.vue'),
        meta: {
          requiredRoles: ['datm'],
        },
      },

      {
        path: 'discord-bot',
        component: () => import('@/views/dashboards/admin/DiscordBot.vue'),
        meta: {
          requiredRoles: ['ta'],
        },
      },
    ],
    meta: {
      loggedIn: true,
      isAdmin: true,
    },
  },
  {
    path: '/:catchAll(.*)',
    component: Main,
    children: [
      {
        path: '/:catchAll(.*)',
        component: () => import('@/views/404.vue'),
        meta: {},
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  window.scrollTo({
    top: 0,
  });

  const userStore = useUserStore();
  if (!userStore.hasQueryCompleted) {
    try {
      await userStore.getUser();
    } catch (e) {
      console.error('[router] Initial user fetch failed', e);
      next('/');
      return;
    }
  }

  if (
    to.meta.loggedIn ||
    to.meta.isAdmin ||
    to.meta.isTrainingStaff ||
    to.meta.isStaffOrTrainingStaff
  ) {
    if (userStore.isLoggedIn !== true || !userStore.user) {
      localStorage.setItem('redirect', to.fullPath);
      window.location.href = vatsimAuthRedirectUrl;
      return next(false);
    }

    if (
      to.meta.requiredRating &&
      !userStore.hasRating(to.meta.requiredRating)
    ) {
      console.error('[router] You do not have permission to view this page.');
      return next('/');
    }

    if (to.meta.requiredRoles && !userStore.hasRoles(to.meta.requiredRoles)) {
      console.error('[router] You do not have permission to view this page.');
      return next('/');
    }

    if (to.meta.isAdmin) {
      if (userStore.isStaff) return next();
    } else if (to.meta.isStaffOrTrainingStaff) {
      if (userStore.isTrainingStaff || userStore.isStaff) return next();
    } else if (to.meta.isTrainingStaff) {
      if (userStore.isTrainingStaff) return next();
    } else if (to.meta.loggedIn) {
      if (userStore.user.member === true) return next();
    }

    console.error(
      '[router] You do not have permission to view this page.',
      to.meta,
    );
    next('/');
  } else {
    next();
  }
});

export default router;
