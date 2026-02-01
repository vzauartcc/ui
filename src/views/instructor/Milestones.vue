<template>
	<div class="card">
		<div class="loading card-content" v-if="!milestones || endorsements.length === 0">
			<Spinner />
		</div>
		<div v-else>
			<div class="card-content">
				<div class="row row_no_margin">
					<span class="card-title col s8">Manage Training Milestones</span>
					<div class="col s4"><span class="btn right" @click.prevent="createModal">New</span></div>
				</div>
				<div class="row">
					<ul class="tabs">
						<li
							v-for="(milestoneType, idx) in Object.keys(milestones)"
							:key="`tabs-${milestoneType}`"
							class="tab"
							:class="{ active: idx === 0 }"
						>
							<a :href="`#${milestoneType}`"
								>{{ milestoneType.charAt(0).toUpperCase()
								}}{{ milestoneType.slice(1) }} Milestones</a
							>
						</li>
					</ul>
				</div>
				<div class="tabs_content">
					<div
						class="row"
						v-for="milestoneType in Object.keys(milestones)"
						:key="`body-${milestoneType}`"
						:id="milestoneType"
					>
						<table>
							<thead>
								<tr>
									<td>Code</td>
									<td>Milestone Name</td>
									<td>Associated Endorsement</td>
									<td>Associated Rating</td>
									<td>Active</td>
									<td class="options">Options</td>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(milestone, idx) in milestones[milestoneType]" :key="milestone._id">
									<td>{{ milestone.code }}</td>
									<td>{{ milestone.name }}</td>
									<td>{{ getEndorsementByCode(milestone.certCode) }}</td>
									<td>{{ getRating(milestone.rating) }}</td>
									<td>{{ milestone.isActive ? 'Yes' : 'No' }}</td>
									<td class="options">
										<a
											href="#"
											@click.prevent="moveMilestoneUp(milestone._id, milestoneType)"
											data-position="top"
											data-tooltip="Move Milestone Up"
											class="tooltipped"
											v-show="spinners.length === 0 && idx > 0"
											><i class="material-icons">expand_less</i></a
										>
										<a
											href="#"
											@click.prevent="moveMilestoneDown(milestone._id, milestoneType)"
											data-position="top"
											data-tooltip="Move Milestone Down"
											class="tooltipped"
											v-show="spinners.length === 0 && idx < milestones[milestoneType].length - 1"
											><i class="material-icons">expand_more</i></a
										>
										<a
											href="#"
											@click.prevent="openEdit(milestone)"
											data-position="top"
											data-tooltip="Edit Milestone"
											class="tooltipped"
											style="font-size: 0.8em"
											><i class="material-icons">edit</i></a
										>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<teleport to="body">
				<div id="create" class="modal">
					<div class="modal-content">
						<div class="modal_title" v-if="milestoneData.id !== ''">Edit Training Milestone</div>
						<div class="modal_title" v-else>Create Training Milestone</div>
						<div class="row row_no_margin">
							<div class="input-field col s12">
								<input
									id="code"
									name="code"
									v-model="milestoneData.code"
									placeholder="GC1"
									maxlength="4"
									:disabled="milestoneData.id !== ''"
								/>
								<label for="code" class="active"
									>Short Code (4 chars max)
									<i
										class="material-icons tooltipped"
										data-position="right"
										data-tooltip="Short code must be unique, cannot be modified"
										>help</i
									>
								</label>
							</div>
							<div class="input-field col s12">
								<input id="name" name="name" v-model="milestoneData.name" />
								<label for="name" class="active">Name</label>
							</div>
							<div class="input-field col s12">
								<select
									name="milestoneType"
									id="milestoneType"
									v-model="milestoneData.type"
									class="materialize-select"
								>
									<option v-for="mt in milestoneTypes" :value="mt" :key="mt">
										{{ mt.charAt(0).toUpperCase() }}{{ mt.slice(1) }}
									</option>
								</select>
								<label for="milestoneType">Milestone Type</label>
							</div>
							<div class="input-field col s12">
								<select
									name="certCode"
									id="certCode"
									v-model="milestoneData.certCode"
									class="materialize-select"
								>
									<option value="" disabled selected>Select an Endorsement</option>
									<option v-for="end in endorsements" :value="end.code" :key="end.code">
										{{ end.name }}
									</option>
								</select>
								<label for="certCode">Associated Endorsement</label>
							</div>
							<div class="input-field col s12">
								<select
									name="rating"
									id="rating"
									v-model="milestoneData.rating"
									class="materialize-select"
								>
									<option value="" disabled selected>Select a Rating</option>
									<option v-for="(value, idx) in ratings" :value="idx" :key="idx">
										{{ value }}
									</option>
								</select>
								<label for="rating">Associated Rating</label>
							</div>
							<div class="input-field col s12">
								<div class="switch">
									<label>
										Active
										<input
											type="checkbox"
											:disabled="milestoneData.id === ''"
											:checked="milestoneData.isActive"
											@change="toggleActive"
										/>
										<span class="lever"></span>
									</label>
								</div>
								<p v-if="milestoneData.id !== ''">
									Milestones cannot be deleted, they can only be deactivated.
								</p>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
						<span v-if="spinners.length > 0"><SmallSpinner /></span>
						<a
							href="#"
							class="btn waves-effect right"
							@click.prevent="createMilestone"
							v-if="milestoneData.id === ''"
							:class="{ disabled: spinners.length > 0 }"
							>Create</a
						>
						<a
							href="#"
							class="btn waves-effect right"
							@click.prevent="updateMilestone"
							:class="{ disabled: spinners.length > 0 }"
							v-else
							>Update</a
						>
					</div>
				</div>
			</teleport>
		</div>
	</div>
