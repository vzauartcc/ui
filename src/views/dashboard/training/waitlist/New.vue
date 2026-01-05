<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Training Waitlist Signup</span>
			<div class="loading_container" v-if="milestones.length < 1">
				<Spinner />
			</div>
			<div class="request_wrapper row row_no_margin">
				<div class="col s12 l6 push-l6">
					<p>
						<b class="red-text">Important: </b> the waitlist is not processed in order. Students are
						assigned an instructor based on availability matches and requested endorsement.
						<br /><br />
						Please ensure that you've studied the relevant training material, as per the Training
						Syllabus, before requesting a session.
					</p>
				</div>
				<div class="col s12 l6 pull-l6">
					<form class="row row_no_margin" @submit.prevent="submitRequest">
						<div class="input-field col s12" v-if="user.data.isSeniorStaff">
							<select v-model="request.student" required class="materialize-select">
								<option value="" disabled selected>Select a student</option>
								<option
									v-for="controller in controllers"
									:key="controller.cid"
									:value="controller.cid"
								>
									{{ controller.fname }} {{ controller.lname }}
								</option>
							</select>
							<label>Student <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12" v-if="user.data.isSeniorStaff">
							<select v-model="request.instructor" required class="materialize-select">
								<option value="-1" selected>Unassigned</option>
								<option
									v-for="controller in instructors"
									:key="controller.cid"
									:value="controller.cid"
								>
									{{ controller.fname }} {{ controller.lname }}
								</option>
							</select>
							<label>Instructor <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12">
							<select v-model="request.certification" required class="materialize-select">
								<option value="" disabled selected>Select a milestone</option>
								<option
									v-for="milestone in filteredMilestones"
									:key="milestone._id"
									:value="milestone.code"
								>
									{{ milestone.name }}
								</option>
							</select>
							<label>Milestone <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12">
							<select v-model="request.availability" multiple required class="materialize-select">
								<option value="Weekday Mornings">Weekday Mornings</option>
								<option value="Weekday Afternoons">Weekday Afternoons / Early Evenings</option>
								<option value="Weekday Nights">Weekday Nights</option>
								<option value="Weekend Mornings">Weekend Mornings</option>
								<option value="Weekend Afternoons">Weekend Afternoons / Early Evenings</option>
								<option value="Weekend Nights">Weekend Nights</option>
							</select>
							<label>Availability <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12" v-if="!user.data.isSeniorStaff">
							<select v-model="academy" required class="materialize-select">
								<option value="Yes">Yes</option>
								<option value="No">No</option>
								<option value="NA">N/A</option>
							</select>
							<label
								>VATUSA Academy Acknowledgement
								<i
									class="material-icons tooltipped"
									data-position="right"
									data-tooltip="I have completed the VATUSA Academy (if applicable)"
									>help</i
								></label
							>
						</div>
						<div
							class="input-field col s12"
							style="margin-bottom: 5rem"
							v-if="!user.data.isSeniorStaff"
						>
							<label>
								<input type="checkbox" v-model="ack" class="filled-in" />
								<span
									>vZAU Air Traffic Technical Training 3120.4 Acknowledgement
									<i
										class="material-icons tooltipped"
										data-position="right"
										data-tooltip="I acknowledge I have read and agree to the vZAU Air Traffic Technical
										 Training policy and will comply with it for the duration of my training.<br />
										 Any violation may result in my removal from the training program."
										>help</i
									></span
								>
							</label>
						</div>
						<div class="submit_request">
							<button
								type="submit"
								class="btn right"
								:disabled="spinners.length > 0 || !isFormValid"
							>
								<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span
								><span v-if="user.data.isSeniorStaff">Submit</span><span v-else>Request</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	name: 'RequestTraining',
	title: 'Request Training',
	data() {
		return {
			spinners: [],
			request: {
				student: 0,
				instructor: -1,
				certification: '',
				availability: [],
			},
			ack: false,
			academy: '',
			milestones: [],
			controllers: [],
			instructors: [],
		};
	},
	async mounted() {
		await this.getTrainingMilestones();
		await this.getControllers();
		await this.getInstructors();

		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.CharacterCounter.init(document.querySelectorAll('textarea'), {});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});
	},
	methods: {
		async submitRequest() {
			try {
				this.spinners.push('submit');
				if (!this.request.certification) {
					this.toastError('You must select a milestone');
				} else {
					await zauApi.post(`/training/waitlist${this.request.student === 0 ? '' : '/manual'}`, {
						...this.request,
					});

					this.toastSuccess('Training session requested');
					this.$router.push('/dash/training/waitlist');
				}
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error creating request', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
		async getTrainingMilestones() {
			try {
				const { data } = await zauApi.get(`/controller/certifications`);
				this.milestones = data
					.filter((x) => x.order > 2 && !x.class.includes('solo'))
					.sort((a, b) => a.order - b.order);
			} catch (e) {
				console.error('error getting certifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getControllers() {
			if (!this.user.data.isSeniorStaff) {
				return;
			}

			try {
				const { data } = await zauApi.get('/feedback/controllers');
				this.controllers = data;
			} catch (e) {
				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getInstructors() {
			if (!this.user.data.isSeniorStaff) {
				return;
			}

			try {
				const { data } = await zauApi.get('/training/waitlist/instructors');
				this.instructors = data;
			} catch (e) {
				console.error('error getting instructors', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
	},
	computed: {
		isFormValid() {
			return !(
				this.request.certification === '' ||
				this.request.availability.length === 0 ||
				(this.user.data.isSeniorStaff && this.request.student === 0) ||
				(!this.user.data.isSeniorStaff &&
					(this.ack === false || this.academy === '' || this.academy === 'No'))
			);
		},
		filteredMilestones() {
			if (this.user.data.isSeniorStaff || this.user.data.certifications.length === 0) {
				return this.milestones;
			}

			// Get the user's highest cert and filter out any certs less than that cert.
			return this.milestones.filter(
				(m) =>
					!this.user.data.certCodes.includes(m.code) &&
					([...this.user.data.certifications]
						.filter((x) => !x.class.includes('event'))
						.sort((a, b) => b.order - a.order)[0].order || 0) < m.order,
			);
		},
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
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
.request_wrapper {
	padding-top: 1em;

	.col {
		margin-bottom: 1em;
	}
}

.submit_request {
	margin-left: 0.75em;
}
</style>
