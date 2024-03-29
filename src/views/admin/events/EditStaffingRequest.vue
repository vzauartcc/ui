<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Staffing Request</span>
			<div class="loading_container" v-if="request === null">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<form enctype="form-data" @submit.prevent="submitForm">
					<div class="input-field col s12 m6">
						<input id="name" type="text" v-model="request.vaName" required>
						<label for="name" class="active">VA Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="name" type="text" v-model="request.name" required disabled>
						<label for="name" class="active">Requester Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="email" class="materialize-textarea" v-model="request.email" required disabled>
						<label for="email" class="active">Email</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="Date" type="text" class="datepicker" ref="date" @change="updateDateLocal" required>
						<label for="Date" class="active">Request Time (Zulu)</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="Pilots" type="number" min="1" v-model="request.pilots" required disabled>
						<label for="Pilots" class="active">Number of Pilots</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="DateLocal" type="text" class="date" v-model="request.date" required disabled>
						<label for="DateLocal" class="active">Request Time (Local)</label>
					</div>
					<div class="input-field col s12">
						<input id="route" class="materialize-textarea" v-model="request.route">
						<label for="route" class="active">Route of Flight</label>
					</div>
					<div class="input-field col s12">
						<textarea id="description" class="materialize-textarea" v-model="request.description"></textarea>
						<label for="description" class="active">Description</label>
					</div>
					<div class="input-field col s12">
  						<label>
    						<input type="checkbox" name="accepted" v-model="request.accepted"/>
    						<span>Accepted</span>
  						</label>
					</div>
					<div class="input-field col s12">
						<input type="submit" class="btn waves-effect waves-light right" value="Update" :disabled="isButtonDisabled" @click.prevent="submitForm" />
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { zabApi } from '@/helpers/axios.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { DateTime } from 'luxon';

export default {
	data() {
		return {
			request: {
				accepted: false,
			},
			chicagoTimezone: 'America/Chicago',
			isButtonDisabled: false,
		};
	},
	async mounted() {
		await this.getStaffingRequest();
		this.setTitle(`Edit ${this.request.vaName} Request for Staffing`);
		M.textareaAutoResize(document.getElementById('description'));
		M.textareaAutoResize(document.getElementById('route'));

	},
	methods: {
  		async getStaffingRequest() {
    		try {
      			const { data } = await zabApi.get(`/event/staffingRequest/${this.$route.params.slug}`);
      			this.request = data.staffingRequest;
      
      			if (this.request.accepted) {
        			this.isButtonDisabled = true;
      			} else {
        			this.isButtonDisabled = false;
      			}

      			this.$nextTick(() => {
        			// Okay, so working with timezones with JS is hard. This is really gross and I hate it, but it works so 🤷‍♀️
        			const startTime = DateTime.fromISO(this.request.date);
          
        			flatpickr(this.$refs.date, {
          				enableTime: true,
          				time_24hr: true,
          				defaultDate: startTime.plus({minutes: -startTime.offset}).toISO(),
          				disableMobile: true,
          				minuteIncrement: 15,
          				dateFormat: 'Y-m-dTH:i:00.000\\Z',
          				altFormat: 'm/d/Y H:i',
          				altInput: true,
        			});
      			});
    		} catch (error) {
      			console.log(e);
    		}
  		},
  		updateDateLocal(event) {
    		const selectedDate = new Date(event.target.value);
    		const chicagoDate = selectedDate.toLocaleString('en-US', { timeZone: this.chicagoTimezone });
    		this.request.date = chicagoDate;
  		},
  		async submitForm() {
    		try {
      			const requestBody = {
        			name: this.request.name,
        			date: this.$refs.date.value,
        			description: this.request.description,
        			pilots: this.request.pilots,
        			email: this.request.email,
        			route: this.request.route,
        			accepted: this.request.accepted,
        			vaName: this.request.vaName,
      			};

      			const { data } = await zabApi.put(`/event/staffingRequest/${this.$route.params.slug}`, requestBody);

      			if (data.ret_det.code === 200) {
        		this.toastSuccess('Staffing request updated');
        		setTimeout(() => {
          			window.location.href = '/admin/events'; // change "/success" to the desired URL
        		}, 1000); // set the delay time in milliseconds
      			} else {
        			this.toastError(data.ret_det.message);
      			}

      			if (this.request.accepted) {
        		this.isButtonDisabled = true;
      			}
    		} catch (e) {
      			console.log(e);
    		}
  		}
	},	
};
</script>

<style scoped lang="scss">
.card_positions {
	padding: 0;

	.positions_title {
		font-weight: 600;
		padding: .5em 1em;
	}

	form {
		padding: .5em 1em;
	}

	.positions_input {
		width: calc(100% - 40px);
		margin-right: 10px;
	}

	.positions_submit {
		border: none;
		background-color: transparent;
		color: $primary-color;
		text-align: right;
		cursor: pointer;
		width: 40px;
		float: right;
		margin-top: -30px;
	}

	.collection-item {
		border: 0;

		.material-icons {
			float: right;
		}
	}

	.pos_header {
		padding: .5em 1em;
	}

	.collection-item:nth-of-type(odd) {
		background-color: $gray-mild;
	}

	.no_pos {
		padding: .5em 1em;
		font-style: italic;
	}

	
	.delete_pos {
		color: #9e9e9e;
		font-size: .8rem;
		cursor: pointer;
		text-decoration: underline;
		margin-right: .5rem;
		float: right;
	}
}
</style>