<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type {
  IController,
  IStaffPosition,
} from '@/services/controller/controller.types';
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

const buildHierarchyByClass = (
  data: IStaffPosition[],
  targetClass: string,
): OrganizationChartNode[] => {
  const map = new Map<string, OrganizationChartNode>();
  const roots: OrganizationChartNode[] = [];

  // 1. Map all items into their new structure
  data
    .filter((item) => item.class === targetClass)
    .forEach((item) => {
      map.set(item.code, {
        key: item.code,
        title: item.name,
        description: item.description,
        users: item.users,
        _reportsTo: item.reportsTo,
      });
    });

  if (targetClass === 'junior') {
    data
      .filter((item) => item.class === 'support')
      .forEach((item) => {
        map.set(item.code, {
          key: item.code,
          title: item.name,
          description: item.description,
          users: item.users,
          _reportsTo: item.reportsTo,
        });
      });
  }

  // 2. Load the parent of any items in the map.
  for (const item of map.values()) {
    const parentId = item._reportsTo;

    if (parentId && !map.has(parentId)) {
      const parent = data.find((d) => d.code === parentId);
      if (parent) {
        map.set(parent.code, {
          key: parent.code,
          title: parent.name,
          description: parent.description,
          users: parent.users,
          _reportsTo: '', // Do not populate this to prevent overbuilding tree
        });
      }
    }
  }

  // 3. Build the tree using references
  for (const item of map.values()) {
    const parentId = item._reportsTo;

    if (!parentId || !map.has(parentId)) {
      // Top level node, has no parents
      roots.push(item);
    } else {
      // Child node -> grab the parent reference and push to its children
      const parent = map.get(parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }
  }

  return roots;
};

onMounted(async () => {
  try {
    const data = await controllerService.getStaff();

    seniorStaff.value = buildHierarchyByClass(Object.values(data), 'senior');

    staff.value = buildHierarchyByClass(Object.values(data), 'junior');

    trainingStaff.value = buildHierarchyByClass(
      Object.values(data),
      'training',
    );
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
