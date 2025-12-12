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
					<li class="tab col s6"><a href="#common">Standard Event Splits</a></li>
				</ul>
			</div>
			<div class="tabs_content">
				<div id="common" class="card-content">
					<div class="col s12 row"><p>Quickly apply a split preset from the options below.</p></div>
					<div class="row col s12" v-for="group in quickSplits" :key="group.group">
						<div class="card-title">{{ group.group }}</div>
						<div class="row" v-for="split in group.splits" :key="split.name">
							<a
								href="#"
								@click.prevent="doQuickSplit(split)"
								class="btn waves-effect green col s2"
								:class="{ disabled: spinners.length > 0 }"
							>
								<span v-if="spinners.some((s) => s === 'save')"> <SmallSpinner /> </span>
								Activate Split</a
							>
							<div class="col s10" style="margin-top: 0.5em">
								<b>{{ split.name }}</b> ({{ split.description }})
							</div>
						</div>
					</div>
				</div>
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
			quickSplits: [
				{
					group: '2-Way',
					splits: [
						{
							name: 'Plan 2A N/S',
							description: 'N: 60 BAE, S: 35 BEARZ',
							high: {
								5: 35, // FWA
								0: 60, // PMM
								1: 35, // BOILER
								2: 35, // BDF
								3: 60, // BADGER
								4: 35, // GIJ
								7: 60, // COTON
								8: 35, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 35, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 60, // FARMM
								5: 35, // MALTA
								6: 35, // EON
								9: 35, // BRL
								10: 60, // KUBBS
								11: 35, // CRIBB
							},
						},
						{
							name: 'Plan 2B E/W',
							description: 'E: 35 BEARZ, W: 75 COTON',
							high: {
								5: 35, // FWA
								0: 35, // PMM
								1: 35, // BOILER
								2: 75, // BDF
								3: 75, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 75, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 75, // PLANO
								1: 75, // HARLY
								2: 75, // DBQ
								3: 75, // LNR
								4: 75, // FARMM
								5: 75, // MALTA
								6: 35, // EON
								9: 75, // BRL
								10: 35, // KUBBS
								11: 35, // CRIBB
							},
						},
						{
							name: 'Plan 2C Hi/Lo',
							description: 'Hi: 89 GIJ, Lo: 35 LO',
							high: {
								5: 89, // FWA
								0: 89, // PMM
								1: 89, // BOILER
								2: 89, // BDF
								3: 89, // BADGER
								4: 89, // GIJ
								7: 89, // COTON
								8: 89, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 35, // PLANO
								1: 35, // HARLY
								2: 35, // DBQ
								3: 35, // LNR
								4: 35, // FARMM
								5: 35, // MALTA
								6: 35, // EON
								9: 35, // BRL
								10: 35, // KUBBS
								11: 35, // CRIBB
							},
						},
						{
							name: 'Plan 2D: MSP CrossFire',
							description: 'W/SW: 75 COTON, E/NE: 35 BEARZ',
							high: {
								5: 35, // FWA
								0: 35, // PMM
								1: 75, // BOILER
								2: 75, // BDF
								3: 35, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 75, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 75, // PLANO
								1: 35, // HARLY
								2: 75, // DBQ
								3: 35, // LNR
								4: 75, // FARMM
								5: 75, // MALTA
								6: 75, // EON
								9: 75, // BRL
								10: 35, // KUBBS
								11: 35, // CRIBB
							},
						},
					],
				},
				{
					group: '3-Way',
					splits: [
						{
							name: 'Plan 3A',
							description: 'W: 75 COTON, N: 60 BAE, SE: 35 BEARZ',
							high: {
								5: 35, // FWA
								0: 60, // PMM
								1: 35, // BOILER
								2: 75, // BDF
								3: 60, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 75, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 75, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 75, // FARMM
								5: 75, // MALTA
								6: 35, // EON
								9: 75, // BRL
								10: 60, // KUBBS
								11: 35, // CRIBB
							},
						},
						{
							name: 'Plan 3B East',
							description: 'W: 75 COTON, N: 60 BAE, SE: 35 BEARZ',
							high: {
								5: 35, // FWA
								0: 60, // PMM
								1: 75, // BOILER
								2: 75, // BDF
								3: 60, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 75, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 75, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 75, // FARMM
								5: 75, // MALTA
								6: 75, // EON
								9: 75, // BRL
								10: 60, // KUBBS
								11: 35, // CRIBB
							},
						},
					],
				},
				{
					group: '4-Way',
					splits: [
						{
							name: 'Plan 4A: Standard',
							description: 'N: 60 BAE, SE: 35 BEARZ, SW: 46 BVT, W: 75 COTON',
							high: {
								5: 35, // FWA
								0: 60, // PMM
								1: 46, // BOILER
								2: 46, // BDF
								3: 60, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 75, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 46, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 75, // FARMM
								5: 75, // MALTA
								6: 46, // EON
								9: 46, // BRL
								10: 60, // KUBBS
								11: 35, // CRIBB
							},
						},
						{
							name: 'Plan 4B',
							description: 'NW: 60 BAE, NW: 89 GIJ, SE: 35 BEARZ, S/SW: 46 BVT',
							high: {
								5: 35, // FWA
								0: 89, // PMM
								1: 46, // BOILER
								2: 46, // BDF
								3: 60, // BADGER
								4: 89, // GIJ
								7: 60, // COTON
								8: 46, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 46, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 60, // FARMM
								5: 60, // MALTA
								6: 46, // EON
								9: 46, // BRL
								10: 89, // KUBBS
								11: 89, // CRIBB
							},
						},
						{
							name: 'Plan 4C: Iso-COTON',
							description: 'N/NE: 60 BAE, E/SE: 35 BEARZ, S/SW: 94 IOW, NW: 75 COTON',
							high: {
								5: 35, // FWA
								0: 60, // PMM
								1: 94, // BOILER
								2: 94, // BDF
								3: 60, // BADGER
								4: 35, // GIJ
								7: 75, // COTON
								8: 94, // IOW
							},
							low: {
								7: 35, // BEARZ
								0: 94, // PLANO
								1: 60, // HARLY
								2: 60, // DBQ
								3: 60, // LNR
								4: 75, // FARMM
								5: 94, // MALTA
								6: 94, // EON
								9: 94, // BRL
								10: 60, // KUBBS
								11: 35, // CRIBB
							},
						},
					],
				},
			],
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

				this.calculateOpenPositions(data.ownership);

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
		calculateOpenPositions(ownership) {
			this.activePositions = [];
			this.activePositions.push(this.apiPositions.find((x) => x.id === 35));

			Object.keys(ownership.high).forEach((d) => {
				const sector = ownership.high[d];
				if (!this.activePositions.some((y) => y.id === Number(sector))) {
					this.activePositions.push(this.apiPositions.find((x) => x.id === Number(sector)));
				}
			});

			Object.keys(ownership.low).forEach((d) => {
				const sector = ownership.low[d];
				if (!this.activePositions.some((y) => y.id === Number(sector))) {
					this.activePositions.push(this.apiPositions.find((x) => x.id === Number(sector)));
				}
			});
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

				this.calculateOpenPositions(data);

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
		async doQuickSplit(split) {
			Object.keys(split.high).forEach((k) => {
				this.sectorOwnership.high[k] = split.high[k];
			});
			Object.keys(split.low).forEach((k) => {
				this.sectorOwnership.low[k] = split.low[k];
			});

			await this.saveSplit();
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
