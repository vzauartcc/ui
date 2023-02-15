<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Controller Schedule</span></div>
                <div class="col s4"><router-link to="/dash/scheduling/new"><span class="btn new_event_button left schedule-button">Schedule</span></router-link><span class="btn new_event_button right" @click.native="nextDate">Next</span><span class="btn new_event_button right" @click.native="prevDate">Prev</span></div>
			</div>
            <p class="date" v-if="sessions && sessions.length !== 0">Current Selected Date {{ new Date(currentDate).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'numeric', day: 'numeric', year: 'numeric' }) }} </p>
		</div>
		<div v-if="sessions === null">
            <div class="card-content loading">s
                <Spinner />
            </div>
        </div>
        <div v-else>
            <div class="card-content">
                <p class="no_schedule" v-if="sessions && sessions.length === 0">
                    There is no ATC availability scheduled for {{ new Date(currentDate).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'numeric', day: 'numeric', year: 'numeric' }) }}.
                </p>
            </div>
            <div class="table_wrapper" v-if="sessions && sessions.length !== 0">
                <table>
                    <thead>
                        <tr>
						    <th>Controller</th>
						    <th>Start Time</th>
						    <th>End Time</th>
						    <th>Position</th>
                            <th class="options">Options</th>
					    </tr>
				    </thead>
				    <tbody class="position_list_row" v-if="sessions">
					    <tr v-for="session in sortedSessions" :key="session._id">
						    <td>{{ session.submitter.fname }} {{ session.submitter.lname }}</td> 
						    <td>{{session.startTime.toLocaleString('en-US', {timeZone: 'America/Chicago', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'})}}</td>
						    <td>{{session.endTime.toLocaleString('en-US', {timeZone: 'America/Chicago', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'})}}</td>
						    <td>{{ session.facility }}_{{ session.position.id }}</td>
                            <td class="options">
                                <template v-if="this.user.data.cid === session.submitter.cid || this.user.data.isMgt === true">
								<!--<router-link data-position="top" data-tooltip="Edit Session" class="tooltipped" :to="`/scheduling/session/${session._id}`"><i class="material-icons">edit</i></router-link>-->
								<a :href="`#modal_delete_${session._id}`" data-position="top" data-tooltip="Remove Session" class="tooltipped modal-trigger"><i class="material-icons red-text text-darken-2">delete</i></a>
                                </template>
						</td>
					    
                        <div :id="`modal_delete_${session._id}`" class="modal modal_delete">
								<div class="modal-content">
									<h4>Delete Session?</h4>
									<p>This will remove your presently scheduled session.</p>
                                    <p>This only affects the display on the main page.</p>
								</div>
								<div class="modal-footer">
									<a href="#!" @click="removeSession(session._id)" class="btn waves-effect">Remove</a>
									<a href="#!" class="btn-flat waves-effect modal-close">Cancel</a>
								</div>
							</div>
                        </tr>
				    </tbody>
			    </table>
		    </div>
	    </div>
    </div>
</template>  

<script>
import { zabApi } from "@/helpers/axios.js";
import { mapState } from 'vuex';
  


export default {
    name: 'SchedulingDash',
	title: 'Scheduling',
    data() {
        return {
            currentDate: new Date().toISOString().substring(0, 10),
            showModal: false,
            sessions: []
        };
    },
    mounted() {
        this.getSessions();
        this.$watch('sessions', () => {
            this.$nextTick(() => {
                M.Modal.init(document.querySelectorAll('.modal'), {
                    preventScrolling: false
                });
                M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
                    margin: 0
                });
            });
        });
    },
    computed: {
        ...mapState('user', ['user']),
        sortedSessions() {
            return this.sessions.sort((a, b) => {
            const startTimeDiff = new Date(a.startTime) - new Date(b.startTime);
            if (startTimeDiff !== 0) {
                return startTimeDiff;
            }
            // if start times are the same, sort by end time
            return new Date(a.endTime) - new Date(b.endTime);
            });
        }
    },
    methods: {
        prevDate() {
            const chicagoDate = new Date(this.currentDate).toLocaleString('en-US', { timeZone: 'America/Chicago' });
            this.currentDate = new Date(new Date(chicagoDate).setDate(new Date(chicagoDate).getDate() - 1)).toISOString().substring(0, 10);
            this.getSessions();
        },
        nextDate() {
            const chicagoDate = new Date(this.currentDate).toLocaleString('en-US', { timeZone: 'America/Chicago' });
            this.currentDate = new Date(new Date(chicagoDate).setDate(new Date(chicagoDate).getDate() + 1)).toISOString().substring(0, 10);
            this.getSessions();
        },
        async getSessions() {
            try {
                // Convert the current date to Chicago time
                const chicagoTime = new Date(new Date(this.currentDate + 'T00:00:00').toLocaleString("en-US", {timeZone: "America/Chicago"}));

                // Get the day before the current day
                const yesterday = new Date(chicagoTime.getTime());
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toISOString().slice(0, 10);
                // Get data from Database
                const { data } = await zabApi.get('/scheduling/sessions', {
                  params: {
                    startTime: yesterdayString,
                  },
                });
                const currentDate = new Date(new Date(this.currentDate).toLocaleString("en-US", {timeZone: "America/Chicago"}));
                this.sessions = data
                .map(session => ({
                    ...session,
                    startTime: new Date(new Date(session.startTime).toLocaleString("en-US", {timeZone: "America/Chicago"})),
                    endTime: new Date(new Date(session.endTime).toLocaleString("en-US", {timeZone: "America/Chicago"}))
                }))
                .filter(session => {
                    return session.startTime.toLocaleDateString() === currentDate.toLocaleDateString();
                });
            } catch (error) {
              console.error(error);
            }
        },
        async removeSession(_id) {
            try {
                //console.log(this.sessions);
                this.toastInfo('Removing session...');
                let sessionToRemove = this.sessions.find(session => session._id === _id);
                //console.log(sessionToRemove)
                if (!sessionToRemove) {
                    console.error('Session not found');
                    this.toastError('Session not found');
                    return;
                }
                // Make a delete request to the API
                const { data } = await zabApi.delete(`/scheduling/sessions/${sessionToRemove._id}`, {
                    data: {
                        reason: this.reason
                    }
                });
                //console.log('Session removed successfully');
                this.toastSuccess('Session removed successfully');
                this.getSessions();
            } catch (error) {
                console.error(error);
                this.toastError('Error removing session');
            }
        },
    }
}
</script>

<style>

.no_schedule {
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

.position_list_row {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}
.date {
    position: fixed;
color: darkkhaki;
}
.schedule-button {
  background-color: lightcoral;
}

</style>