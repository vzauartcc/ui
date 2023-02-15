<template>
  <div id="scheduling">
    <div v-if="sessions === null" class="loading_container">
      <Spinner />
    </div>
    <div v-else-if="sessions.length === 0">
      <p>There is no planned ATC availability for this date.</p>
    </div>
    <div v-else>
      <div class="card" v-for="session in sortedSessions" :key="session._id">
        <div class="card-header">
          <p>{{ session.facility2.name }} {{ session.position.name }}</p>
        </div>
        <div class="card-body">
          <p>{{ session.submitter.fname }} {{ session.submitter.lname }}</p>
       <div class="card-time">
        <p>{{ formatStartTime(session.startTime, this.localDate) }}-{{ formatEndTime(session.endTime, this.localDate) }}</p>
          <p>{{ formatStartTimeZ(session.startTimeZ) }}-{{ formatEndTimeZ(session.endTimeZ, session.startTimeZ) }}</p>
       </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { zabApi } from "@/helpers/axios.js";
import moment from "moment-timezone";

export default {
  props:{
    currentDate: {
      type: Date,
      required: true
    }
  },
  data() {
    return {
      sessions: null,
      formattedDate: null,
      localDate: null,
      timezone: 'America/Chicago',
      currentTime: null,
    };
  },
  mounted() {
    this.currentTime = moment().tz(this.timezone).format('h:mm:ss a');
  },
  created() {
    this.localDate = this.currentDate;
    console.log(this.localDate);
    this.fetchSessions();
    
  },
  computed: {
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
    async fetchSessions() {
      try {
        // Convert the current date to Chicago time
        const chicagoTime = new Date(new Date(this.localDate).toLocaleString("en-US", {timeZone: "America/Chicago"}));
        //console.log('chicagoTime:', chicagoTime);

        // Get the day before the current day
        const yesterday = new Date(chicagoTime.getTime());
        yesterday.setDate(yesterday.getDate() - 1);
        //console.log('yesterday:', yesterday);

        const yesterdayString = yesterday.toISOString().slice(0, 10);
        //console.log('yesterdayString:', yesterdayString);

        // Get data from Database for the previous day
        const { data } = await zabApi.get('/scheduling/sessions', {
          params: {
            startTime: yesterdayString,
          },
        });
        //console.log('data:', data);

        const currentDate = new Date(new Date(this.localDate).toLocaleString("en-US", {timeZone: "America/Chicago"}));
        //console.log('currentDate:', currentDate);

        this.sessions = data
        .map(session => ({
          ...session,
          startTimeZ: session.startTime,
          endTimeZ: session.endTime,
          startTime: new Date(new Date(session.startTime).toLocaleString("en-US", {timeZone: "America/Chicago"})),
          endTime: new Date(new Date(session.endTime).toLocaleString("en-US", {timeZone: "America/Chicago"}))
        }))
        .filter(session => {
          return session.startTime.toLocaleDateString() === currentDate.toLocaleDateString();
        });

      console.log('this.sessions:', this.sessions);
      } catch (error) {
        console.error(error);
      }
    },
    
    formatStartTime(startTime, localDate) {
      const startTimeDate = new Date(startTime);
      const localDateDate = new Date(localDate);

      const timeString = startTimeDate.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', timeZoneName: 'short', hour12: true, hour: 'numeric', minute: 'numeric' });
      const dateString = startTimeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return (startTimeDate.getMonth() !== localDateDate.getMonth() || startTimeDate.getDate() !== localDateDate.getDate()) ? `${dateString} ${timeString}` : timeString;
    },

    formatEndTime(endTime, localDate) {
      const endTimeDate = new Date(endTime);
      const localDateDate = new Date(localDate);

      const timeString = endTimeDate.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', timeZoneName: 'short', hour12: true, hour: 'numeric', minute: 'numeric' });
      const dateString = endTimeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return (endTimeDate.getMonth() !== localDateDate.getMonth() || endTimeDate.getDate() !== localDateDate.getDate()) ? `${dateString} ${timeString}` : timeString;
    },
    
    getShortMonth(month) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return months[month]
    },
    
    formatHours(hours) {
      return hours.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    },

    formatMinutes(minutes) {
      // Add leading zero if less than 10
      return minutes < 10 ? `0${minutes}` : minutes
    },

    formatStartTimeZ(startTimeZ) {
      const date = new Date(startTimeZ)
      const month = date.getUTCMonth()
      const day = date.getUTCDate()
      const hours = date.getUTCHours()
      const minutes = date.getUTCMinutes()

      // Check if time is 24:00
      if (hours === 24) {
        hours = 0
        date.setUTCDate(date.getUTCDate() + 1) // increment day
      }

      // Check if month and day match localDate
      if (month !== this.localDate.getMonth() || day !== this.localDate.getDate()) {
        return `${this.getShortMonth(month)} ${day}, ${this.formatHours(hours)}:${this.formatMinutes(minutes)}Z`
      } else {
        return `${this.formatHours(hours)}:${this.formatMinutes(minutes)}Z`;
      }
    },
    
    formatEndTimeZ(endTimeZ, startTimeZ) {
      const date = new Date(endTimeZ);
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      const start = new Date(startTimeZ);
      const startMonth = start.getUTCMonth();
      const startDay = start.getUTCDate();

      if (month !== startMonth || day !== startDay) {
        return `${this.getShortMonth(month)} ${day}, ${this.formatHours(hours)}:${this.formatMinutes(minutes)}Z`;
      } else {
        return `${this.formatHours(hours)}:${this.formatMinutes(minutes)}Z`;
      }

    }
  },
  watch: {
    currentDate(newValue) {
      this.localDate = newValue
      this.fetchSessions()
    }
  },
}
</script>

<style scoped lang="scss">

.card {
  width: 320px;
}
</style>