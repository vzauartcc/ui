<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Issue Solo Endorsement</span>
			<div class="spinner_wrapper" v-if="!controllers">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<div class="col s12 l6 push-l6 card_desc">
					<p>
						Solo endorsements may be issued to students who have demonstrated sufficient competency
						on the position for which they are receiving the solo endorsement. <br /><br />Solo
						endorsements must be issued in accordance with the training syllabus and are
						automatically submitted to VATUSA. <br /><br />Solo endorsements may not extend beyond
						<b>45 days</b> in length.<br /><br />This form only submits the solo endorsement to
						VATUSA.
						<b
							>Please do not forget to edit the controller to update the Solo Endorsement section,
							which updates the controller roster.</b
						>
					</p>
				</div>
				<form class="col s12 l6 pull-l6" @submit.prevent="submitCert">
					<div class="row row_no_margin">
						<div class="col s12 input-field">
							<select v-model="form.cid" required class="materialize-select" id="controller">
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
							<select v-model="form.position" required class="materialize-select" id="position">
								<option value="" disabled selected>Select a position</option>
								<option v-for="position in positions" :value="position" :key="position">
									{{ position }}
								</option>
							</select>
							<label for="position">Position</label>
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
							<label for="expiration_date" class="active flatpickr-wrap">Expiration Date</label>
						</div>
						<div class="col s12 input-field">
							<button
								type="submit"
								class="btn right"
								:disabled="spinners.length > 0 || !isCurrentPartValid"
							>
								<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Submit
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
				cid: '',
				position: '',
			},
			positions: ['ORD_GND', 'ORD_TWR', 'MKE_APP', 'CHI_APP', 'CHI_CTR'],
		};
	},
	async mounted() {
		await this.getControllers();

		const today = new Date(new Date().toUTCString());
		const future = new Date(new Date().toUTCString());

		flatpickr(this.$refs.expirationDate, {
			enableTime: false,
			minDate: new Date(today.setDate(today.getDate() + 1)),
			maxDate: new Date(future.setDate(future.getDate() + 45)),
			disableMobile: true,
			dateFormat: 'Y-m-d',
			altFormat: 'Y-m-d',
			altInput: true,
		});

		M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
	},
	computed: {
		isCurrentPartValid() {
			return !(
				!this.form.cid ||
				!this.form.position ||
				!/^[A-Z]{3}_[A-Z]{3}$/.test(this.form.position) ||
				!this.form.expirationDate
			);
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
				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async submitCert() {
			this.spinners.push('submit');
			try {
				await zauApi.post('/training/solo', {
					student: this.form.cid,
					position: this.form.position,
					expirationDate: this.$refs.expirationDate.value,
				});

				this.toastSuccess('Solo Endorsement issued');

				this.$router.push('/ins/solo');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.log('error submitting cert', e);
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
