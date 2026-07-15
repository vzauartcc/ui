<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { IController } from '@/services/controller/controller.types';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import OrganizationChart, {
  type OrganizationChartNode,
} from 'primevue/organizationchart';
import ProgressSpinner from 'primevue/progressspinner';
import Tree from 'primevue/tree';
import { onMounted, ref } from 'vue';

useTitle('Staff');

const seniorStaff = ref<OrganizationChartNode[] | null>(null);
const staff = ref<OrganizationChartNode[] | null>(null);
const trainingStaff = ref<OrganizationChartNode[] | null>(null);

onMounted(async () => {
  try {
    const data = await controllerService.getStaff();

    // @TODO: perhaps have a 'reportsTo' field to make this less static.
    seniorStaff.value = [
      {
        key: 'atm',
        title: data.atm.name,
        description: data.atm.description,
        users: data.atm.users,
        children: [
          {
            key: 'datm',
            title: data.datm.name,
            description: data.datm.description,
            users: data.datm.users,
          },
          {
            key: 'ta',
            title: data.ta.name,
            description: data.ta.description,
            users: data.ta.users,
          },
        ],
      },
    ];

    staff.value = [
      {
        key: 'datm',
        title: data.datm.name,
        description: data.datm.description,
        users: data.datm.users,
        children: [
          {
            key: 'ec',
            title: data.ec.name,
            description: data.ec.description,
            users: data.ec.users,
            children: [
              {
                key: 'et',
                title: data.et.name,
                description: data.et.description,
                users: data.et.users,
              },
            ],
          },
          {
            key: 'fe',
            title: data.fe.name,
            description: data.fe.description,
            users: data.fe.users,
            children: [
              {
                key: 'ft',
                title: data.ft.name,
                description: data.ft.description,
                users: data.ft.users,
              },
            ],
          },
          {
            key: 'wm',
            title: data.wm.name,
            description: data.wm.description,
            users: data.wm.users,
            children: [
              {
                key: 'wt',
                title: data.wt.name,
                description: data.wt.description,
                users: data.wt.users,
              },
            ],
          },
          {
            key: 'cc',
            title: data.cc.name,
            description: data.cc.description,
            users: data.cc.users,
          },
        ],
      },
    ];

    trainingStaff.value = [
      {
        key: 'ta',
        title: data.ta.name,
        description: data.ta.description,
        users: data.ta.users,
        children: [
          {
            key: 'ins',
            title: data.ins.name,
            description: data.ins.description,
            users: data.ins.users,
          },
          {
            key: 'mtr',
            title: data.mtr.name,
            description: data.mtr.description,
            users: data.mtr.users,
          },
          {
            key: 'ia',
            title: data.ia.name,
            description: data.ia.description,
            users: data.ia.users,
          },
        ],
      },
    ];
  } catch (e) {
    console.error('error getting staff', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!seniorStaff" />
  <Card v-else>
    <template #title>ARTCC Senior Staff</template>
    <template #content>
      <OrganizationChart :value="seniorStaff[0]" class="hidden md:block">
        <template #default="{ node }">
          <span class="font-bold help-text" v-tooltip="node.description">{{
            node.title
          }}</span>
          <br />
          <template v-for="user in node.users" :key="user._id">
            <router-link :to="`/controllers/${user.cid}`">
              {{ compileUsersName(user) }}
            </router-link>
            <br />
          </template>
        </template>
      </OrganizationChart>
      <Tree :value="seniorStaff" class="w-full md:hidden">
        <template #default="{ node }">
          <span class="font-bold">{{ node.title }}</span>
          <span v-if="node.users?.length > 0"
            >&nbsp;-
            {{
              node.users
                ?.map((u: IController) => compileUsersName(u))
                .join(', ')
            }}
          </span>
        </template>
      </Tree>
    </template>
  </Card>

  <ProgressSpinner v-if="!staff" />
  <Card v-else>
    <template #title>ARTCC Staff</template>
    <template #content>
      <OrganizationChart :value="staff[0]" class="hidden md:block">
        <template #default="{ node }">
          <span class="font-bold help-text" v-tooltip="node.description">{{
            node.title
          }}</span>
          <br />
          <template v-for="user in node.users" :key="user._id">
            <router-link :to="`/controllers/${user.cid}`">
              {{ compileUsersName(user) }}
            </router-link>
            <br />
          </template>
        </template>
      </OrganizationChart>
      <Tree :value="staff" class="w-full md:hidden">
        <template #default="{ node }">
          <span class="font-bold">{{ node.title }}</span>
          <span v-if="node.users?.length > 0"
            >&nbsp;-
            {{
              node.users
                ?.map((u: IController) => compileUsersName(u))
                .join(', ')
            }}
          </span>
        </template>
      </Tree>
    </template>
  </Card>

  <ProgressSpinner v-if="!trainingStaff" />
  <Card v-else>
    <template #title>ARTCC Training Staff</template>
    <template #content>
      <OrganizationChart :value="trainingStaff[0]" class="hidden md:block">
        <template #default="{ node }">
          <span class="font-bold help-text" v-tooltip="node.description">{{
            node.title
          }}</span>
          <br />
          <template v-for="user in node.users" :key="user._id">
            <router-link :to="`/controllers/${user.cid}`">
              {{ compileUsersName(user) }}
            </router-link>
            <br />
          </template>
        </template>
      </OrganizationChart>
      <Tree :value="trainingStaff" class="w-full md:hidden">
        <template #default="{ node }">
          <span class="font-bold">{{ node.title }}</span>
          <span v-if="node.users?.length > 0"
            >&nbsp;-
            {{
              node.users
                ?.map((u: IController) => compileUsersName(u))
                .join(', ')
            }}
          </span>
        </template>
      </Tree>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
