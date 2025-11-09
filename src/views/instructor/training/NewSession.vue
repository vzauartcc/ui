<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title"> Enter Session Notes </span>
			<div class="loading_container" v-if="controllers === null || milestones === null">
				<Spinner />
			</div>
			<div class="session_notes" v-else>
				<div class="stepper">
					<div :class="`step active`">
						<span
							v-html="
								step === 1
									? '1'
									: `<i class=&quot;material-icons&quot; style=&quot;margin-left: -6px&quot;>check</i>`
							"
						></span>
					</div>
					<div class="stepper_divider"></div>
					<div :class="`step ${step > 1 ? 'active' : ''}`">
						<span
							v-html="
								step < 3
									? '2'
									: `<i class=&quot;material-icons&quot; style=&quot;margin-left: -6px&quot;>check</i>`
							"
						></span>
					</div>
					<div class="stepper_divider"></div>
					<div :class="`step ${step > 2 ? 'active' : ''}`">3</div>
				</div>
				<form>
					<div class="row row_no_margin" v-show="step === 1">
						<div class="input-field col s12 m6">
							<select class="materialize-select" v-model="form.student" required id="student">
								<option value="" disabled selected>Select a controller</option>
								<option
									v-for="controller in controllers"
									:value="controller.cid"
									:key="controller.cid"
								>
									{{ controller.fname }} {{ controller.lname }}
								</option>
							</select>
							<label for="student">Student <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12 m6">
							<input
								id="instructor"
								type="text"
								:value="user.data.fname + ' ' + user.data.lname"
								required
								disabled
							/>
							<label for="instructor" class="active">Instructor Name</label>
						</div>
						<div class="input-field col s12 m6">
							<div class="input-field col s12 m6">
								<input
									id="start_date"
									type="text"
									class="datepicker"
									ref="start_date"
									required
									data-input
									v-model="form.startTime"
								/>
								<label for="start_date" class="active flatpickr-wrap"
									>Start Time (Zulu) <span class="red-text">*</span></label
								>
							</div>
						</div>
						<div class="input-field col s12 m6">
							<div class="input-field col s12 m6">
								<input
									id="end_date"
									type="text"
									class="datepicker"
									ref="end_date"
									required
									data-input
									v-model="form.endTime"
								/>
								<label for="end_date" class="active flatpickr-wrap"
									>End Time (Zulu) <span class="red-text">*</span></label
								>
							</div>
						</div>
						<div class="input-field col s12 m6 milestone">
							<select v-model="form.milestone" class="materialize-select">
								<option value="" disabled selected>Select a milestone</option>
								<option
									v-for="milestone in milestones"
									:key="milestone._id"
									:value="milestone.code"
								>
									{{ milestone.code + ' - ' + milestone.name }}
								</option>
							</select>
							<label class="active"
								>Milestone (Cannot be modified later) <span class="red-text">*</span></label
							>
						</div>
						<div class="input-field col s12 m6 position">
							<input
								id="position"
								type="text"
								minlength="7"
								maxlength="7"
								required
								v-model="form.position"
							/>
							<label for="position" class="active">Position <span class="red-text">*</span></label>
						</div>
					</div>
					<div class="row row_no_margin" v-show="step === 2">
						<div class="input-field col s12 m6">
							<input
								id="movements"
								type="number"
								min="0"
								max="500"
								step="1"
								onkeydown="return event.key.length === 1 && !/[0-9]/.test(event.key) ? false : true;"
								required
								v-model="form.movements"
							/>
							<label for="movements" class="active">Movements</label>
						</div>
						<div class="input-field col s12 m6">
							<select required v-model="form.location" class="materialize-select">
								<option value="" disabled selected>Select a location</option>
								<option value="0">Classroom</option>
								<option value="1">Live Network</option>
								<option value="2">Sweatbox</option>
							</select>
							<label>Location <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12 m6">
							<select required v-model="form.progress" class="materialize-select">
								<option value="" disabled selected>Select an option</option>
								<option value="1">No Progress</option>
								<option value="2">Little Progress</option>
								<option value="3">Average Progress</option>
								<option value="4">Great Progress</option>
								<option value="5">Exceptional Progress</option>
							</select>
							<label>Progress <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12 m6">
							<select required v-model="form.ots" class="materialize-select">
								<option value="" disabled selected>Select an option</option>
								<option value="0">No OTS</option>
								<option value="1">OTS Pass</option>
								<option value="2">OTS Fail</option>
								<option value="3">Recommend OTS</option>
							</select>
							<label>OTS <span class="red-text">*</span></label>
						</div>
					</div>
					<div class="row row_no_margin" v-show="step === 3">
						<div class="input-field col s12">
							<textarea
								id="studentNotes"
								class="materialize-textarea"
								data-length="10000"
								v-model="form.studentNotes"
							></textarea>
							<label for="studentNotes" class="active"
								>Student Notes <span class="red-text">*</span>
								<i
									class="material-icons tooltipped"
									data-position="right"
									data-tooltip="Notes visible to the student"
									>help</i
								></label
							>
						</div>
						<div class="input-field col s12">
							<textarea
								id="insNotes"
								class="materialize-textarea"
								data-length="10000"
								v-model="form.insNotes"
							></textarea>
							<label for="insNotes" class="active"
								>Instructor Notes
								<i
									class="material-icons tooltipped"
									data-position="right"
									data-tooltip="Notes visible to training staff only"
									>help</i
								></label
							>
						</div>
					</div>
					<div class="row row_no_margin">
						<div class="input-field col s12 submit_buttons">
							<button
								type="button"
								v-if="step === 3"
								class="btn right"
								@click="submitForm"
								:disabled="!isCurrentPartValid || spinners.length > 0"
							>
								<span v-if="spinners.some((s) => s === 'submit')"> <SmallSpinner /> </span>
								Submit to VATUSA
							</button>
							<button
								type="button"
								v-if="step === 3"
								class="btn-flat right"
								@click="saveForm"
								:disabled="!isCurrentPartValid || spinners.length > 0"
							>
								<span v-if="spinners.some((s) => s === 'save')"> <SmallSpinner /> </span>
								Save
							</button>
							<button
								type="button"
								class="btn right"
								v-if="step !== 3"
								@click="step += 1"
								:disabled="!isCurrentPartValid"
							>
								Next
							</button>
							<button type="button" v-if="step !== 1" @click="step -= 1" class="btn-flat right">
								Back
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { mapActions, mapState } from 'vuex';

