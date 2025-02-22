<template>
    <div class="card">
        <div class="card-content">
            <span class="card-title">Staffing Requests</span>
		</div>
		<div class="loading_container" v-if="!requests">
			<Spinner />
		</div>
		<p v-else-if="requests && requests.length === 0" class="no_request">There are no staffing requests at this time.</p>
		<div v-else>
			<table class="request_list striped">
				<thead class="request_list_head">
					<tr>
						<th>VA Name</th>
						<th>Requester</th>
						<th>Date</th>
						<th># of Pilots</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="request_list_row" v-if="requests">
          <tr v-for="(request, i) in requests" :key="request._id">
            <td class="name">
              <router-link :to="`/dash/staffingrequest/${request._id}`">
                {{ request.vaName }}
              </router-link>
            </td>
            <td class="name">{{ request.name }}</td>
            <td class="date">{{ dtLong(request.date) }}</td>
            <td class="pilots">{{ request.pilots }}</td>
            <td class="options">
              <i class="material-icons green-text" v-if="request.accepted">check</i>
              <i class="material-icons red-text text-darken-1" v-else>close</i>
              <router-link data-position="top" data-tooltip="Edit Request" class="tooltipped" :to="`/admin/events/editRequest/${request._id}`">
                <i class="material-icons">edit</i>
              </router-link>
              <a href="#" data-position="top" data-tooltip="Delete Staffing Request" class="tooltipped modal-trigger" @click.prevent="openModal(i)">
                <i class="material-icons red-text text-darken-2">delete</i>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
			<div v-if="requests && requests !== 0">
				<Pagination :amount="requestAmount" :page="page" :limit="limit" :amountOfPages="amountOfPages" />
			</div>
		</div>
		<teleport to="body">
      <div v-for="(request, i) in requests" :key="`modal_${i}`">
        <div :id="`modal_request_${i}`" class="modal modal_delete">
          <div class="modal-content">
            <h4>Delete Staffing Request?</h4>
            <p>
              This will delete the staffing request permanently. If you are unsure, click cancel.
            </p>
          </div>
          <div class="modal-footer">
            <a href="#" class="waves-effect btn" @click.prevent="deleteStaffingRequest(request._id)">Delete</a>
            <a href="#" class="modal-close waves-effect btn-flat" @click.prevent>Cancel</a>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import {zabApi} from '@/helpers/axios.js';
import Pagination from '@/components/Pagination.vue';

export default {
	name: 'staffingRequests',
	data() {
		return {
			requests: null,
			requestAmount: 1,
			page: 1,
			limit: 10,
			amountOfPages: 1
		};
	},
	components: {
		Pagination
	},
	async mounted() {
		await this.getStaffingRequests();
		this.amountOfPages = Math.ceil(this.eventAmount / this.limit);
		this.$nextTick(() => {
      M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
    });
	},
	updated() {
    this.$nextTick(() => {
      this.initModals();
    });
  },
	methods: {
		async getStaffingRequests() {
			const {data} = await zabApi.get('/event/staffingRequest', {
				params: {
					page: this.page,
					limit: this.limit
				}
			});
			this.requests = data.data.requests;
			console.log(this.requests);
			this.requestAmount = data.data.amount;
		},
		openModal(index) {
      const modal = document.getElementById(`modal_request_${index}`);
      if (modal) {
        M.Modal.getInstance(modal).open();
      }
    },
    initModals() {
      this.$nextTick(() => {
        const modals = document.querySelectorAll(".modal");
        M.Modal.init(modals, {
          preventScrolling: false,
        });
      });
    },
		async deleteStaffingRequest(_id) {
      try {
        const { data } = await zabApi.delete(`/event/staffingRequest/${_id}`);
        if (data.ret_det.code === 200) {
          this.toastSuccess("Staffing Request deleted");
          await this.getStaffingRequests();
        } else {
          this.toastError(data.ret_det.message);
        }
      } catch (e) {
        console.log(e);
      }
    },
		dtLong(dateString) {
			const date = new Date(dateString);
  			const options = { 
    			timeZone: 'America/Chicago',
    			month: 'long',
    			day: 'numeric',
    			year: 'numeric',
    			hour: 'numeric',
    			minute: 'numeric',
    			second: 'numeric',
    			hour12: true
  			};
  		return date.toLocaleString('en-US', options);
}
	},
	watch: {
		page: async function() {
			await this.getStaffingRequests();
			M.Modal.init(document.querySelectorAll('.modal'), {
				preventScrolling: false
			});
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0
			});
		}
	}
};
</script>

<style scoped lang="scss">
.request_banner {
	width: 100%;
}

.request_list_row tr {
	transition: background-color .3s ease;
	&:hover {
		background: #eaeaea;
	}
}

.request_title {
	font-weight: 700;
}

.card .card-content .event_date {
	font-size: 1.15em; 
	margin-top: -15px;

	.rotate {
		transform: rotate(90deg);
	}
}

tr th {
	text-align: left;
}

td {
	padding: 1em;
}

td a {
	transition: .3s;
	font-weight: 600;
	&:hover {
		color: $primary-color-light;
	}
}

.event_card .card-content .row {
	margin-bottom: 0;
}

.no_request {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}
</style>