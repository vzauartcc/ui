<template>
  <div class="card">
    <div class="card-content">
      <div class="header">
        <div class="card-title">Training Sessions</div>
        <div class="calendar-controls">
          <a class="btn-floating btn-small waves-effect waves-light" @click="prevMonth">
            <i class="material-icons">chevron_left</i>
          </a>
          <div class="month-year">
            {{ months[currentMonth] }} {{ currentYear }}
          </div>
          <a class="btn-floating btn-small waves-effect waves-light" @click="nextMonth">
            <i class="material-icons">chevron_right</i>
          </a>
        </div>
      </div>
      <div class="loading_container" v-if="loading === true">
        <Spinner />
      </div>
      <div class="calendar_wrapper" v-else>
        <div class="calendar z-depth-2">
          <div class="calendar_top">
            <div class="days z-depth-1">
              <div>Sunday</div>
              <div>Monday</div>
              <div>Tuesday</div>
              <div>Wednesday</div>
              <div>Thursday</div>
              <div>Friday</div>
              <div>Saturday</div>
            </div>
          </div>
          <div class="calendar-body">
            <div class="week" v-for="(week, index) in weeks" :key="index">
              <router-link
                :to="`/ins/training/requests/${urlSafeDate(date.date)}`"
                :class="`day ${date.requests.length > 0 ? 'has_request' : ''}`"
                v-for="date in week"
                :key="date.date"
              >
                <div class="week_date">
                  <span
                    :class="[
                      (new Date(date.date).getTime() - new Date().getTime() < 0 ? 'past_date' : ''),
                      (new Date().getUTCDate() === new Date(date.date).getUTCDate() ? 'current_date' : '')
                    ]"
                  >
                    {{ new Date(date.date).toUTCString().slice(5, 11) }}
                  </span>
                </div>
                <div
                  :class="`date_requests ${new Date(date.date).getTime() - new Date().getTime() < 0 ? 'past' : ''}`"
                  v-if="date.requests.length > 0"
                >
                  {{ date.requests.length }} request<span v-if="date.requests.length > 1">s</span>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { zabApi } from '@/helpers/axios.js';

export default {
  name: 'TrainingSessions',
  title: 'Training Sessions',
  data() {
    return {
      dates: [],
      weeks: [],
      loading: true,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    };
  },
  async mounted() {
    this.calculateDates();
    await this.getRequests();
  },
  methods: {
    async getRequests() {
      try {
        const { data } = await zabApi.get('/training/request/open', {
          params: {
            period: this.dates.length, // Request for the entire month
          },
        });

        for (const request of data.data) {
          for (const date of this.dates) {
            if (date.date.slice(0, 10) === new Date(new Date(request.startTime)).toISOString().slice(0, 10)) {
              date.requests.push(request);
            }
          }
        }
        this.loading = false;
      } catch (e) {
        console.log(e);
      }
    },
    calculateDates() {
      this.dates = [];
      const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      const startDate = firstDayOfMonth.getDay() === 0 ? firstDayOfMonth : new Date(firstDayOfMonth.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay()));
      const endDate = lastDayOfMonth.getDay() === 6 ? lastDayOfMonth : new Date(lastDayOfMonth.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay())));

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        this.dates.push({
          date: new Date(d).toISOString(),
          requests: [],
        });
      }

      this.weeks = [];
      for (let i = 0; i < this.dates.length; i += 7) {
        this.weeks.push(this.dates.slice(i, i + 7));
      }
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.calculateDates();
      this.getRequests();
    },
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.calculateDates();
      this.getRequests();
    },
    urlSafeDate(date) {
      return new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
    },
  },
};
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-controls {
  display: flex;
  align-items: center;

  .btn-floating {
    background-color: #2196F3;
    margin: 0 0.5em;
  }

  .month-year {
    font-size: 1.5rem;
    font-weight: 500;
  }
}

.calendar_title {
  font-size: 1.8rem;
  font-weight: 300;
  text-align: center;
  margin-top: -10px;
  margin-bottom: 10px;
}

.calendar_wrapper {
  margin-top: 1em;
  padding: .25em;
}

.calendar {
  display: flex;
  overflow: auto;
  flex-direction: column;

  .week {
    display: flex;

    .day {
      display: block;
      width: 14.285%;
      min-width: 90px;
      height: 5em;
      padding: .4em;
      text-align: right;
      border-bottom: 1px solid $gray_light;
      transition: .3s ease;

      & + .day {
        border-left: 1px solid $gray_light;
      }

      &:hover {
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .12), 0 1px 5px 0 rgba(0, 0, 0, .20);
      }

      .current_date {
        background-color: $primary-color-light;
        color: #fff !important;
        padding: .2em .5em;
        border-radius: 1em;
      }

      .past_date {
        color: #9e9e9e;
      }

      .date_requests {
        text-align: center;
        font-size: .9rem;
        color: $secondary-color-dark;
        margin-top: .5em;

        &.past {
          color: $secondary-color-light;
        }
      }
    }
  }

  .days {
    display: flex;

    div {
      background: $primary-color-light;
      color: #fff;
      width: 14.285%;
      min-width: 90px;
      padding: .4em;
      text-align: center;
    }
  }
}
</style>
