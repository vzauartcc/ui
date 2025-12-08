<template>
	<div v-if="loading" class="loading_container"><Spinner /></div>
	<MapComponent v-else :positionsData="apiPositions" :ownershipData="sectorOwnership" />
</template>

<script>
import { zauApi } from '../../helpers/axios';
import MapComponent from '../partial/Split.vue';

export default {
	name: 'ZAU Center Split',
	title: 'Center Split Map',
	components: { MapComponent },
	data() {
		return {
			apiPositions: [],
			sectorOwnership: { hi: {}, lo: {} },
			loading: true,
			interval: null,
		};
	},
	async mounted() {
		await this.fetchOwnershipData();

		this.interval = setInterval(async () => {
			await this.fetchOwnershipData();
		}, 60 * 1000);
	},
	unmounted() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	},
	methods: {
		async fetchOwnershipData() {
			try {
				const { data } = await zauApi.get('/split/ownership');

				this.apiPositions = data.positions;
				this.sectorOwnership = data.ownership;
			} catch (error) {
				console.error('Error fetching map configuration data', error);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.loading = false;
			}
		},
	},
};
</script>
