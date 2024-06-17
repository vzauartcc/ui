<template>
  <div>
    <div class="card">
      <div class="card-content">
        <div class="row row_no_margin">
          <span class="card-title col s12 m8">Trainers</span>
          <div class="input-field col s12 m4">
            <input autocomplete="off" @keyup="filterTrainers" v-model="filter" type="text" placeholder="Search for a trainer">
            <span class="helper-text right">Search by CID, name, or operating initials</span>
          </div>
        </div>
      </div>
      <div class="loading_container" v-if="!trainers">
        <Spinner />
      </div>
      <div class="table_wrapper" v-else>
        <table class="striped compact">
          <thead class="controller_list_head">
            <tr>
              <th>CID</th>
              <th>Name</th>
              <th>Rating</th>
              <th>MTR/INS</th>
              <th>Assignments</th>
              <th>Evaluator</th>
              <th class="options">Options</th>
            </tr>
          </thead>
          <tbody class="controller_list_row">
            <tr v-for="trainer in trainersFiltered" :key="trainer.trainer.cid">
              <td>{{ trainer.trainer.cid }}</td>
              <td>{{ trainer.trainer.fname }} {{ trainer.trainer.lname }}</td>
              <td>{{ trainer.trainer.ratingShort }}</td>
              <td>{{ getRole(trainer.trainer.roleCodes) }}</td>
              <td>{{ trainer.assignments.length }}</td>
              <td>{{ trainer.trainerProfile.canConductEVAL ? 'Yes' : 'No' }}</td>
              <td class="options">
                <router-link :to="`/ta/trainers/edit/${trainer.trainer.cid}`"><i class="material-icons">edit</i></router-link>
                <a @click="openRemoveModal(trainer)"><i class="material-icons red-text">delete</i></a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div ref="removeModal" id="removeModal" class="modal">
  <div class="modal-content">
    <h4>Confirm Removal</h4>
    <p>Are you sure you want to remove this trainer?</p>
    <!-- Show spinner when currentTrainerDetails is null -->
    <div v-if="currentTrainerDetails === null">
      <Spinner />
    </div>
    <!-- Show this section if currentTrainerDetails is not null and has length -->
    <div v-else-if="currentTrainerDetails && currentTrainerDetails.length > 0">
      <p>They are currently assigned to the following users:</p>
      <ul>
        <li v-for="user in currentTrainerDetails" :key="user.cid" class="red-text">
          {{ user.fname }} {{ user.lname }}
        </li>
      </ul>
    </div>
  </div>
  <div class="modal-footer">
    <a href="javascript:void(0);" class="modal-close waves-effect waves-red btn-flat">No</a>
    <!-- Disable the "Yes" button if currentTrainerDetails is null or has assignments -->
    <!-- "Yes" button when it should be enabled -->
    <a v-if="!isYesButtonDisabled" href="javascript:void(0);" 
      class="modal-close waves-effect waves-green btn-flat" 
      @click="confirmDelete">Yes</a>

    <!-- "Yes" button when it should be disabled -->
    <a v-else href="javascript:void(0);" 
      class="modal-close waves-effect waves-green btn-flat" 
      disabled>Yes</a>
  </div>
</div>

  </div>
</template>

<script>

import { mapState } from 'vuex';
import { zabApi } from '@/helpers/axios.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
const endDate = document.getElementById('end_date');

export default {
	computed: {
		...mapState('user', [
			'user'
		]),
    sortedTrainers() {
      // Assuming 'trainers' array is populated and each 'trainer' object has a 'rating' property
      if (!this.trainers) return [];
    
      return this.trainers.sort((a, b) => {
        // Convert ratings to numbers if they aren't already, and subtract to get descending order
        return Number(b.trainer.rating) - Number(a.trainer.rating);
      });
    },
    trainersFiltered() {
      if (!this.filter.trim()) return this.sortedTrainers; // Use sortedTrainers instead of trainers
      const search = new RegExp(this.filter, 'i');
      return this.sortedTrainers.filter(({ trainer }) => { // Use sortedTrainers here as well
        return trainer.fname.match(search) ||
          trainer.lname.match(search) ||
          trainer.oi.match(search) ||
          trainer.cid.toString().match(search);
      });
    },
    isYesButtonDisabled() {
      const disabled = !this.currentTrainerDetails || this.currentTrainerDetails.length > 0;
      return disabled;
    }
	},
	name: 'Trainers',
	title: 'Trainers',
	data() {
		return {
			trainers: null,
			filter: '',
      position: null,
      currentTrainerCidToDelete: null,
      ecid: null,
      currentTrainerDetails: null,

		};
	},
	async mounted() {

    await this.getTrainers();
    
    const today = new Date(new Date().toUTCString());
    flatpickr('#otsDate', {
      date: null,
      dateFormat: 'Y-m-d',
      minDate: today,
    });
		this.$nextTick(() => {
      M.Modal.init(this.$refs.removeModal);
    });
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0
		});

	},
	methods: {
		async getTrainers() {
      try {
        const { data } = await zabApi.get('/training/trainers/assignments');
        this.trainers = data.data; // Assuming each item has a 'trainer' object
      } catch (error) {
        console.error("Failed to fetch trainers:", error);
        // Handle error appropriately
      }
    },
    getRole(roleCodes) {
      if (roleCodes.includes('ins')) {
        return 'INS';
      } else if (roleCodes.includes('mtr')) {
        return 'MTR';
      }
      return 'N/A'; // Default case if neither role is found
    },
    async openRemoveModal(trainer) {
      this.currentTrainer = trainer.trainer; // Assuming 'trainer' object has a 'trainer' sub-object.
      this.currentTrainerDetails = null; // Indicate loading by setting to null

      try {
        // Extract cids from the trainer's assignments
        const cids = trainer.assignments.map(assignment => assignment.cid);

        // Check if there are no cids (assignments) and set currentTrainerDetails to an empty array
        if (cids.length === 0) {
          this.currentTrainerDetails = [];
          const modal = M.Modal.getInstance(this.$refs.removeModal);
          modal.open();
          return; // Exit the function early
        }
        // Generate promises to fetch details for each cid
        const trainerDetailsPromises = cids.map(cid => 
          zabApi.get(`/controller/${cid}`) // Assuming this endpoint returns user details including fname and lname
        );

        // Await all promises to resolve
        const trainerDetailsResponses = await Promise.all(trainerDetailsPromises);

        // Map responses to extract only cid, fname, and lname
        this.currentTrainerDetails = trainerDetailsResponses.map(response => ({
          cid: response.data.data.cid, // Note the additional .data
            fname: response.data.data.fname,
            lname: response.data.data.lname,
        }));

        // If you need to fetch details, replace the above mapping with your fetch logic
      } catch (error) {
        console.error("Failed to process trainer details:", error);
        this.currentTrainerDetails = []; // Handle error case
      }

      // Open the modal
      const modal = M.Modal.getInstance(this.$refs.removeModal);
      modal.open();
    },


    confirmDelete() {
      // Use this.currentTrainerCidToDelete to delete the trainer
      // Implement deletion logic here...
    },
    async removeTrainer() {
      await zabApi.post
    }
	}
};
</script>

<style scoped lang="scss">
.table_wrapper {
	width: 100%;
	overflow: auto;
}

.input-field {
	margin-top: 0;
}

.name {
	color: $primary-color;

	font-weight: 700;
}
.rating {
	font-weight: 400;
}

table tbody {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

.type_trainer {
	vertical-align: top;
	margin-top: .4em;
}
</style>
