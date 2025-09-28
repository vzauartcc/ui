<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Upcoming Events</span></div>
				<div class="col s4">
					<router-link to="/admin/events/new"
						><span class="btn new_event_button right">New</span></router-link
					>
				</div>
			</div>
		</div>
		<div class="loading_container" v-if="!events">
			<Spinner />
		</div>
		<p class="no_event" v-else-if="events && events.length == 0">There are no upcoming events</p>
		<table class="event_list striped" v-else>
			<thead class="controller_list_head">
				<tr>
					<th>Name</th>
					<th>Date</th>
					<th class="options">Options</th>
				</tr>
			</thead>
			<tbody class="event_list_row">
				<tr v-for="(event, i) in events" :key="event.id">
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
						<router-link
							data-position="top"
							data-tooltip="Assign Positions"
							class="tooltipped"
							:to="`/admin/events/assign/${event.url}`"
						>
							<i class="material-icons">group</i>
						</router-link>
						<a
							href="#"
							data-position="top"
							data-tooltip="Delete Event"
							class="tooltipped modal-trigger"
							@click.prevent="openModal(i, 'delete')"
						>
							<i class="material-icons red-text text-darken-2">delete</i>
						</a>
						<a
							href="#"
							data-position="top"
							data-tooltip="Send Discord Notification"
							class="tooltipped modal-trigger"
							@click.prevent="openModal(i, 'send')"
						>
							<i class="material-icons green-text text-darken-2">arrow_upward</i>
						</a>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<Past />
	<StaffingRequest />
	<teleport to="body">
		<div v-for="(event, i) in events" :key="`modal_${i}`">
			<!-- Delete Event Modal -->
			<div :id="`modal_delete_${i}`" class="modal modal_delete">
				<div class="modal-content">
					<h4>Delete Event?</h4>
					<p>
						This will delete the event and all information associated with it. Events should not be
						deleted unless they were canceled. If you are unsure, click cancel.
					</p>
				</div>
				<div class="modal-footer">
					<a
						href="#"
						class="modal-close waves-effect waves-light btn"
						@click.prevent="deleteEvent(event.url)"
						>Delete</a
					>
					<a href="#" class="modal-close waves-effect waves-light btn-flat" @click.prevent
						>Cancel</a
					>
				</div>
			</div>

			<!-- Send Event Notification Modal -->
			<div :id="`modal_send_${i}`" class="modal modal_send">
				<div class="modal-content">
					<h4>Send {{ event.name }} to the events channel.</h4>
					<div class="row">
						<div class="col s6">
							<a
								href="#"
								class="modal-close waves-effect waves-light btn"
								@click.prevent="submitForm(event.url)"
								>Submit</a
							>
						</div>
						<div class="col s6">
							<a href="#" class="modal-close waves-effect waves-light btn-flat" @click.prevent
								>Cancel</a
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</teleport>
</template>

<script>
import { zabApi } from '@/helpers/axios.js';
import Past from './Past.vue';
import StaffingRequest from './StaffingRequest.vue';

export default {
	name: 'Events',
	title: 'Events',
	data() {
		return {
			events: null,
			historicEvents: null,
			staffingRequests: null,
		};
	},
	components: {
		Past,
		StaffingRequest,
	},
	async mounted() {
		await this.getUpcomingEvents();
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
		async getUpcomingEvents() {
			const { data } = await zabApi.get('/event');
			this.events = data.data;
		},
		openModal(index, type) {
			const modalId = `modal_${type}_${index}`;
			const modal = document.getElementById(modalId);
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
				const { data } = await zabApi.delete(`/event/${slug}`);
				if (data.ret_det.code === 200) {
					this.toastSuccess('Event deleted');
					this.getUpcomingEvents();
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch (e) {
				console.log(e);
			}
		},
		async updateDropdown() {
			const selectWrapper = document.querySelector('.select-wrapper');
			selectWrapper.classList.toggle('open', !!this.selectedOption);
		},
		async submitForm(url) {
			try {
				const { data } = await zabApi.post('/event/sendEvent', { url });
				if (data.status === 200) {
					this.toastSuccess('Discord Embed Sent');
				} else if (data.status === 201) {
					this.toastSuccess('Discord Embed Updated');
				} else {
					this.toastError(data.message);
				}
			} catch (e) {
				console.log(e);
				this.toastError(e);
			}
		},
	},
};
</script>

<style scoped lang="scss">
.name {
	color: $primary-color;
	font-weight: 700;
}

table tbody {
	tr {
		transition: background-color 0.3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

.no_event {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.modal_delete {
	min-width: 400px;
	width: 30%;
}
</style>
