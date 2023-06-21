<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Upcoming Events</span></div>
				<div class="col s4"><router-link to="/admin/events/new"><span class="btn new_event_button right">New</span></router-link></div>
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
							{{event.name}}
						</router-link><br />
					</td>
					<td class="date">
						{{dtLong(event.eventStart)}}
					</td>
          <td class="options">
            <router-link data-position="top" data-tooltip="Edit Event" class="tooltipped" :to="`/admin/events/edit/${event.url}`">
              <i class="material-icons">edit</i>
            </router-link>
            <router-link data-position="top" data-tooltip="Assign Positions" class="tooltipped" :to="`/admin/events/assign/${event.url}`">
              <i class="material-icons">group</i>
            </router-link>
            <a :href="`#modal_delete_${i}`" data-position="top" data-tooltip="Delete Event" class="tooltipped modal-trigger">
              <i class="material-icons red-text text-darken-2">delete</i>
            </a>
            <a :href="`#modal_send_${i}`" data-position="top" data-tooltip="Send Modal" class="tooltipped modal-trigger">
              <i class="material-icons green-text text-darken-2">arrow_upward</i>
            </a>
          </td>
          <div :id="`modal_send_${i}`" class="modal modal_send">
            <div class="modal-content">
              <h4>Send {{ event.name }} to the events channel.</h4>
              <div class="row">
                <div class="col s6">
                  <a href="#!" class="modal-close waves-effect waves-light btn" @click="submitForm(event.url)">Submit</a>
                </div>
                <div class="col s6">
                  <a href="#!" class="modal-close waves-effect waves-light btn-flat">Cancel</a>
                </div>
              </div>
            </div>
          </div>
					<div :id="`modal_delete_${i}`" class="modal modal_delete">
						<div class="modal-content">
							<h4>Delete Event?</h4>
							<p>This will delete the event and all information associated to it. Events should not be deleted unless they were canceled. If you are unsure, click cancel.</p>
						</div>
						<div class="modal-footer">
							<a href="#!" class="modal-close waves-effect waves-light btn" @click="deleteEvent(event.url)">Delete</a>
							<a href="#!" class="modal-close waves-effect waves-light btn-flat">Cancel</a>
						</div>
					</div>
        </tr>
			</tbody>
		</table>
	</div>
	<Past />
	<StaffingRequest />
</template>

<script>
import { zabApi } from '@/helpers/axios.js';
import Past from './Past.vue';
import StaffingRequest from './StaffingRequest.vue';
import axios from "axios";

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
    StaffingRequest
  },
  async mounted() {
    await this.getUpcomingEvents();
    M.Modal.init(document.querySelectorAll('.modal'), {
      preventScrolling: false
    });
    M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
      margin: 0
    });
  },
  methods: {
    async getUpcomingEvents() {
      const {data} = await zabApi.get('/event');
      this.events = data.data;
    },
    async deleteEvent(slug) {
      try {
        const {data} = await zabApi.delete(`/event/${slug}`);
        if (data.ret_det.code === 200) {
          this.toastSuccess('Event deleted');
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
        const eventData = await zabApi.get(`/event/${url}`);
        console.log(eventData.data.data.name);

        const positions = eventData.data.data.positions;
        const positionFields = await Promise.all(positions.map(async position => {
          if (typeof position.takenBy === 'undefined' || position.takenBy === null) {
            return {
              name: position.pos,
              value: 'Open',
              inline: true
            };
          } else {
            try {
              const res = await zabApi.get('/controller/' + position.takenBy);
              const name = res.data.data.fname + ' ' + res.data.data.lname;
              return {
                name: position.pos,
                value: name,
                inline: true
              };
            } catch (err) {
              console.log(err);
            }
          }
        }));

        const params = {
          username: "WATSN",
          avatar_url: "https://cdn.discordapp.com/avatars/1011884072479502406/feac626c2bdf43bfa8337cd3165e5a92.png?size=1024",
          content: "",
          embeds: [
            {
              "title": eventData.data.data.name,
              "description": eventData.data.data.description,
              "color": 2003199,
              "footer": { text: 'Position information provided by WATSN' },
              "fields": positionFields,
              "url": 'https://zauartcc.sfo3.digitaloceanspaces.com/events/' + eventData.data.data.url,
            }
          ]
        };
        if(eventData.data.data.discordId === undefined) {
          fetch(process.env.DISCORD_WEBHOOK + '?wait=true', {
            method: "POST",
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify(params)
          })
              .then(res => res.json())
              .then(data => {


                const updateData = {
                  url: eventData.data.data.url,
                  messageId: data.id
                };

                zabApi.post('/event/updateEvent', updateData)
                    .then(response => {
                    })
                    .catch(error => {
                      console.log(error);
                    });

              })
              .catch(error => {
                console.log(error);
              });
        }else{
          fetch(process.env.DISCORD_WEBHOOK + `/messages/${eventData.data.data.discordId}`, {
            method: "PATCH",
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify(params)
          })
              .then(res => res.json())
              .then(data => {
                console.log(data); // Access the resolved value (id) here
              })
        }



        if (data.ret_det.code === 200) {
          this.toastSuccess('Modal sent');
        } else {
          this.toastError(data.ret_det.message);
        }
      } catch (e) {
        console.log(e);
      }
    }

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
		transition: background-color .3s ease;
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
.select-wrapper {
  position: relative;
  display: inline-block;
}

.select-wrapper select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: transparent;
  padding-right: 20px;
  cursor: pointer;
}

.select-wrapper .caret {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  pointer-events: none;
}

.select-wrapper:after {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 6px 0 6px;
  border-color: #9e9e9e transparent transparent transparent;
  transform: translateY(-50%);
  pointer-events: none;
}

.select-wrapper.open:after {
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent #9e9e9e transparent;
}

</style>