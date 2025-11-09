<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Past Events</span>
		</div>
		<div class="loading_container" v-if="!historicEvents">
			<Spinner />
		</div>
		<p v-else-if="historicEvents && historicEvents.length === 0" class="no_event">
			There have been no events yet
		</p>
		<div v-else>
			<table class="event_list striped">
				<thead class="event_list_head">
					<tr>
						<th>Name</th>
						<th>Date</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="event_list_row" v-if="historicEvents">
					<tr v-for="(event, i) in historicEvents" :key="event.id">
						<td class="name">
							<router-link :to="`/events/${event.url}`">
								{{ event.name }}
							</router-link>
						</td>
						<td class="date">
							{{ dtLong(event.eventStart) }}
						</td>
						<td class="options">
							<router-link
								data-position="top"
								data-tooltip="Edit Event"
								class="tooltipped"
								:to="`/admin/events/edit/${event.url}`"
							>
								<i class="material-icons">edit</i>
							</router-link>
							<a
								href="#"
								data-position="top"
								data-tooltip="Delete Event"
								class="tooltipped modal-trigger"
								@click.prevent="openModal(i)"
							>
								<i class="material-icons red-text text-darken-2">delete</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
			<div v-if="historicEvents && eventAmount !== 0">
				<Pagination
					:amount="eventAmount"
					:page="page"
					:limit="limit"
					:amountOfPages="amountOfPages"
				/>
			</div>
		</div>
		<teleport to="body">
			<div v-for="(event, i) in historicEvents" :key="`modal_${i}`">
				<div :id="`modal_historic_${i}`" class="modal modal_delete">
					<div class="modal-content">
						<h4>Delete Event?</h4>
						<p>
							This will delete the event and all information associated with it. Events should not
							be deleted unless they were canceled. If you are unsure, click cancel.
						</p>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							class="waves-effect btn"
							@click.prevent="deleteEvent(event.url)"
							:class="{ disabled: spinners.length > 0 }"
							><span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>Delete</a
						>
						<a href="#" class="modal-close waves-effect btn-flat" @click.prevent>Cancel</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
</template>

<script>
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'HistoricEvents',
	data() {
		return {
			spinners: [],
			historicEvents: null,
			eventAmount: 1,
			page: 1,
			limit: 10,
			amountOfPages: 1,
		};
	},
	components: {
		Pagination,
	},
	async mounted() {
		await this.getHistoricEvents();
		this.amountOfPages = Math.ceil(this.eventAmount / this.limit);
		this.$nextTick(() => {
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
		});
	},
	updated() {
		this.$nextTick(() => {
			this.initModals();
		});
	},
	methods: {
		async getHistoricEvents() {
			try {
				const { data } = await zauApi.get('/event/archive', {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});
				this.historicEvents = data.events;
				this.eventAmount = data.amount;
			} catch (e) {
				console.error('error getting historical events', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		openModal(index) {
			const modal = document.getElementById(`modal_historic_${index}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		initModals() {
			this.$nextTick(() => {
				const modals = document.querySelectorAll('.modal');
				M.Modal.init(modals, {
					preventScrolling: false,
				});
			});
		},
		async deleteEvent(slug) {
			try {
				this.spinners.push('delete');
				await zauApi.delete(`/event/${slug}`);

				this.toastSuccess('Event deleted');
				await this.getHistoricEvents(); // Refresh event list
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting event', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
	},
	watch: {
		page: async function () {
			await this.getHistoricEvents();
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
.event_banner {
	width: 100%;
}

.event_list_row tr {
	transition: background-color 0.3s ease;
	&:hover {
		background: #eaeaea;
	}
}

.event_title {
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

.no_event {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}
</style>
