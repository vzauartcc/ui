<template>
	<div class="card request_card">
		<div class="loading_container" v-if="request === null">
			<Spinner />
		</div>
		<div class="request" v-else>
			<div class="card-content">
				<div class="row">
					<div class="col s12">
						<span class="card-title request_title">Staffing Request</span>
						<span class="card-title request_title">{{ request.vaName }}</span>
						<span class="card-title request_date"
							>{{ formatTime(request.date) }}
							<i class="material-icons rotate tiny">airplanemode_active</i></span
						>
						<span class="card-title request_name">Requester: {{ request.name }}</span>
					</div>
				</div>
				<div class="row">
					<div class="col s6 request_route">
						<span class="request_route_title">Route of Flight:</span><br />
						<strong>{{ request.route }}</strong>
					</div>
					<div class="col s6 request_pilots">
						<div class="center-align">
							<span class="request_pilots_title"><strong># of pilots:</strong></span
							><br />
							<span style="font-size: 4em">{{ request.pilots }}</span>
						</div>
					</div>
					<div class="col s6 request_desc">
						<span class="request_desc_title">Additional Information:</span><br />
						{{ request.description }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'Staffing Request',
	data() {
		return {
			request: null,
		};
	},
	async mounted() {
		await this.getStaffingRequest();
		//this.setTitle(this.event.name);
		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});
	},
	methods: {
		async getStaffingRequest() {
			try {
				const { data } = await zauApi.get(`/event/staffingRequest/${this.$route.params.slug}`);
				if (data.staffingRequest === null) {
					this.$router.push('/dash');
				} else {
					this.request = data.staffingRequest;
				}
			} catch (e) {
				console.error('error getting staffing request', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		formatTime(value) {
			const d = new Date(value);
			const options = {
				timeZone: 'America/Chicago',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hourCycle: 'h12',
			};
			return d.toLocaleString('en-US', options);
		},
	},
};
</script>

<style scoped lang="scss">
.request_title {
	font-weight: 600;
}

.request_date {
	font-size: 1.35em;
	margin-top: -15px;

	.rotate {
		transform: rotate(90deg);
	}
}

.request_desc {
	white-space: pre-wrap;
}

.request_name {
	font-size: 1.15em;
	margin-top: -15px;
}
</style>
