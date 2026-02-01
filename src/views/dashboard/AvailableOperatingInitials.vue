<template>
	<div class="card">
		<div class="card-content">
			<Spinner v-if="avail.length === 0" />
			<div v-else>
				<span class="card-title">Available Operating Initials ({{ avail.length }})</span>
				<div class="row">
					<div class="row col s1 center" v-for="oi in avail" :key="oi">{{ oi }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '../../helpers/axios';

export default {
	data() {
		return {
			avail: [],
		};
	},
	async mounted() {
		await this.getUsedOIs();
	},
	methods: {
		async getUsedOIs() {
			try {
				const { data } = await zauApi.get('/controller/oi');

				const combinations = new Array(676);
				let index = 0;

				for (let i = 65; i <= 90; i++) {
					for (let j = 65; j <= 90; j++) {
						combinations[index++] = String.fromCharCode(i, j);
					}
				}

				this.avail = combinations.filter((x) => !data.includes(x));
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');

				console.error(e);
			}
		},
	},
};
</script>

<style></style>
