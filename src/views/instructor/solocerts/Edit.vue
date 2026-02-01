<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Solo Endorsement</span>
			<div class="spinner_wrapper" v-if="!controllers">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<div class="col s12 l6 push-l6 card_desc">
					<p>
						Solo endorsements may be extended <b>one time</b> with prior approval from VATUSA.<br /><br />Solo
						endorsements may not extended beyond <b>90 days</b> from the date of issuance.
					</p>
				</div>
				<form class="col s12 l6 pull-l6" @submit.prevent="submitCert">
					<div class="row row_no_margin">
						<div class="col s12 input-field">
							<select
								v-model="form.cid"
								required
								class="materialize-select"
								id="controller"
								disabled
							>
								<option value="" disabled selected>Select a controller</option>
								<option
									v-for="controller in controllers"
									:value="controller.cid"
									:key="controller.cid"
								>
									{{ controller.fname }} {{ controller.lname }}
								</option>
							</select>
							<label for="controller">Controller</label>
						</div>
						<div class="col s12 input-field">
							<select
								v-model="form.position"
								required
								class="materialize-select"
								id="position"
								disabled
							>
								<option value="" disabled selected>Select a position</option>
								<option v-for="position in positions" :value="position" :key="position">
									{{ position }}
								</option>
							</select>
							<label for="position">Position</label>
						</div>
						<div class="col s12 input-field">
							<input type="text" name="issuedate" id="issuedate" v-model="form.issued" disabled />
							<label for="issuedate" class="active">Date of Issuance</label>
						</div>
						<div class="col s12 input-field">
							<input
								type="text"
								name="currentexpdate"
								id="currentexpdate"
								v-model="form.current"
								disabled
							/>
							<label for="currentexpdate" class="active">Current Expiration Date</label>
						</div>
						<div class="col s12 input-field">
							<input
								id="expiration_date"
								type="text"
								class="datepicker"
								ref="expirationDate"
								required
								data-input
								v-model="form.expirationDate"
							/>
							<label for="expiration_date" class="active flatpickr-wrap"
								>New Expiration Date <span class="red-text"> *</span></label
							>
						</div>
						<div class="col s12 input-field mb-6">
							<label>
								<input
									type="checkbox"
									name="confirmation"
									id="confirmation"
									class="filled-in"
									v-model="form.confirmation"
									required
								/>
								<span
									>By submitting this extension, you attest that VATUSA has approved of this Solo
									Endorsement extension per VATUSA DP002. <span class="red-text"> *</span></span
								>
							</label>
						</div>
						<div class="col s12 input-field" style="margin-top: 6rem">
							<button
								type="submit"
								class="btn right"
								:disabled="spinners.length > 0 || !isCurrentPartValid"
							>
								<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Extend
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

export default {
	name: 'NewSoloEndorsement',
	title: 'Issue Solo Endorsement',
	data() {
		return {
			spinners: [],
			controllers: null,
			form: {
				confirmation: false,
				cid: '',
				position: '',
				current: '',
				issued: '',
				expirationDate: new Date(
					new Date().getUTCFullYear(),
					new Date().getUTCMonth(),
					new Date().getUTCDate() + 3,
					0,
					0,
					0,
				).toISOString(),
			},
			positions: ['MKE_APP', 'CHI_CTR'],
		};
	},
	async mounted() {
		await this.getControllers();
		await this.getSoloEndorsement();

		M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
	},
	computed: {
		isCurrentPartValid() {
			return !(this.form.confirmation !== true || !this.$refs.expirationDate?.value);
		},
	},
	methods: {
		async getControllers() {
			try {
				const { data } = await zauApi.get('/feedback/controllers');
				this.controllers = data.filter((c) => {
					// Must be at least a S1, must be less than a C1, must not be a visitor
					return c.rating > 1 && c.rating < 5 && c.vis === false;
				});
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getSoloEndorsement() {
			try {
				const { data } = await zauApi.get(`/training/solo/${this.$route.params.id}`);
				this.form.cid = data.studentCid;
				this.form.position = data.position;
				const expires = new Date(data.expires);

				this.form.current = `${expires.getUTCFullYear()}-${('00' + (expires.getUTCMonth() + 1)).slice(-2)}-${('00' + expires.getUTCDate()).slice(-2)}`;
				const issued = new Date(data.createdAt);
				this.form.expirationDate = new Date(
					issued.getUTCFullYear(),
					issued.getUTCMonth(),
					issued.getUTCDate() + 90,
				);

				this.form.issued = `${issued.getUTCFullYear()}-${('00' + (issued.getUTCMonth() + 1)).slice(-2)}-${('00' + issued.getUTCDate()).slice(-2)}`;

				this.$nextTick(() => {
					const shortest = new Date(new Date(data.createdAt).toUTCString());
					shortest.setUTCDate(shortest.getUTCDate() + 52);
					const longest = new Date(new Date(data.createdAt).toUTCString());
					longest.setUTCDate(longest.getUTCDate() + 90);

					flatpickr(this.$refs.expirationDate, {
						enableTime: false,
						minDate: shortest,
						maxDate: longest,
						disableMobile: true,
						dateFormat: 'Z',
						altFormat: 'Y-m-d',
						altInput: true,
						defaultDate: longest,
					});
				});
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async submitCert() {
			this.spinners.push('submit');
			try {
				await zauApi.patch(`/training/solo/${this.$route.params.id}`, {
					expirationDate: this.$refs.expirationDate.value,
					confirmation: this.form.confirmation,
				});

				this.toastSuccess('Solo Endorsement extended');

				this.$router.push('/ins/solo');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error submitting cert', e);
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
.card_desc {
	margin-bottom: 1em;
}
</style>
