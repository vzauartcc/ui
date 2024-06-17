<template>
  <div class="card requesting-training">
    <span class="card-title col s12 m12 no_margin">Requesting Training</span>
    <!-- Spinner shown when data is loading (assuming matchedTrainingTrainees is null) -->
    <div class="loading_container" v-if="matchedRequestedTrainingTrainees === null">
      <Spinner />
    </div>
    <!-- Message shown when there are no requests (assuming matchedTrainingTrainees is an empty array) -->
    <p class="no_requests" v-else-if="matchedRequestedTrainingTrainees && matchedRequestedTrainingTrainees.length === 0">There are no controllers requesting training.</p>
    <!-- Data table shown when there are requests -->
    <table class="highlight" v-else>
      <thead>
        <tr>
          <th>CID</th>
          <th>Trainee Name</th>
          <th>Rating</th>
          <th>Requested Module</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trainee in matchedRequestedTrainingTrainees" :key="trainee.id">
          <td>{{ trainee.cid }}</td>
          <td>{{ trainee.fname }} {{ trainee.lname }}</td>
          <td>{{ trainee.ratingShort }}</td>
          <td>{{ trainee.modulesInProgress[0].moduleId.name }}</td>
          <td class="actions">
                <a @click="openApprovalModal(trainee)"><i class="material-icons green-text">check</i></a>
                <a @click="openRemoveModal(trainee)"><i class="material-icons red-text">delete</i></a>
              </td>
        </tr>
      </tbody>
    </table>

    <!-- Materialize Modal for Approving a Trainee -->
<div id="approve-modal" class="modal modal-fixed-footer" ref="approveModal">
  <div class="modal-content">
    <h5>Approve Trainee</h5>
    <span v-if="selectedTrainee?.modulesInProgress?.[0]?.moduleId?.name">
      {{ selectedTrainee.modulesInProgress[0].moduleId.name }}
    </span>
    <div class="row"> <!-- Start of the row -->
      <!-- Dropdown for Trainer 1 Selection -->
      <div class="col s12 m6">
        <label for="trainer1">Trainer 1:</label>
        <select id="trainer1" v-model="selectedTrainer1">
          <option value="" disabled selected>Choose your option</option>
          <option v-for="trainer in trainers" :value="trainer._id">{{trainer.fname}} {{trainer.lname}}</option>
        </select>
      </div>

      <!-- Dropdown for Trainer 2 Selection -->
      <div class="col s12 m6">
        <label for="trainer2">Trainer 2:</label>
        <select id="trainer2" v-model="selectedTrainer2">
          <option value="" disabled selected>Choose your option</option>
          <option v-for="trainer in trainers" :value="trainer._id">{{trainer.fname}} {{trainer.lname}}</option>
        </select>
      </div>
    </div> <!-- End of the row -->

    <!-- Checkbox for Extension Modules -->
    <p>Extension Modules:</p>
    <p v-for="module in extensionModules" :key="module.id">
      <label>
        <input type="checkbox" :value="module.id" v-model="selectedModules"/>
        <span>{{ module.name }}</span>
      </label>
    </p>
  </div>
  <div class="modal-footer">
    <a href="javascript:void(0);" class="modal-close waves-effect waves-green btn-flat" @click="approveTrainee">Approve</a>
    <a href="javascript:void(0);" class="modal-close waves-effect waves-red btn-flat">Cancel</a>
  </div>
</div>


  </div>
</template>


<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import { zabApi } from '../../../../helpers/axios';

export default {
  data() {
    return {
      selectedTrainee: null,
      selectedModules: [],
      trainers: [], // Populate this array with your trainers
      extensionModules: [], // Populate based on the selected trainee's requested module
      selectedTrainer1: '',
      selectedTrainer2: '',
    };
  },
  computed: {
    ...mapState({
      trainingModules: state => state.trainingModules,
    }),
    ...mapGetters('trainee', [
      'requestedTrainingTrainees',
      'matchedRequestedTrainingTrainees',
       // Add this line to map the getter
    ]),
  },
  methods: {
    ...mapActions('trainee', ['updateTraineeStatusAction']),
    async openApprovalModal(trainee) {
      this.selectedTrainee = trainee;
      console.log(this.selectedTrainee);
      // Reset selections
      this.selectedModules = [];
      // Populate extensionModules based on trainee's requestedModule
      // This might involve fetching additional data or filtering an existing list
      const { data } = await zabApi.get(`/training/trainers/by-module/${trainee.modulesInProgress[0].moduleId.id}`);
      this.trainers = data.data;
      console.log(this.trainers);

      this.$nextTick(() => {
        // Ensure Vue has updated the DOM
        const selects = this.$el.querySelectorAll('select');
        M.FormSelect.init(selects);
      });
      
      const elem = this.$refs.approveModal;
      const instance = M.Modal.init(elem);
      instance.open();
    },
    async approveTrainee() {
      const updatePayload = {
        cid: this.selectedTrainee.cid,
        moduleInProgressUpdate: {
          moduleId: this.selectedTrainee.modulesInProgress[0].moduleId._id,
          status: 2,
          trainingTeam: {
            trainers: [this.selectedTrainer1, this.selectedTrainer2],
            assignedDate: new Date().toISOString()
          }
        }
      };

      try {
        const response = await zabApi.put(`/training/trainingProgress/${updatePayload.cid}`, updatePayload);
        console.log('Update successful', response.data);
        // Dispatch the action here
        this.$store.dispatch('trainee/updateTraineeStatusAction', {
          cid: this.selectedTrainee.cid,
          moduleInProgressUpdate: {
            moduleId: this.selectedTrainee.modulesInProgress[0].moduleId._id,
            status: 2, // New status
            trainingTeam: {
              trainers: [this.selectedTrainer1, this.selectedTrainer2],
              assignedDate: new Date().toISOString(),
            },
          },
        });
      } catch (e) {
        console.error('Update failed', e.response ? e.response.data : e);
      }
    },
    validateTrainerSelection() {
      if (this.selectedTrainer1 === this.selectedTrainer2 && this.selectedTrainer1 !== '' && this.selectedTrainer2 !== '') {
        // Show an error message or use some other means to notify the user
        this.toastError("Trainer 1 and Trainer 2 cannot be the same.");
        // Reset the second selection or handle as appropriate
        this.selectedTrainer2 = '';
        return false;
      }
      return true;
    },
  },
  mounted() {
    // Initialize all modals once the component is mounted
    this.$nextTick(() => {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
  });
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
    // Load trainers and potentially extension modules if static
    // this.trainers = fetchTrainers();
  }
};
</script>

<style scoped>

.modal_title {
	font-size: 1.8em;
	margin-bottom: .5em;
}

.no_requests {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.requests {
	#comments {
		font-family: inherit;
		white-space: pre-wrap;
		overflow: hidden;
		width: 100%;
	}
}

</style>