export default {
	name: 'NewSessionNotes',
	title: 'Enter Session Notes',
	data() {
		return {
			spinners: [],
			step: 1,
			duration: 0,
			controllers: null,
			milestones: null,
			form: {
				student: 0,
				ots: '0',
			},
		};
	},
	async mounted() {
		await this.getControllers();
		await this.getTrainingMilestones();

		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});
		M.CharacterCounter.init(document.querySelectorAll('textarea'), {});

		const today = new Date();
		flatpickr(this.$refs.start_date, {
			enableTime: true,
			time_24hr: true,
			maxDate: new Date(
				today.getUTCFullYear(),
				today.getUTCMonth(),
				today.getUTCDate(),
				today.getUTCHours(),
				Math.ceil(today.getUTCMinutes() / 15) * 15,
				0,
			),
			disableMobile: true,
			minuteIncrement: 15,
			dateFormat: 'Z',
			altFormat: 'Y-m-d H:i',
			altInput: true,
		});

		flatpickr(this.$refs.end_date, {
			enableTime: true,
			time_24hr: true,
			maxDate: new Date(
				today.getUTCFullYear(),
				today.getUTCMonth(),
				today.getUTCDate(),
				today.getUTCHours(),
				Math.ceil(today.getUTCMinutes() / 15) * 15,
				0,
			),
			disableMobile: true,
			minuteIncrement: 15,
			dateFormat: 'Z',
			altFormat: 'Y-m-d H:i',
			altInput: true,
			defaultDate: new Date(
				today.getUTCFullYear(),
				today.getUTCMonth(),
				today.getUTCDate(),
				today.getUTCHours(),
				Math.ceil(today.getUTCMinutes() / 15) * 15,
				0,
			),
		});
	},
	computed: {
		...mapState('user', ['user']),
		isCurrentPartValid() {
			switch (this.step) {
				case 1:
					return !(
						this.form.student === 0 ||
						!this.form.milestone ||
						!this.form.position ||
						!/^[A-Z]{3}_[A-Z]{3}$/.test(this.form.position) ||
						!this.form.startTime ||
						!this.form.endTime ||
						new Date(this.form.startTime) > new Date(this.form.endTime) ||
						new Date(this.form.endTime).getTime() - new Date(this.form.startTime).getTime() >
							24 * 60 * 60 * 1000
					);
				case 2:
					return !(this.form.movements < 0 || !this.form.location || !this.form.progress);
				case 3:
					return !!this.form.studentNotes;
				default:
					return false;
			}
		},
	},
	methods: {
		...mapActions('user', ['getUser']),
		async getTrainingMilestones() {
			try {
				const { data } = await zauApi.get(`/training/milestones`);
				this.milestones = data.milestones;
			} catch (e) {
				console.error('error getting milestones', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getControllers() {
			try {
				const { data } = await zauApi.get('/feedback/controllers');
				this.controllers = data;
			} catch (e) {
				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async saveForm() {
			if (new Date(this.form.startTime) > new Date(this.form.endTime)) {
				this.toastError(`Start Date must be before End Date`);
				return;
			}

			this.spinners.push('save');
			try {
				await zauApi.post(`/training/session/save`, {
					student: this.form.student,
					milestone: this.form.milestone,
					position: this.form.position,
					movements: this.form.movements,
					progress: this.form.progress,
					ots: this.form.ots,
					location: this.form.location,
					startTime: this.form.startTime,
					endTime: this.form.endTime,
					studentNotes: this.form.studentNotes,
					insNotes: this.form.insNotes,
				});

				this.toastSuccess('Session notes saved');
				this.$router.push('/ins/training/sessions');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error saving form', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'save');
			}
		},
		async submitForm() {
			if (new Date(this.form.startTime) > new Date(this.form.endTime)) {
				this.toastError(`Start Date must be before End Date`);
				return;
			}

			this.spinners.push('submit');
			try {
				await zauApi.post(`/training/session/submit`, {
					student: this.form.student,
					milestone: this.form.milestone,
					position: this.form.position,
					movements: this.form.movements,
					progress: this.form.progress,
					ots: this.form.ots,
					location: this.form.location,
					startTime: this.form.startTime,
					endTime: this.form.endTime,
					studentNotes: this.form.studentNotes,
					insNotes: this.form.insNotes,
				});

				this.toastSuccess('Session notes saved');
				this.$router.push('/ins/training/sessions');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error submitting form', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
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

.submit_buttons {
	input {
		margin-left: 0.5em;
	}
}

.stepper {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 1em 0;

	.step {
		background: lightgray;
		font-weight: 600;
		text-shadow: 1px 1px gray;
		color: #fff;
		height: 2.5em;
		width: 2.5em;
		padding: 0.45em 0.92em;
		border-radius: 50%;
		transition: 0.3s ease;

		&.active {
			background: $primary-color-light;
			text-shadow: 1px 1px $primary-color;
		}
	}

	.stepper_divider {
		flex-grow: 1;
		height: 1px;
		margin-left: 1em;
		margin-right: 1em;
		margin-top: 1.25em;
		background: lightgray;
	}
}

#start_time,
#end_time {
	.date {
		margin-top: 0.5em;
		height: 2.3rem;
		padding-top: 0.3em;
		border-bottom: 1px solid #9e9e9e;
		font-size: 16px;
		line-height: 1.15;
	}

	.controls {
		height: 15px;
		margin-top: -2.5em;
		margin-left: calc(100% - 20px);

		div:first-child {
			margin-top: -5px;
		}

		div:not(:first-child) {
			margin-top: 0px;
		}

		div {
			cursor: pointer;
			user-select: none;
			height: 15px;
			margin-top: -10px;
		}
	}
}

.milestone,
.position {
	margin-top: 3em;
}
</style>
