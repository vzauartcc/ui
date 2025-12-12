<template>
	<div class="card">
		<div v-if="apiPositions.length === 0 || sectors.high.length === 0" class="loading_container">
			<Spinner />
		</div>
		<div v-else class="row row_no_margin">
			<div class="col s12 row">
				<div class="red white-text strong center" v-if="hasUnsavedChanges">CHANGES PENDING</div>
			</div>
			<div class="row col s12">
				<ul class="tabs">
					<li class="tab col s6"><a class="active" href="#activePositions">Active Positions</a></li>
					<li class="tab col s6"><a href="#ownership">Sector Ownership</a></li>
				</ul>
			</div>
			<div class="tabs_content">
				<div id="activePositions" class="card-content">
					<div class="col s12 row">
						<p>
							Select which positions are available to be assigned sectors (BEARZ is always active).
						</p>
					</div>
					<div class="row">
						<div class="row col s3" v-for="pos in apiPositions" :key="pos.id">
							<div>
								<div class="switch s12 col">
									<label>
										<input
											type="checkbox"
											@change="toggleActive(pos.id)"
											class="col s6"
											:disabled="pos.id === 35"
											:checked="this.activePositions.some((x) => x.id === pos.id)"
										/>
										<span class="lever"></span>
										{{ pos.name }} ({{ pos.id }})
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div id="ownership" class="card-content">
					<div class="col s12">
						<div class="col s6">
							<div class="card-title center">High</div>
							<table>
								<thead>
									<tr class="s12 row">
										<td class="s6">Sector</td>
										<td class="s6">Owner</td>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="sector in sectors.high.features.filter(
											(f) => !f.properties.name.toLowerCase().includes('corridor'),
										)"
										:key="sector.properties.id"
										class="s12 row"
									>
										<td class="s6">{{ sector.properties.name }}</td>
										<td class="s6">
											<select
												v-model="sectorOwnership.high[sector.properties.id]"
												class="materialize-select"
											>
												<option v-for="pos in activatedPositions" :key="pos.id" :value="pos.id">
													{{ pos.name }} ({{ pos.id }})
												</option>
											</select>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="col s6">
							<div class="card-title center">Low</div>
							<table>
								<thead>
									<tr class="s12 row">
										<td class="s6">Sector</td>
										<td class="s6">Owner</td>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="sector in sectors.low.features"
										:key="sector.properties.id"
										class="s12 row"
									>
										<td class="s6">{{ sector.properties.name }}</td>
										<td class="s6">
											<select
												v-model="sectorOwnership.low[sector.properties.id]"
												required
												:id="`low_${sector.properties.id}`"
												class="materialize-select"
											>
												<option v-for="pos in activatedPositions" :key="pos.id" :value="pos.id">
													{{ pos.name }} ({{ pos.id }})
												</option>
											</select>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
					<br />
					<br />
					<div class="row">
						<div class="col s12">
							<a
								href="#"
								@click.prevent="resetSplit"
								class="btn waves-effect red left"
								:class="{ disabled: spinners.length > 0 }"
							>
								<span v-if="spinners.some((s) => s === 'reset')"> <SmallSpinner /> </span>
								Reset Split</a
							>
							<a
								href="#"
								@click.prevent="saveSplit"
								class="btn waves-effect green right"
								:class="{ disabled: !hasUnsavedChanges || spinners.length > 0 }"
							>
								<span v-if="spinners.some((s) => s === 'save')"> <SmallSpinner /> </span>
								Save Split</a
							>
						</div>
					</div>
					<div class="row">
						<div class="col s12">
							<div class="red white-text strong center" v-if="hasUnsavedChanges">
								CHANGES PENDING<br />
								PREVIEW ONLY
							</div>
							<div v-else class="green white-text strong center">LIVE SPLIT</div>
						</div>
					</div>
					<MapComponent :positionsData="apiPositions" :ownershipData="sectorOwnership" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '../../../helpers/axios';
import MapComponent from '../../partial/Split.vue';

