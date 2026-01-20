<template>
	<div class="card">
		<div class="card-content">
			<div v-if="!attempt"><Spinner /></div>
			<div v-else>
				<div class="card-title">
					<strong>{{ attempt.exam.title }}</strong>
				</div>
				<div class="stepper">
					<template v-for="(question, idx) in attempt.questionOrder" :key="idx">
						<div class="step" :class="{ active: step === idx }">
							<span
								v-if="attempt.responses[idx] && attempt.responses[idx].selectedOptions.length > 0"
								><i class="material-icons green-me" style="margin-left: -1px">check</i></span
							>
							<span v-else>{{ (idx + 1).toString() }}</span>
						</div>
					</template>
				</div>

				<div
					class="card"
					v-for="(question, idx) in attempt.questionOrder"
					:key="question._id"
					:class="{ hide: step !== idx }"
				>
					<div class="card-content">
						<div class="card-title">
							<span class="number">{{ idx + 1 }}.</span> {{ question.text }}
						</div>
						<div class="row">
							<div v-for="option in question.options" :key="option._id" class="col s12">
								<div class="row">
									<div class="col s1">
										<label>
											<input
												type="checkbox"
												class="active"
												v-model="answeringQuestion.selectedOptions"
												:value="option._id"
												id="indeterminate-checkbox"
											/>
											<span></span>
										</label>
									</div>
									<div class="col s11">
										{{ option.text }}
									</div>
								</div>
							</div>
							<label>Select all correct answers</label>
						</div>
						<div class="row">
							<a
								href="#"
								class="col right btn waves-effect red"
								@click.prevent="submitAttempt"
								:class="{ disabled: isSubmitDisabled }"
								>Submit</a
							>
							<a
								href="#"
								class="col right btn waves-effect blue timepicker-span-hours"
								@click.prevent="saveQuestion"
								:class="{ disabled: isUnchanged() }"
								>Save</a
							>
							<a
								href="#"
								class="col right btn-flat"
								@click.prevent="nextQuestion"
								v-if="step < attempt.questionOrder.length - 1"
								>Next</a
							>
							<a href="#" class="col right btn-flat" @click.prevent="prevQuestion" v-if="step > 0"
								>Back</a
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '../../../../helpers/axios';

export default {
	data() {
		return {
			spinners: [],
			attempt: null,
			answeringQuestion: {
				id: '',
				selectedOptions: [],
				dirty: [],
				startTime: 0,
			},
			step: 0,
		};
	},
	async mounted() {
		window.addEventListener('beforeunload', this.preventNav);

		await this.getAttempt();
	},
	methods: {
		async getAttempt() {
			try {
				const { data } = await zauApi.get(`/exam/attempt/${this.$route.params.attemptId}`);

				this.attempt = data;
				this.loadResponses();
			} catch (e) {
				console.error('error getting attempt', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async submitAttempt() {
			try {
				if (!this.isUnchanged()) {
					await this.saveResponse(
						this.answeringQuestion.id + '',
						JSON.parse(JSON.stringify(this.answeringQuestion.selectedOptions)),
						Date.now() - (this.answeringQuestion.startTime + 0),
					);
				}

				await zauApi.patch(`/exam/attempt/${this.$route.params.attemptId}/submit`, {});
			} catch (e) {
				console.error('error submitting attempt', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
		async saveResponse(id, options, spent) {
			try {
				const { data } = await zauApi.patch(`/exam/attempt/${this.$route.params.attemptId}`, {
					questionId: id,
					selectedOptions: options,
					timeSpent: spent,
				});

				this.attempt.responses = data.responses;
				this.loadResponses();
			} catch (e) {
				console.error('error saving question response', e);
				this.toastError('Error saving question response. Response was not logged');
			}
		},
		saveQuestion() {
			if (!this.isUnchanged()) {
				this.saveResponse(
					this.answeringQuestion.id + '',
					JSON.parse(JSON.stringify(this.answeringQuestion.selectedOptions)),
					Date.now() - (this.answeringQuestion.startTime + 0),
				);

				this.answeringQuestion.startTime = Date.now();
			}
		},
		nextQuestion() {
			if (!this.isUnchanged()) {
				this.saveResponse(
					this.answeringQuestion.id + '',
					JSON.parse(JSON.stringify(this.answeringQuestion.selectedOptions)),
					Date.now() - (this.answeringQuestion.startTime + 0),
				);
			}

			this.step++;
			this.loadResponses();
		},
		prevQuestion() {
			if (!this.isUnchanged()) {
				this.saveResponse(
					this.answeringQuestion.id + '',
					JSON.parse(JSON.stringify(this.answeringQuestion.selectedOptions)),
					Date.now() - (this.answeringQuestion.startTime + 0),
				);
			}

			this.step--;
			this.loadResponses();
		},
		loadResponses() {
			if (this.attempt.responses[this.step]) {
				this.answeringQuestion.selectedOptions = JSON.parse(
					JSON.stringify(this.attempt.responses[this.step].selectedOptions),
				);
				this.answeringQuestion.dirty = JSON.parse(
					JSON.stringify(this.attempt.responses[this.step].selectedOptions),
				);
			} else {
				this.answeringQuestion.selectedOptions = [];
				this.answeringQuestion.dirty = [];
			}
			this.answeringQuestion.id = this.attempt.questionOrder[this.step]._id;
			this.answeringQuestion.startTime = Date.now();
		},
		isUnchanged() {
			const a = this.answeringQuestion.dirty;
			const b = this.answeringQuestion.selectedOptions;

			if (a.length !== b.length) return false;

			const s1 = a.map((s) => String(s).trim()).sort();
			const s2 = b.map((s) => String(s).trim()).sort();

			return s1.every((val, index) => val === s2[index]);
		},
		preventNav(event) {
			if (this.isUnchanged()) return;

			event.preventDefault();
			// Chrome requires returnValue to be set
			event.returnValue = '';
		},
	},
	computed: {
		isSubmitDisabled() {
			if (this.attempt.responses.length !== this.attempt.questionOrder.length) {
				if (
					Math.abs(this.attempt.responses.length - this.attempt.questionOrder.length) == 1 &&
					!this.isUnchanged()
				) {
					return false;
				}

				return true;
			}

			const sortedA = [...this.attempt.questionOrder].sort();
			const sortedB = [...this.responses].sort();
			return !sortedA.every((val, index) => val === sortedB[index]);
		},
	},
	beforeRouteLeave(to, from, next) {
		if (!this.isUnchanged()) {
			const answer = window.confirm('Wait! You have unsaved changes. Do you really want to leave?');
			if (answer) {
				next(); // Proceed to the next route
			} else {
				next(false); // Cancel the navigation
			}
		} else {
			next();
		}
	},
	beforeUnmount() {
		window.removeEventListener('beforeunload', this.preventNav);
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

.stepper {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 1em 0;
	flex-wrap: wrap;

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

		display: flex;
		align-items: center; /* Vertical center */
		justify-content: center; /* Horizontal center */
		text-align: center;
		margin-bottom: 1em;
		flex-shrink: 0;
	}

	.stepper_divider {
		flex-grow: 1;
		height: 1px;
		margin-left: 1em;
		margin-right: 1em;
		margin-top: 1.25em;
		background: lightgray;
	}

	.step:has(.green-me) {
		background-color: forestgreen;
	}
}

.number {
	padding-right: 0.5em;
	font-weight: bold;
}
</style>
