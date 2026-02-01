<template>
	<div class="card">
		<div class="card-content">
			<div class="card-title">Completed Training Sessions</div>
		</div>
		<div v-if="sessions === null" class="loading_container">
			<Spinner />
		</div>
		<div v-else-if="sessions && sessions.length === 0" class="no_sessions">
			There have been no training sessions yet
		</div>
		<div class="session_wrapper" v-else>
			<table class="session_list striped">
				<thead class="session_list_head">
					<tr>
						<th>Student</th>
						<th>Start Time</th>
						<th>End Time</th>
						<th>Instructor</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="session_list_row">
					<tr v-for="session in sessions" :key="session._id">
						<td>
							{{
								session.student
									? `${session.student.fname} ${session.student.lname}`
									: session.studentCid
							}}
						</td>
						<td>{{ dtLong(session.startTime) }}</td>
						<td>{{ dtLong(session.endTime) }}</td>
						<td>
							{{
								session.instructor
									? `${session.instructor.fname} ${session.instructor.lname}`
									: session.instructorCid
							}}
						</td>
						<td class="options">
							<router-link
								:to="`/ins/training/session/${session._id}`"
								data-position="top"
								data-tooltip="View Details"
								class="tooltipped"
							>
								<i class="material-icons">search</i>
							</router-link>
							<router-link
								:to="`/ins/training/session/edit/${session._id}`"
								data-position="top"
								data-tooltip="Enter Notes"
								class="tooltipped"
								v-if="
									(session.ots === 0 || session.ots === 3) &&
									(user.data.isSeniorStaff || session.instructorCid === user.data.cid)
								"
							>
								<i class="material-icons">edit</i>
							</router-link>
							<a
								href="#"
								@click.prevent="openDelete(session._id)"
								data-position="top"
								data-tooltip="Delete Training Session"
								class="tooltipped"
								v-if="user.data.isSeniorStaff && (session.ots === 0 || session.ots === 3)"
								><i class="material-icons red-text text-darken-2">delete</i></a
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div v-if="sessions && sessionAmount !== 0">
			<Pagination
				:amount="sessionAmount"
				:page="page"
				:limit="limit"
				:amountOfPages="amountOfPages"
			/>
		</div>
	</div>
	<teleport to="body">
		<template v-if="user.data.isSeniorStaff">
			<div v-for="session in sessions" :key="`modal_session_delete_${session._id}`">
				<div :id="`modal_session_delete_${session._id}`" class="modal modal_session_delete">
					<div class="modal-content">
						<div class="modal_title">Delete Training Session?</div>
						<p>
							This will <b>permanently</b> delete the training session, including any notes entered.
						</p>
						<p>
							<b
								>This <span class="red-text">will not remove</span> the training session from
								VATUSA!!</b
							>
						</p>
						<hr />
						<p>Session Details</p>
						<label>Student</label>
						<input
							type="text"
							class="col s12"
							readonly
							disabled
							:value="`${session.student.fname} ${session.student.lname}`"
						/>
						<label>Instructor</label>
						<input
							type="text"
							class="col s12"
							readonly
							disabled
							:value="`${session.instructor.fname} ${session.instructor.lname}`"
						/>
						<label>Start Time</label>
						<input
							type="text"
							class="col s12"
							readonly
							disabled
							:value="dtShort(session.startTime)"
						/>
						<label>End Time</label>
						<input
							type="text"
							class="col s12"
							readonly
							disabled
							:value="dtShort(session.endTime)"
						/>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							@click.prevent="deleteSession(session._id)"
							class="btn waves-effect modal-close red"
							:class="{ disabled: spinners.length > 0 }"
						>
							<span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>
							Delete</a
						>
						<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
					</div>
				</div>
			</div>
		</template>
	</teleport>
</template>

<script>
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	name: 'CompletedSessions',
	data() {
		return {
			spinners: [],
			sessions: null,
			sessionAmount: 0,
			page: 1,
			limit: 20,
			amountOfPages: 0,
		};
	},
	components: {
		Pagination,
	},
	async mounted() {
		await this.getSessions();
		this.amountOfPages = Math.ceil(this.sessionAmount / this.limit);
		this.$nextTick(() => {
			M.Modal.init(document.querySelectorAll('.modal'), { preventScrolling: false });
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0,
			});
		});
	},
	methods: {
		async getSessions() {
			try {
				const { data } = await zauApi.get('/training/session', {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});

				this.sessions = data.sessions;
				this.sessionAmount = data.count;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting sessions', e);
				this.toastError('Something went wrong, please try again later');
			}
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
				this.spinners.push('delete');
				await zauApi.delete(`/training/session/${id}`);

				this.sessions = [];
				await this.getSessions();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error deleting session', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
				this.$nextTick(() => {
					M.Modal.getInstance(document.querySelector('.modal_session_delete')).close();
				});
			}
		},
	},
	watch: {
		page: async function () {
			await this.getSessions();
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0,
			});
		},
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.no_sessions {
	font-style: italic;
	margin-top: -1em;
	padding: 0 1em 1em 1em;
}

.session_list {
	min-width: 500px;
}

.session_wrapper {
	overflow: auto;
}

.modal_title {
	font-size: 1.8em;
	margin-bottom: 0.5em;
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
</style>
