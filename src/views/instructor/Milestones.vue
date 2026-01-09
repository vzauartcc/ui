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
							<tr v-for="milestone in milestones" :key="milestone._id">
								<td>{{ milestone.code }}</td>
								<td>{{ milestone.name }}</td>
								<td>{{ getEndorsementByCode(milestone.certCode) }}</td>
								<td>{{ getRating(milestone.rating) }}</td>
								<td>{{ milestone.isActive ? 'Yes' : 'No' }}</td>
								<td class="options">
									<a
										href="#"
										@click.prevent="moveMilestoneUp(milestone._id)"
										data-position="top"
										data-tooltip="Move Milestone Up"
										class="tooltipped"
										v-show="spinners.length === 0"
										><i class="material-icons">expand_less</i></a
									>
									<a
										href="#"
										@click.prevent="moveMilestoneDown(milestone._id)"
										data-position="top"
										data-tooltip="Move Milestone Down"
										class="tooltipped"
										v-show="spinners.length === 0"
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
								/>
								<label for="code" class="active"
									>Short Code (4 chars max)
									<i
										class="material-icons tooltipped"
										data-position="right"
										data-tooltip="Short code must be unique"
										>help</i
									></label
								>
							</div>
							<div class="input-field col s12">
								<input id="name" name="name" v-model="milestoneData.name" />
								<label for="name" class="active">Name</label>
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
							class="btn waves-effect modal-close right"
							@click.prevent="createMilestone"
							v-if="milestoneData.id === ''"
							:class="{ disabled: spinners.length > 0 }"
							>Create</a
						>
						<a
							href="#"
							class="btn waves-effect modal-close right"
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
			milestones: null,
			endorsements: [],
			milestoneData: {
				id: '',
				code: '',
				certCode: '',
				name: '',
				rating: '',
				isActive: true,
			},
			ratings: [],
			spinners: [],
		};
	},
	async mounted() {
		await this.getMilestones();
		await this.getEndorsements();

		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});

		this.$nextTick(() => {
			const modals = document.querySelectorAll('.modal');
			M.Modal.init(modals, {
				preventScrolling: false,
			});
		});
	},
	methods: {
		async getMilestones() {
			try {
				const { data } = await zauApi.get('/training/milestones');

				this.milestones = data.milestones.sort((a, b) => a.order - b.order);
			} catch (e) {
				this.toastError('Something went wrong, please try again later');
				console.error('error getting milestones', e);
			}
		},
		async getEndorsements() {
			try {
				const { data } = await zauApi.get('/controller/certifications');

				this.endorsements = data;

				this.ratings = ratingsShort.filter((_v, idx) => idx > 0 && idx < 6);
			} catch (e) {
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
			};

			this.openModal();
		},
		moveMilestoneDown(id) {
			const retval = [];

			for (let i = 0; i < this.milestones.length; i++) {
				const el = this.milestones[i];
				if (i === this.milestones.length - 1 && el._id === id) {
					return;
				}

				if (el._id === id) {
					retval.push(this.milestones[i + 1]);
					retval.push(this.milestones[i]);
					i++;
				} else {
					retval.push(el);
				}
			}

			this.updateOrder(retval);
		},
		moveMilestoneUp(id) {
			const retval = new Array(this.milestones.length);

			for (let i = this.milestones.length - 1; i >= 0; i--) {
				const el = this.milestones[i];
				if (i === 0 && el._id === id) {
					return;
				}

				if (el._id === id) {
					retval[i] = this.milestones[i - 1];
					retval[i - 1] = this.milestones[i];
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
				});

				await this.getMilestones();
			} catch (e) {
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
				});

				await this.getMilestones();
			} catch (e) {
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
