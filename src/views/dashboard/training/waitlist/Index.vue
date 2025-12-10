<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s7"><span class="card-title">Training Waitlist</span></div>
				<div class="right col s5">
					<div class="col s6 right" v-if="!user.data.certCodes.includes('zaue')">
						<router-link to="/dash/training/waitlist/new"
							><span class="btn">Join Waitlist</span></router-link
						>
					</div>
					<div class="col s6 right" v-if="user.data.isSeniorStaff">
						<router-link to="/dash/training/waitlist/new"
							><span class="btn red">New Entry</span></router-link
						>
					</div>
				</div>
			</div>
		</div>
		<div class="loading_container" v-if="!waitlist || !instructors || !certifications">
			<Spinner />
		</div>

		<p class="no_sessions" v-else-if="waitlist && waitlist.length === 0">The waitlist is empty!</p>

		<div class="row" v-else>
			<div class="col s12">
				<ul class="tabs">
					<li class="tab col s6 l3"><a class="active" href="#all">Waitlist</a></li>
					<li class="tab col s6 l3"><a href="#ins">By Instructor</a></li>
					<li class="tab col s6 l3"><a href="#end">By Endorsement</a></li>
				</ul>
			</div>
			<div class="tabs_content">
				<WaitlistCategory
					v-for="(docs, cat) in waitlist"
					:key="cat"
					:cat="cat"
					:docs="docs"
					:certs="certifications"
					:ins="instructors"
					@deleteModal="openDeleteModal"
					@editModal="openEditModal"
				/>
			</div>

			<!-- Delete modal -->
			<teleport to="body">
				<template v-if="user.data.isSeniorStaff">
					<div v-for="entry in waitlist.all.all" :key="`modal_delete_${entry._id}`">
						<div :id="`modal_delete_${entry._id}`" class="modal modal_delete">
							<div class="modal-content">
								<h4>Delete Waitlist Entry?</h4>
								<p>
									This will remove {{ entry.student.fname }} {{ entry.student.lname }}'s waitlist
									entry...
								</p>
							</div>
							<div class="modal-footer">
								<a
									href="#"
									@click="deleteEntry(entry._id)"
									class="btn waves-effect modal-close"
									:class="{ disabled: spinners.length > 0 }"
									><span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span
									>Delete</a
								>
								<a href="#" class="btn-flat waves-effect modal-close">Cancel</a>
							</div>
						</div>
					</div>
				</template>
			</teleport>
			<!-- Edit Modal -->
			<teleport to="body">
				<template v-if="user.data.isSeniorStaff">
					<div v-for="entry in waitlist.all.all" :key="`modal_edit_${entry._id}`">
						<div :id="`modal_edit_${entry._id}`" class="modal modal_edit">
							<div class="modal-content">
								<h4>Edit Waitlist Entry</h4>
								<form class="row row_no_margin" @submit.prevent="editEntry">
									<div class="input-field col s12" style="display: none">
										<input type="text" v-model="edit._id" />
									</div>
									<div class="input-field col s12">
										<input
											type="text"
											disabled
											readonly
											:value="`${edit.student.fname} ${edit.student.lname}`"
										/>
										<label class="active">Student</label>
									</div>
									<div class="input-field col s12">
										<select v-model="edit.instructorCid" class="materialize-select">
											<option value="-1">Unassigned</option>
											<option
												v-for="i in instructors"
												:key="`${entry._id}_${i.cid}`"
												:value="i.cid"
											>
												{{ i.fname }} {{ i.lname }}
											</option>
										</select>
										<label>Assigned Instructor</label>
									</div>
									<div class="input-field col s12">
										<select v-model="edit.certCode" required class="materialize-select">
											<option
												v-for="milestone in filteredMilestones"
												:key="`${entry._id}_${milestone._id}`"
												:value="milestone.code"
												:selected="milestone.code === edit.certCode"
											>
												{{ milestone.name }}
											</option>
										</select>
										<label>Milestone</label>
									</div>
									<div class="input-field col s12">
										<select
											v-model="edit.availability"
											multiple
											required
											class="materialize-select"
										>
											<option value="Weekday Mornings">Weekday Mornings</option>
											<option value="Weekday Afternoons">
												Weekday Afternoons / Early Evenings
											</option>
											<option value="Weekday Nights">Weekday Nights</option>
											<option value="Weekend Mornings">Weekend Mornings</option>
											<option value="Weekend Afternoons">
												Weekend Afternoons / Early Evenings
											</option>
											<option value="Weekend Nights">Weekend Nights</option>
										</select>
										<label>Availability <span class="red-text">*</span></label>
									</div>
								</form>
							</div>
							<div class="modal-footer">
								<a
									href="#"
									@click="editEntry(entry._id)"
									class="btn waves-effect modal-close"
									:class="{ disabled: spinners.length > 0 }"
									><span v-if="spinners.some((s) => s === 'edit')"> <SmallSpinner /> </span>Edit</a
								>
								<a href="#" class="btn-flat waves-effect modal-close">Cancel</a>
							</div>
						</div>
					</div>
				</template>
			</teleport>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';