export default {
	name: 'Edit Split',
	title: 'Edit Split',
	components: { MapComponent },
	data() {
		return {
			spinners: [],
			apiPositions: [],
			apiSectorOwnership: { high: {}, los: {} },
			sectorOwnership: { high: {}, low: {} },
			loading: true,
			sectors: { high: [], low: [] },
			activePositions: [],
		};
	},
	async mounted() {
		await this.fetchInitialData();
		await this.fetchGeojson();

		M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
		M.Tabs.init(document.querySelectorAll('.tabs'), {});
	},
	methods: {
		async fetchInitialData() {
			try {
				const { data } = await zauApi.get('/split/ownership');

				this.apiPositions = data.positions.sort((a, b) => a.id - b.id);

				this.activePositions = [];
				this.activePositions.push(data.positions.find((x) => x.id === 35));

				Object.keys(data.ownership.high).forEach((d) => {
					const sector = data.ownership.high[d];
					if (!this.activePositions.some((y) => y.id === Number(sector))) {
						this.activePositions.push(data.positions.find((x) => x.id === Number(sector)));
					}
				});

				Object.keys(data.ownership.low).forEach((d) => {
					const sector = data.ownership.low[d];
					if (!this.activePositions.some((y) => y.id === Number(sector))) {
						this.activePositions.push(data.positions.find((x) => x.id === Number(sector)));
					}
				});

				Object.assign(this.sectorOwnership.high, data.ownership.high);
				Object.assign(this.sectorOwnership.low, data.ownership.low);

				// Deep copy for tracking dirtiness
				this.apiSectorOwnership = JSON.parse(JSON.stringify(data.ownership));
			} catch (error) {
				console.error('Error fetching map configuration data', error);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.loading = false;
			}
		},
		async fetchGeojson() {
			try {
				const { data } = await zauApi.get('/split/geojson');

				this.sectors = data.sectors;
			} catch (e) {
				console.error('error fetching geojson', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async resetSplit() {
			try {
				this.spinners.push('reset');
				const { data } = await zauApi.delete('/split/ownership');

				Object.assign(this.sectorOwnership.high, data.high);
				Object.assign(this.sectorOwnership.low, data.low);

				this.apiSectorOwnership = JSON.parse(JSON.stringify(data));

				this.toastSuccess('Successfully reset split');
			} catch (e) {
				console.error('error resetting split', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'reset');
			}
		},
		async saveSplit() {
			try {
				this.spinners.push('save');

				// Assign corridors to those who logically owns them
				this.sectorOwnership.high[6] = `${this.sectorOwnership.high[8]}`;
				this.sectorOwnership.high[9] = `${this.sectorOwnership.high[1]}`;

				const { data } = await zauApi.put('/split/ownership', this.sectorOwnership);

				Object.assign(this.sectorOwnership.high, data.high);
				Object.assign(this.sectorOwnership.low, data.low);

				this.apiSectorOwnership = JSON.parse(JSON.stringify(data));

				this.toastSuccess('Successfully saved split');
			} catch (e) {
				console.error('error saving split', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'save');
			}
		},
		toggleActive(id) {
			const doc = this.activePositions.find((x) => x.id === id);
			if (doc) {
				this.activePositions = this.activePositions.filter((x) => x.id !== id);
				// Make sure sector is assigned
				for (const sector of Object.keys(this.sectorOwnership.high)) {
					if (this.sectorOwnership.high[sector] === id) {
						this.sectorOwnership.high[sector] = 35;
						this.toastSuccess(
							`Reassigned ${this.sectors.high.features.find((x) => x.properties.id === +sector).properties.name} to BEARZ`,
						);
					}
				}
				for (const sector of Object.keys(this.sectorOwnership.low)) {
					if (this.sectorOwnership.low[sector] === id) {
						this.sectorOwnership.low[sector] = 35;
						this.toastSuccess(
							`Reassigned ${this.sectors.low.features.find((x) => x.properties.id === +sector).properties.name} to BEARZ`,
						);
					}
				}
			} else {
				this.activePositions = [
					...this.activePositions,
					this.apiPositions.find((x) => x.id === id),
				];
			}
		},
	},
	computed: {
		hasUnsavedChanges() {
			return JSON.stringify(this.sectorOwnership) !== JSON.stringify(this.apiSectorOwnership);
		},
		activatedPositions() {
			return this.activePositions;
		},
	},
	watch: {
		// Refresh the materialize select components when active positions changes
		activatedPositions: {
			handler() {
				this.$nextTick(() => {
					M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
				});
			},
			immediate: true,
		},
	},
};
</script>
<style scoped lang="scss">
.tabs {
	overflow-x: auto;
	background-size: auto;
	display: flex;
	width: 100%;

	&::-webkit-scrollbar {
		height: 3px;
	}

	&::-webkit-scrollbar-track {
		background-color: #fff;
	}

	&::-webkit-scrollbar-thumb:horizontal {
		background-color: $gray_light;
	}
}
</style>
