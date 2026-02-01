<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Training Requests</span></div>
				<!-- Disable training requests by always evaluating to false. -->
				<div class="col s4" v-if="false">
					<router-link to="/dash/training/new"
						><span class="btn new_event_button right">Request</span></router-link
					>
				</div>
			</div>
		</div>
		<div class="loading_container" v-if="!upcomingSessions">
			<Spinner />
		</div>

		<p class="no_sessions" v-else-if="upcomingSessions && upcomingSessions.length === 0">
			You have no upcoming training sessions.
		</p>

		<div class="session_wrapper" v-else>
			<table class="session_list striped">
				<thead class="session_list_head">
					<tr>
						<th>Milestone</th>
						<th>Start Time</th>
						<th>End Time</th>
						<th>Instructor</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="session_list_row" v-if="upcomingSessions">
					<tr v-for="session in upcomingSessions" :key="session._id">
						<td>{{ session.milestone.code + ' - ' + session.milestone.name }}</td>
						<td>{{ dtLong(session.startTime) }}</td>
						<td>{{ dtLong(session.endTime) }}</td>
						<td>
							{{
								session.instructor
									? session.instructor.fname + ' ' + session.instructor.lname
									: 'Unfulfilled'
							}}
						</td>
						<td class="options">
							<a
								href="#"
								@click.prevent="openModal(session._id)"
								data-position="top"
								data-tooltip="Cancel Training Session"
								class="tooltipped modal-trigger"
								><i class="material-icons red-text text-darken-2">cancel</i></a
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<teleport to="body">
			<div v-for="session in upcomingSessions" :key="`modal_delete_${session._id}`">
				<div :id="`modal_delete_${session._id}`" class="modal modal_delete">
					<div class="modal-content">
						<h4>Cancel Training Session?</h4>
						<p>This will remove the training session...</p>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							@click="deleteSession(session._id)"
							class="btn waves-effect modal-close"
							:class="{ disabled: spinners.length > 0 }"
							><span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>Delete</a
						>
						<a href="#" class="btn-flat waves-effect modal-close">Cancel</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
	<PastSessions />
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import PastSessions from './Past.vue';

export default {
	name: 'TrainingDash',
	title: 'Training',
	data() {
		return {
			spinners: [],
			upcomingSessions: null,
		};
	},
	components: {
		PastSessions,
	},
	async mounted() {
		await this.getUpcomingSessions();
		this.$nextTick(() => {
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), { margin: 0 });
			M.Modal.init(document.querySelectorAll('.modal'), { preventScrolling: false });
		});
	},
	methods: {
		async getUpcomingSessions() {
			try {
				const { data } = await zauApi.get(`/training/request/upcoming`);
				this.upcomingSessions = data;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting upcoming requests', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		openModal(id) {
			const modal = document.getElementById(`modal_delete_${id}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		async deleteSession(id) {
			try {
				this.spinners.push('delete');
				await zauApi.delete(`/training/request/${id}`);

				this.toastSuccess('Training request deleted');
				await this.getUpcomingSessions();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting session', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.no_sessions {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

table {
	min-width: 500px;
}

.session_wrapper {
	overflow: auto;
}

.session_list {
	min-width: 500px;
}

.session_list_row {
	tr {
		transition: background-color 0.3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}
</style>
