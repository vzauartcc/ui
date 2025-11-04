<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Request Staffing</span>
			<div class="loading_container" v-if="!request">
				<Spinner />
			</div>
			<div v-else>
				<div class="card_desc">
					<p>
						We welcome your request for staffing! Use the form below to send a request for staffing.
						The time is in <strong>ZULU</strong>. The time will also show you the Central Timezone
						equivalent after entry to help with selecting the right date and time.
					</p>
				</div>
				<div v-if="!user.isLoggedIn">
					<p>
						To prevent abuse of the system, all users need to log in via VATSIM before sending
						feedback. The only details shared with us are your name and email address; your password
						is never revealed.
					</p>
					<br />
					<div class="center-align">
						<button class="btn btn-waves login_button" @click="login">Login via VATSIM</button>
					</div>
				</div>
				<form class="row row_no_margin" id="request" @submit.prevent="submitRequest" v-else>
					<div class="input-field col s12 m6">
						<input id="vaName" type="text" v-model="request.vaName" required />
						<label for="vaName" class="active">VA Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="name" type="text" v-model="request.name" required disabled />
						<label for="name" class="active">Your Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input
							id="email"
							class="materialize-textarea"
							v-model="request.email"
							required
							disabled
						/>
						<label for="email" class="active">Email</label>
					</div>
					<div class="input-field col s12 m6">
						<input
							id="Date"
							type="text"
							class="datepicker"
							ref="date"
							@change="updateDateLocal"
							required
						/>
						<label for="Date" class="active">Request Time (Zulu)</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="Pilots" type="number" min="1" v-model="request.pilots" required />
						<label for="Pilots" class="active">Number of Pilots</label>
					</div>
					<div class="input-field col s12 m6">
						<input
							id="DateLocal"
							type="text"
							class="date"
							v-model="request.date"
							required
							disabled
						/>
						<label for="DateLocal" class="active">Request Time (ZAU Local)</label>
					</div>
					<div class="input-field col s12">
						<input id="route" class="materialize-textarea" v-model="request.route" required />
						<label for="route" class="active">Route of Flight</label>
					</div>
					<div class="input-field col s12">
						<input
							id="description"
							class="materialize-textarea"
							v-model="request.description"
							required
						/>
						<label for="description" class="active">Additional Information</label>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Send
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { vatsimAuthRedirectUrl } from '@/helpers/uriHelper.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { mapState } from 'vuex';

export default {
	name: 'Staffing',
	title: 'Request Staffing',
	data() {
		return {
			spinners: [],
			request: {
				name: '',
				vaName: '',
				email: '',
			},
			chicagoTimezone: 'America/Chicago',
		};
	},
	async mounted() {
		const today = new Date(new Date().toUTCString());
		flatpickr(this.$refs.date, {
			enableTime: true,
			time_24hr: true,
			minDate: today,
			disableMobile: true,
			minuteIncrement: 15,
			dateFormat: 'Y-m-dTH:i:00.000\\Z',
			altFormat: 'm/d/Y H:i',
			altInput: true,
		});
		if (this.user && this.user.isLoggedIn) {
			this.request.name = `${this.user.data.fname} ${this.user.data.lname}`;
			this.request.email = this.user.data.email;
		}
	},
	methods: {
		async login() {
			localStorage.setItem('redirect', this.$route.path);
			window.location.href = vatsimAuthRedirectUrl;
		},
		updateDateLocal(event) {
			const selectedDate = new Date(event.target.value);
			const chicagoDate = selectedDate.toLocaleString('en-US', { timeZone: this.chicagoTimezone });
			this.request.date = chicagoDate;
		},
		async submitRequest() {
			try {
				this.spinners.push('submit');
				const { data } = await zauApi.post('/event/staffingRequest', this.request);
				console.log(data);
				if (data.ret_det.code === 200) {
					this.toastSuccess('Staffing Request sent');
					document.getElementById('request').reset();
					this.request = {
						name: `${this.user.data.fname} ${this.user.data.lname}`,
						email: this.user.data.email,
						cid: this.user.data.cid,
					};
					this.$nextTick(() => {
						M.updateTextFields();
					});
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch (e) {
				console.error('error submitting request', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.card_desc {
	margin-bottom: 1em;
}

.form_checkbox {
	span {
		color: black;
	}
}

.checkbox {
	padding-left: 1em;
}

input.valid[type='email']:not(.browser-default) {
	border-bottom: 1px solid $primary-color;
	box-shadow: 0 1px 0 0 $primary-color;
}
</style>
