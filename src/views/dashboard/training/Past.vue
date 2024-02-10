<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Current Certification Training Sessions</span>
			
		</div>
		<div class="loading_container" v-if="!pastSessions">
			<Spinner />
		</div>
		<p class="no_sessions" v-else-if="pastSessions && pastSessions.length === 0">You have not completed any training sessions for this rating yet</p>
		<div class="session_wrapper" v-if="pastSessions && pastSessions.length">
      		<!-- Loop through each rating -->
      	<div v-for="(sessions, rating) in sessionsGroupedByRating" :key="rating" class="rating-section">
        <!-- Rating Header -->
        <div class="rating-header" @click="toggleRating(rating)">
          <h>{{ rating }} <i class="material-icons">{{ isExpanded(rating) ? 'expand_less' : 'expand_more' }}</i></h>
        </div>

        <!-- Sessions Table for the Rating -->
        <div v-if="isExpanded(rating)" class="sessions-table">
          <table class="session_list striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Time(Z)</th>
                <th>Duration</th>
                <th>Milestone</th>
                <th>Instructor</th>
                <th>Check Ride</th>
                <th class="options">Options</th>
              </tr>
              <tr v-for="session in sessions" :key="session._id">
						<td class="date-cell">{{ formatDate(session.startTime) }}</td>
						<td>{{ formatTime(session.startTime) }}</td>
						<td>2 hours 45 minutes</td> <!--Need to fix for duration-->
						<td>{{(session.milestone) ? session.milestone.name : 'Unknown'}}</td>
						<td>{{session.instructor ? session.instructor.fname + ' ' + session.instructor.lname : session.instructorCid}}</td>
						<td>Passed</td> <!--Need to change to include the check ride or not-->
						<td class="options">
							<router-link :to="`/dash/training/session/${session._id}`" data-position="top" data-tooltip="View Session Details" class="tooltipped">
								<i class="material-icons">search</i>
							</router-link>
						</td>
					</tr>
				</thead>
			</table>
		</div>
		</div>
		</div>

		<div v-if="pastSessions && sessionAmount !== 0">
			<Pagination :amount="sessionAmount" :page="page" :limit="limit" :amountOfPages="amountOfPages" />
		</div>
	</div>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Completed Certification Training Sessions</span>
		</div>
		<div class="loading_container" v-if="!pastSessions">
			<Spinner />
		</div>
		<p class="no_sessions" v-else-if="pastSessions && pastSessions.length === 0">You have not completed any training sessions yet</p>
		<div class="session_wrapper" v-if="pastSessions && pastSessions.length">
      		<!-- Loop through each rating -->
      	<div v-for="(sessions, rating) in sessionsGroupedByRating" :key="rating" class="rating-section">
        <!-- Rating Header -->
        <div class="rating-header" @click="toggleRating(rating)">
          <h>{{ rating }} <i class="material-icons">{{ isExpanded(rating) ? 'expand_less' : 'expand_more' }}</i></h>
        </div>

        <!-- Sessions Table for the Rating -->
        <div v-if="isExpanded(rating)" class="sessions-table">
          <table class="session_list striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Time(Z)</th>
                <th>Duration</th>
                <th>Milestone</th>
                <th>Instructor</th>
                <th>Check Ride</th>
                <th class="options">Options</th>
              </tr>
              <tr v-for="session in sessions" :key="session._id">
						<td class="date-cell">{{ formatDate(session.startTime) }}</td>
						<td>{{ formatTime(session.startTime) }}</td>
						<td>2 hours 45 minutes</td> <!--Need to fix for duration-->
						<td>{{(session.milestone) ? session.milestone.name : 'Unknown'}}</td>
						<td>{{session.instructor ? session.instructor.fname + ' ' + session.instructor.lname : session.instructorCid}}</td>
						<td>Passed</td> <!--Need to change to include the check ride or not-->
						<td class="options">
							<router-link :to="`/dash/training/session/${session._id}`" data-position="top" data-tooltip="View Session Details" class="tooltipped">
								<i class="material-icons">search</i>
							</router-link>
						</td>
					</tr>
				</thead>
			</table>
		</div>
		</div>
		</div>

		<div v-if="pastSessions && sessionAmount !== 0">
			<Pagination :amount="sessionAmount" :page="page" :limit="limit" :amountOfPages="amountOfPages" />
		</div>
	</div>
</template>

<script>
import {zabApi} from '@/helpers/axios.js';
import Pagination from '@/components/Pagination.vue';

export default {
	name: 'PastSessions',
	data() {
		return {
			pastSessions: null,
			sessionAmount: 0,
			page: 1,
			limit: 20,
			amountOfPages: 0,
			expandedRatings: {},
		};
	},
	components: {
		Pagination
	},
	async mounted() {
		await this.getPastSessions();
		this.amountOfPages = Math.ceil(this.sessionAmount / this.limit);
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0
		});
	},
	methods: {
		async getPastSessions() {
			const {data} = await zabApi.get(`/training/sessions/past`, {
				params: {
					page: this.page,
					limit: this.limit
				}
			});
			this.pastSessions = data.data.sessions;
			this.sessionAmount = data.data.count;
		},
		formatDate(date) {
      		const d = new Date(date);
      		let month = '' + (d.getMonth() + 1),
          	day = '' + d.getDate(),
          	year = d.getFullYear();

      		if (month.length < 2) 
          		month = '0' + month;
      		if (day.length < 2) 
          		day = '0' + day;

      		return [month, day, year].join('-'); // Returns date in MM-DD-YYYY format
    	},
    	formatTime(date) {
      		const d = new Date(date);
      		let hours = '' + d.getHours(),
          		minutes = '' + d.getMinutes();

      		if (hours.length < 2) 
          		hours = '0' + hours;
      		if (minutes.length < 2) 
          		minutes = '0' + minutes;

      		return [hours, minutes].join(':'); // Returns time in HH:MM format
    	},
		toggleRating(rating) {
    		// Toggle the expanded state for the given rating
    		this.expandedRatings[rating] = !this.expandedRatings[rating];
  		},
  		isExpanded(rating) {
    		// Return the expanded state for the given rating, defaulting to false
    		return !!this.expandedRatings[rating];
  		}
	},
	computed: {
  		sessionsGroupedByRating() {
    		const groups = {};
    		this.pastSessions.forEach(session => {
      			const rating = session.rating || 'Unknown'; // Fallback for sessions without a rating
      			if (!groups[rating]) {
        			groups[rating] = [];
      			}
      			groups[rating].push(session);
    		});
    		return groups;
  		}
	}
};
</script>

<style scoped lang="scss">
.no_sessions {
	padding: 0em 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

table {
	min-width: 100%;
}

.session_wrapper {
	overflow: auto;
}

.session_list {
	width: 100%;
	table-layout: auto;

}

.date-cell {
  white-space: nowrap; /* Prevents the text from wrapping */
  overflow: hidden; /* Keeps the content from overflowing */
  text-overflow: ellipsis; /* Adds an ellipsis if the text is too long */
  min-width: 110px; /* Ensures minimum width for the date format */
}

.rating-section .sessions-table {
  max-width: 100%; /* Ensures the table container does not exceed the card */
  //overflow-x: auto; /* Adds horizontal scrolling if table is too wide */
}
</style>