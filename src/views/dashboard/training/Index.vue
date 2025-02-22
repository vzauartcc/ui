<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Training Requests</span></div>
				<div class="col s4"><router-link to="/dash/training/new"><span class="btn new_event_button right">Request</span></router-link></div>
			</div>
		</div>
		<div class="loading_container" v-if="!upcomingSessions">
			<Spinner />
		</div>

		<p class="no_sessions" v-else-if="upcomingSessions && upcomingSessions.length === 0">You have no upcoming training sessions.</p>

		<div class="session_wrapper" v-else>
			<table class="session_list striped">
				<thead class="session_list_head">
					<tr>
						<th>Milestone</th>
						<th>Start Time</th>
						<th>End Time</th>
						<th>Instructor</th>
						<th class='options'>Options</th>
					</tr>
				</thead>
				<tbody class="session_list_row" v-if="upcomingSessions">
					<tr v-for="session in upcomingSessions" :key="session._id">
    				<td>{{session.milestone.code + ' - ' + session.milestone.name}}</td>
    				<td>{{dtLong(session.startTime)}}</td>
    				<td>{{dtLong(session.endTime)}}</td>
    				<td>{{session.instructor ? (session.instructor.fname + ' ' + session.instructor.lname) : 'Unfulfilled'}}</td>
    				<td class="options">
        			<a href="#" @click.prevent="openModal(session._id)" data-position="top" data-tooltip="Cancel Training Session"
        				class="tooltipped modal-trigger"><i class="material-icons red-text text-darken-2">cancel</i></a>
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
            <a href="#" @click="deleteSession(session._id)" class="btn waves-effect modal-close">Delete</a>
            <a href="#" class="btn-flat waves-effect modal-close">Cancel</a>
          </div>
        </div>
    	</div>
		</teleport>
	</div>
	<PastSessions />
</template>

<script>
import {zabApi} from '@/helpers/axios.js';
import PastSessions from './Past.vue';

export default {
	name: 'TrainingDash',
	title: 'Training',
	data() {
		return {
			upcomingSessions: null
		};
	},
	components: {
		PastSessions
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
			const {data} = await zabApi.get(`/training/request/upcoming`);
			this.upcomingSessions = data.data;
		},
		openModal(id) {
        const modal = document.getElementById(`modal_delete_${id}`);
        if (modal) {
            M.Modal.getInstance(modal).open();
        }
    },
		async deleteSession(id) {
			try {
				const { data } = await zabApi.delete(`/training/request/${id}`);

				if(data.ret_det.code === 200) {
					this.toastSuccess('Training request deleted');
					await this.getUpcomingSessions();
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch(e) {
				console.log(e);
			}
		}
	}

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
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}
</style>