</template>

<script>
import { zauApi } from '../../helpers/axios';
import { getRatingShort, ratingsShort } from '../../helpers/rating';

export default {
	name: 'ManageMilestones',
	title: 'Manage Milestones',
	data() {
		return {
			milestones: {},
			endorsements: [],
			milestoneData: {
				id: '',
				code: '',
				certCode: '',
				name: '',
				rating: '',
				isActive: true,
				type: '',
			},
			milestoneTypes: [],
			ratings: [],
			spinners: [],
		};
	},
	async mounted() {
		await this.getMilestones();
		await this.getEndorsements();

		this.$nextTick(() => {
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0,
			});

			const modals = document.querySelectorAll('.modal');
			M.Modal.init(modals, {
				preventScrolling: false,
			});

			M.Tabs.init(document.querySelectorAll('.tabs'), {
				onShow: this.handleTabShow,
			});
		});
	},
	methods: {
		async getMilestones() {
			try {
				const { data } = await zauApi.get('/training/milestones');

				this.milestones = {};
				data.milestones.forEach((m) => {
					if (Array.isArray(this.milestones[m.type])) {
						this.milestones[m.type].push(m);
					} else {
						this.milestones[m.type] = [m];
					}
				});

				Object.keys(this.milestones).forEach((mt) => {
					this.milestones[mt] = this.milestones[mt].sort((a, b) => a.order - b.order);
				});
				this.milestoneTypes = data.milestoneTypes;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');
				console.error('error getting milestones', e);
			}
		},
		async getEndorsements() {
			try {
				const { data } = await zauApi.get('/controller/certifications');

				this.endorsements = data;

				this.ratings = ratingsShort.filter((_v, idx) => idx >= 0 && idx < 6);
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');
				console.error('error getting endorsements', e);
			}
		},
		openModal() {
			this.$nextTick(() => {
				M.FormSelect.init(document.querySelectorAll('select'), {});
				M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
					margin: 0,
				});

				const modal = document.getElementById('create');
				if (modal) {
					M.Modal.getInstance(modal).open();
				}
			});
		},
		openEdit(milestone) {
			this.milestoneData = {
				code: milestone.code,
				name: milestone.name,
				certCode: milestone.certCode,
				rating: milestone.rating,
				isActive: milestone.isActive,
				id: milestone._id,
				type: milestone.type,
			};

			this.openModal();
		},
		createModal() {
			this.milestoneData = {
				id: '',
				code: '',
				certCode: '',
				name: '',
				rating: 0,
				isActive: true,
				type: '',
			};

			this.openModal();
		},
		moveMilestoneDown(id, milestoneType) {
			const retval = [];

			for (let i = 0; i < this.milestones[milestoneType].length; i++) {
				const el = this.milestones[milestoneType][i];
				if (i === this.milestones[milestoneType].length - 1 && el._id === id) {
					return;
				}

				if (el._id === id) {
					retval.push(this.milestones[milestoneType][i + 1]);
					retval.push(this.milestones[milestoneType][i]);
					i++;
				} else {
					retval.push(el);
				}
			}

			this.updateOrder(retval);
		},
		moveMilestoneUp(id, milestoneType) {
			const retval = new Array(this.milestones[milestoneType].length);

			for (let i = this.milestones[milestoneType].length - 1; i >= 0; i--) {
				const el = this.milestones[milestoneType][i];
				if (i === 0 && el._id === id) {
					return;
				}

				if (el._id === id) {
					retval[i] = this.milestones[milestoneType][i - 1];
					retval[i - 1] = this.milestones[milestoneType][i];
					i--;
				} else {
					retval[i] = el;
				}
			}

			this.updateOrder(retval);
		},
		async createMilestone() {
			try {
				this.spinners.push('create');
				await zauApi.post('/training/milestones', {
					code: this.milestoneData.code.toUpperCase(),
					certCode: this.milestoneData.certCode.toLowerCase(),
					rating: this.milestoneData.rating,
					name: this.milestoneData.name,
					type: this.milestoneData.type,
				});

				await this.getMilestones();

				const modal = document.getElementById('create');
				if (modal) {
					M.Modal.getInstance(modal).close();
				}
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');
				console.error('error creating milestone', e);
			} finally {
				this.spinners = this.spinners.filter((x) => x !== 'create');
			}
		},
		async updateMilestone() {
			try {
				this.spinners.push('update');
				await zauApi.patch(`/training/milestones/${this.milestoneData.id}`, {
					code: this.milestoneData.code.toUpperCase(),
					certCode: this.milestoneData.certCode.toLowerCase(),
					rating: this.milestoneData.rating,
					name: this.milestoneData.name,
					isActive: this.milestoneData.isActive,
					type: this.milestoneData.type,
				});

				await this.getMilestones();
				const modal = document.getElementById('create');
				if (modal) {
					M.Modal.getInstance(modal).close();
				}
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');
				console.error(e);
			} finally {
				this.spinners = this.spinners.filter((x) => x !== 'update');
			}
		},
		async updateOrder(ary) {
			try {
				this.spinners.push('order');

				await zauApi.patch(
					'/training/milestones/order',
					ary.map((x) => x._id),
				);

				await this.getMilestones();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				this.toastError('Something went wrong, please try again later');
				console.error('error ordering milestones', e);
			} finally {
				this.spinners = this.spinners.filter((x) => x !== 'order');
			}
		},
		getEndorsementByCode(code) {
			const match = this.endorsements.find((x) => x.code === code);
			if (!match) {
				return code;
			}

			return match.name;
		},
		getRating(val) {
			return getRatingShort(val);
		},
		toggleActive() {
			this.milestoneData.isActive = !this.milestoneData.isActive;
		},
	},
};
</script>

<style scoped lang="scss">
.modal_title {
	font-size: 1.8em;
	margin-bottom: 0.5em;
}

.modal {
	height: 75vh;
}

.options {
	width: 7em;
}

label {
	.material-icons {
		font-size: 17px;
		display: inline-flex;
		vertical-align: top;
		margin-top: 0.25em;
		user-select: none;
		cursor: pointer;
	}
}
</style>