import WaitlistCategory from './WaitlistCategory.vue';

export default {
	name: 'TrainingWaitlist',
	title: 'Training Waitlist',
	data() {
		return {
			spinners: [],
			waitlist: null,
			certifications: null,
			instructors: null,
			edit: {
				_id: '',
				studentCid: -1,
				instructorCid: -1,
				certCode: '',
				student: {
					fname: '',
					lname: '',
					cid: -1,
					certifications: [],
				},
				instructor: {
					fname: '',
					lname: '',
					cid: -1,
				},
			},
		};
	},
	components: {
		WaitlistCategory,
	},
	async mounted() {
		await this.getWaitlist();
		await this.getCertifications();
		await this.getInstructors();

		M.Tooltip.init(document.querySelectorAll('.tooltipped'), { margin: 0 });
		M.Modal.init(document.querySelectorAll('.modal'), { preventScrolling: false });
		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.Tabs.init(document.querySelectorAll('.tabs'), {});
	},
	methods: {
		async getWaitlist() {
			try {
				const { data } = await zauApi.get(`/training/waitlist/`);
				const ins = data.map((w) => w.instructorCid);
				const end = data
					.sort((a, b) => a.certification.order - b.certification.order)
					.map((w) => w.certCode);

				this.waitlist = {
					all: { all: data },
					end: {},
					ins: {},
				};

				ins.sort().forEach((i) => {
					if (i === -1) {
						return;
					}
					this.waitlist.ins[i] = data.filter((w) => w.instructorCid === i);
				});
				end.forEach((e) => {
					this.waitlist.end[e] = data.filter((w) => w.certCode === e);
				});
			} catch (e) {
				console.error('error getting waitlist', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getCertifications() {
			try {
				const { data } = await zauApi.get('/controller/certifications');
				this.certifications = data;
			} catch (e) {
				console.error('error getting certifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getInstructors() {
			try {
				const { data } = await zauApi.get('/training/waitlist/instructors');
				this.instructors = data.sort((a, b) => a.cid - b.cid);
			} catch (e) {
				console.error('error getting instructors', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		openDeleteModal(id) {
			const modal = document.getElementById(`modal_delete_${id}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		openEditModal(id) {
			const entry = this.waitlist.all.all.find((w) => w._id === id);
			if (!entry) {
				console.error('entry not in list', id);
				this.toastError('Something went wrong, please try again later');
				return;
			}
			this.edit = { ...entry };

			const modal = document.getElementById(`modal_edit_${id}`);
			if (modal) {
				this.$nextTick(() => {
					M.FormSelect.init(document.querySelectorAll('select'), {});
					M.Modal.getInstance(modal).open();
				});
			}
		},
		async editEntry() {
			try {
				this.spinners.push('edit');

				await zauApi.patch(`/training/waitlist/${this.edit._id}`, {
					instructor: this.edit.instructorCid,
					certification: this.edit.certCode,
				});

				this.toastSuccess('Entry edited!');

				await this.getWaitlist();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting session', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'edit');
			}
		},
		async deleteEntry(id) {
			try {
				this.spinners.push('delete');
				await zauApi.delete(`/training/waitlist/${id}`);

				this.toastSuccess('Training request deleted');
				await this.getWaitlist();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting session', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
	},
	computed: {
		...mapState('user', ['user']),
		filteredMilestones() {
			const initial = this.certifications
				.filter((c) => !c.class.includes('solo') && c.order > 2)
				.sort((a, b) => a.order - b.order);
			if (this.edit.student.certifications.length < 1) return initial;

			const highest =
				[...this.edit.student.certifications]
					.filter((x) => !x.class.includes('solo'))
					.sort((a, b) => b.order - a.order)[0].order || 0;
			return initial.filter((c) => c.order > highest);
		},
	},
};
</script>

<style scoped lang="scss">
.no_sessions {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.session_wrapper {
	overflow: auto;
}

.session_list {
	min-width: 500px;
}

.session_list_row {
	tr {
		transition: background-color 0.3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

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

.modal_edit {
	height: 75vh;
}
</style>
