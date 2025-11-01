<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Staffing Requests</span>
		</div>
		<div class="loading_container" v-if="!requests">
			<Spinner />
		</div>
		<p v-else-if="requests && requests.length === 0" class="no_request">
			There are no staffing requests at this time.
		</p>
		<div v-else>
			<table class="request_list striped">
				<thead class="request_list_head">
					<tr>
						<th>VA Name</th>
						<th>Date (ZAU Local Time)</th>
						<th># of Pilots</th>
					</tr>
				</thead>
				<tbody class="request_list_row" v-if="requests">
					<tr v-for="request in requests" :key="request._id">
						<td class="name">
							<router-link :to="`/dash/staffingrequest/${request._id}`">
								{{ request.vaName }} </router-link
							><br />
						</td>
						<td class="date">
							{{ dtLong(request.date) }}
						</td>
						<td class="#_of_pilots">
							{{ request.pilots }}
						</td>
					</tr>
				</tbody>
			</table>
			<div v-if="requests && requests !== 0">
				<Pagination
					:amount="requestAmount"
					:page="page"
					:limit="limit"
					:amountOfPages="amountOfPages"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'staffingRequests',
	data() {
		return {
			spinners: [],
			requests: null,
			requestAmount: 1,
			page: 1,
			limit: 10,
			amountOfPages: 1,
		};
	},
	components: {
		Pagination,
	},
	async mounted() {
		await this.getStaffingRequests();
		this.amountOfPages = Math.ceil(this.eventAmount / this.limit);

		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});
	},
	methods: {
		async getStaffingRequests() {
			try {
				const { data } = await zauApi.get('/event/staffingRequest', {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});
				const now = new Date();
				this.requests = data.data.requests.filter(
					(request) => request.accepted && new Date(request.date) > now,
				);
				this.requestAmount = this.requests.length;
			} catch (e) {
				console.error('error getting staffing requests', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async deleteStaffingRequest(_id) {
			try {
				this.spinners.push('delete');
				const { data } = await zauApi.delete(`/event/staffingRequest/${_id}`);
				if (data.ret_det.code === 200) {
					this.toastSuccess('Staffing Request deleted');
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch (e) {
				console.error('error deleting staffing request', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
		dtLong(dateString) {
			const date = new Date(dateString);
			const options = {
				timeZone: 'America/Chicago',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: true,
			};
			return date.toLocaleString('en-US', options);
		},
	},
	watch: {
		page: async function () {
			await this.getStaffingRequests();
			M.Modal.init(document.querySelectorAll('.modal'), {
				preventScrolling: false,
			});
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0,
			});
		},
	},
};
</script>

<style scoped lang="scss">
.request_banner {
	width: 100%;
}

.request_list_row tr {
	transition: background-color 0.3s ease;
	&:hover {
		background: #eaeaea;
	}
}

.request_title {
	font-weight: 700;
}

.card .card-content .event_date {
	font-size: 1.15em;
	margin-top: -15px;

	.rotate {
		transform: rotate(90deg);
	}
}

tr th {
	text-align: left;
}

td {
	padding: 1em;
}

td a {
	transition: 0.3s;
	font-weight: 600;
	&:hover {
		color: $primary-color-light;
	}
}

.event_card .card-content .row {
	margin-bottom: 0;
}

.no_request {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}
</style>
