<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8">Your Training Sessions</div>
				<div class="col s4">
					<router-link to="/ins/training/session/new"
						><span class="btn new_event_button right">New</span></router-link
					>
				</div>
			</div>
		</div>
		<div v-if="sessions === null" class="loading_container">
			<Spinner />
		</div>
		<div v-else-if="sessions.length === 0" class="no_sessions">
			You have no open training sessions
		</div>
		<div class="sessions_wrapper" v-else>
			<table class="sessions_list striped">
				<thead class="sessions_list_head">
					<tr>
						<th>Student</th>
						<th>Milestone</th>
						<th>Start</th>
						<th>End</th>
						<th class="options" id="options_w">Options</th>
					</tr>
				</thead>
				<tbody class="sessions_list_row">
					<tr v-for="(session, i) in sessions" :key="session._id">
						<td>
							{{ session.student.fname + ' ' + session.student.lname }}
							<span v-if="session.student.vis === true">(VC)</span>
						</td>
						<td>{{ session.milestone.name }}</td>
						<td>{{ dtLong(session.startTime) }}</td>
						<td>{{ dtLong(session.endTime) }}</td>
						<td class="options">
							<a
								href="#"
								@click.prevent="openModal(i)"
								data-position="top"
								data-tooltip="View Details"
								class="tooltipped"
							>
								<i class="material-icons">search</i>
							</a>
							<router-link
								:to="`/ins/training/session/edit/${session._id}`"
								data-position="top"
								data-tooltip="Enter Notes"
								class="tooltipped"
							>
								<i class="material-icons">edit</i>
							</router-link>
							<a
								href="#"
								@click.prevent="openDelete(i)"
								data-position="top"
								data-tooltip="Delete Training Session"
								class="tooltipped"
								><i class="material-icons red-text text-darken-2">delete</i></a
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<teleport to="body">
			<div v-for="(session, i) in sessions" :key="`modal_session_${i}`">
				<div :id="`modal_session_${i}`" class="modal modal_session">
					<div class="modal-content">
						<div class="modal_title">Training Session Details</div>
						<div class="session">
							<div class="row row_no_margin" id="session">
								<div class="input-field col s6">
									<p id="student">
										{{ session.student.fname + ' ' + session.student.lname }}
										<span v-if="session.student.vis === true">(VC)</span>
									</p>
									<label for="student" class="active">Student</label>
								</div>
								<div class="input-field col s6">
									<p id="milestone">{{ session.milestone.name }} ({{ session.milestone.code }})</p>
									<label for="milestone" class="active">Milestone</label>
								</div>
								<div class="input-field col s6">
									<p id="startTime">{{ dtLong(session.startTime) }}</p>
									<label for="startTime" class="active">Start Time</label>
								</div>
								<div class="input-field col s6">
									<p id="endTime">{{ dtLong(session.endTime) }}</p>
									<label for="endTime" class="active">End Time</label>
								</div>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
					</div>
				</div>
			</div>
		</teleport>
		<teleport to="body">
			<div v-for="(session, i) in sessions" :key="`modal_session_delete_${i}`">
				<div :id="`modal_session_delete_${i}`" class="modal modal_session_delete">
					<div class="modal-content">
						<div class="modal_title">Delete Training Session?</div>
						<p>
							This will <b>permanently</b> delete the training session, including any notes entered.
						</p>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							@click.prevent="deleteSession(session._id)"
							class="btn waves-effect modal-close"
							:class="{ disabled: submitting }"
						>
							<span v-if="submitting">
								<SmallSpinner />
							</span>
							Delete</a
						>
						<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
	<Completed />
</template>

<script>
import { zabApi } from '@/helpers/axios.js';
import Completed from './Completed.vue';

export default {
	name: 'UpcomingSessions',
	title: 'Training Sessions',
	data() {
		return {
			submitting: false,
			sessions: null,
		};
	},
	components: {
		Completed,
	},
	async mounted() {
		await this.getSessions();
		this.$nextTick(() => {
			M.Modal.init(document.querySelectorAll('.modal'), { preventScrolling: false });
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), { margin: 0 });
		});
	},
	methods: {
		async getSessions() {
			try {
				const { data } = await zabApi.get(`/training/session/open`);
				this.sessions = data.data;
			} catch (e) {
				console.log(e);
			}
		},
		openModal(i) {
			this.$nextTick(() => {
				const modal = document.getElementById(`modal_session_${i}`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				}
			});
		},
		openDelete(i) {
			this.$nextTick(() => {
				const modal = document.getElementById(`modal_session_delete_${i}`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				}
			});
		},
		async deleteSession(id) {
			try {
				this.submitting = true;
				await zabApi.delete(`/training/session/${id}`);

				this.sessions = [];
				await this.getSessions();
			} catch (e) {
				console.log(e);
				this.toastError(e);
			} finally {
				this.submitting = false;
				this.$nextTick(() => {
					M.Modal.getInstance(document.querySelector('.modal_session_delete')).close();
				});
			}
		},
		formatDateTime(value) {
			const d = new Date(value);
			return d.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				timeZone: 'UTC',
				hour12: false,
			});
		},
	},
};
</script>

<style scoped lang="scss">
.no_sessions {
	font-style: italic;
	margin-top: -1em;
	padding: 0 1em 1em 1em;
}

.modal_title {
	font-size: 1.8em;
	margin-bottom: 0.5em;
}

.session_list {
	min-width: 500px;
}

.modal_session {
	.row {
		.input-field p {
			line-break: normal;
			hyphens: auto;
			margin: 0.33em 0 0 0;
		}
	}
}

#options_w {
	width: 10rem;
}
</style>
