<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Schedule Online Session</span>
			<div class="request_wrapper row row_no_margin">
				<div class="col s12 l6 push-l6">
					<p><b class="red-text">Important: </b> This is to post your planned online session. (Not Required) Current Zulu time is listed below.<br /><br />
					Select the Appropriate Time on the left the times are in Zulu time and the current Zulu time can be found at the bottom of the page.
					<br /><br />Once submitted you may delete your request on your controller dashboard.</p>
				</div>
				<div class="col s12 l6 pull-l6">
					<form class="row row_no_margin" @submit.prevent=submitRequest>
						<div class="input-field col s12">
							<input id="start_date" type="text" ref="start_date" required>
							<label for="start_date">Start Time (<span class="timezone"></span>)<span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12">
							<input id="end_date" type="text" ref="end_date" required>
							<label for="end_date">End Time (<span class="timezone"></span>)<span class="red-text">*</span></label>
						</div>
						<div class="input-field col s6">
							<select v-model="selectedOption" class="materialize-select" @change="updateSelectedFacility" id="select-facility" size="6">
								<option value="" disabled selected>Select a Facility</option>
								<option v-for="position in positions" :key="position.code" :value="position.code">{{position.name}}</option>
							</select>
							<label>Facility <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s6">
							<select id='select-position' class="materialize-select" v-model="selectedFacility">
								<option value="" disabled selected>Select a Position</option>
								<option v-for="pos in selectedFacility" :key="pos.id" :value="pos">{{pos.name}}</option>

							</select>
							<label>Position <span class="red-text">*</span></label>
						</div>
						<div class="submit_request">
							<input type="submit" class="btn" value="Post" :disabled="makingRequest"/>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zabApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import moment from 'moment-timezone';

export default {
	name: 'ScheduleSessions ',
	title: 'Schedule Sessions',
	data() {
		return {
			request: {
				facility: '',
				position: '',
				submitter: '',
			},
			positions: [],
			selectedFacility: '',
			selectedOption: '',
			makingRequest: false
		};
	},
	created(){
		this.getPositions();
		this.selectedOption = '';
	},
	async mounted() {
		await this.getPositions();
		const today = new Date(new Date().toUTCString());
		let now = new Date();
		let next15 = new Date(Math.ceil(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
		
		M.FormSelect.init(document.querySelectorAll('select'));

		this.request.submitter = this.user.data._id;

		flatpickr(this.$refs.start_date, {
  			enableTime: true,
  			time_24hr: false,
  			minDate: next15,
  			maxDate: new Date().fp_incr(14), // 14 days from now
  			disableMobile: true,
  			minuteIncrement: 15,
			dateFormat: 'Y-m-dTH:i:00',
  			altInput: true,
  			opacity: 100,
  			timezone: 'America/Chicago'
		});

		flatpickr(this.$refs.end_date, {
  			enableTime: true,
  			time_24hr: false,
  			minDate: next15,
  			maxDate: new Date().fp_incr(14), // 14 days from now
  			disableMobile: true,
  			minuteIncrement: 15,
			dateFormat: 'Y-m-dTH:i:00',
  			altInput: true,
  			opacity: 100,
  			timezone: 'America/Chicago'
		});
		function updateTimezoneDisplay() {
    		let timezoneSpans = document.getElementsByClassName("timezone");
    		for (let i = 0; i < timezoneSpans.length; i++) {
      			let date = new Date();
				let offset = -date.getTimezoneOffset() / 60;
      			timezoneSpans[i].innerHTML = offset === -6 ? "CST" : "CDT";
    		}
  		};
		updateTimezoneDisplay();
	},
	methods: {
		async submitRequest() {
			try {
				if(!this.selectedOption) {
					this.toastError('You must select a facility');
				} else if(!this.selectedFacility) {
					this.toastError('You must select a position');
				} else{
					this.makingRequest = true;
					const {data} = await zabApi.post('/scheduling/request/new', {
						...this.request,
						startTime: `${this.$refs.start_date.value}`,
						endTime: `${this.$refs.end_date.value}`,
						facility: this.selectedOption,
						position: this.selectedFacility,
					});
					if(data.ret_det.code === 200) {
						this.toastSuccess('Controlling Session Submitted');
						this.$router.push('/dash/scheduling');
						this.makingRequest = false;
					} else {
						this.toastError(data.ret_det.message);
						this.makingRequest = false;
					}
				}
			} catch(e) {
				console.log(e);
			}
		},
		async getPositions() {
			//console.log(this.user);
			const { data } = await zabApi.get('/scheduling/positions', { params: { certCodes: this.user.data.certCodes } });
			this.positions = data;
			//console.log(data);
		},
		updateSelectedFacility() {
    		const filteredFacility = this.positions.find(positions => positions.code === this.selectedOption);
			//console.log(filteredFacility);
			this.selectedFacility = filteredFacility.positions;
			//console.log(this.selectedFacility);
			this.$nextTick(() => {
    			// Update Materialize select list here
    			M.FormSelect.init(document.querySelector('#select-position'), {height: 600});
  			});
		}
		
	},

	computed: {
		...mapState('user', ['user']),
		filteredPositions() {
      if(!this.selectedOption) return []
      return this.positions.find(positions => positions.code === this.selectedOption).positions
    }
  	},
};
</script>

<style scoped lang="scss">
.request_wrapper {
	padding-top: 1em;

	.col {
		margin-bottom: 1em;
	}
}

.submit_request {
	margin-left: .75em;
}
</style>
