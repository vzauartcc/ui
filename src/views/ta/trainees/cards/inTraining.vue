<template>
  <div class="card in-training">
    <span class="card-title col s12 m12 no_margin">In Training</span>
    <!-- Spinner shown when data is loading -->
    <div class="loading_container" v-if="inTrainingTrainees === null">
      <Spinner />
    </div>
    <!-- Message shown when there are no trainees currently in training -->
    <p class="no_trainees" v-else-if="inTrainingTrainees && inTrainingTrainees.length === 0">There are no controllers currently in training.</p>
    <!-- Data table shown when there are trainees in training -->
    <table class="highlight" v-else>
      <thead>
        <tr>
          <th>CID</th>
          <th>Trainee Name</th>
          <th>Rating</th>
          <th>Current Module</th>
          <th>Progress</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trainee in matchedInTrainingTrainees" :key="trainee.cid">
          <td>{{ trainee.cid }}</td>
          <td>{{ trainee.fname }} {{ trainee.lname }}</td>
          <td>{{ trainee.ratingShort }}</td>
          <td>{{ trainee.modulesInProgress[0].moduleId.name }}</td>
          <td>{{ calculateProgress(trainee) }}</td>
          <td class="actions">
            <a @click="openUpdateProgressModal(trainee)"><i class="material-icons blue-text">update</i></a>
            <a @click="openChangeTrainerModal(trainee)"><i class="material-icons orange-text">swap_horiz</i></a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- Update Progress Modal -->
  <div id="update-progress-modal" class="modal" ref="updateProgressModal">
    <div class="modal-content">
      <h5>Training Progress</h5>
      <div v-if="selectedModule">
        <p>{{ selectedModule.name }}</p>
        <table class="courses-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Type</th>
              <th>Facility</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in selectedModule.courses" :key="course._id">
              <td>{{ course.courseName }}</td>
              <td :class="'bold capitalized type-cell'">{{ formatType(course.type) }}</td>
              <td :class="'bold facility-cell'">{{ formatFacility(course.facility) }}</td>
              <td class="status-cell">
                <div class="completion-status" :class="{'completed': course.isCompleted}">
                  <span v-if="course.isCompleted" class="completed-status">
                    &#10004; <span class="completion-date">{{ course.completionDate }}</span>
                  </span>
                  <span v-else class="in-progress-box">In Progress</span>
                </div>
              </td>
              <td class="options-col">
                <!-- Classroom Course: Not Completed -->
                <a v-if="course.type === 'classroom' && !course.isCompleted" 
                  @click.prevent="openCreateNotesModal(course)" 
                  class="waves-effect waves-light red-text btn-flat">
                  <i class="material-icons">create</i>
                </a>
                <!-- Classroom Course: Completed -->
                <a v-else-if="course.type === 'classroom' && course.isCompleted" 
                  @click.prevent="viewNotes(course)" 
                  class="waves-effect waves-light green-text btn-flat">
                  <i class="material-icons">event_note</i>
                </a>
  
                <!-- Exam: Completed or Attempted -->
                <a v-if="course.type === 'exam' && (course.isCompleted || course.attempted)" 
                  @click.prevent="viewExamResults(course)" 
                  class="waves-effect waves-teal btn-flat">
                  <i class="material-icons">event_note</i>
                </a>
  
                <!-- Other Types: Not Completed or Notes Available -->
                <a v-if="course.type !== 'classroom' && course.type !== 'exam' && !course.isCompleted" 
                  @click.prevent="openCreateNotesModal(course)" 
                  class="waves-effect waves-teal btn-flat">
                  <i class="material-icons">create</i>
                </a>
                <a v-else-if="course.type !== 'classroom' && course.type !== 'exam' && (course.isCompleted || course.notes)" 
                  @click.prevent="viewNotes(course)" 
                  class="waves-effect waves-teal btn-flat">
                  <i class="material-icons">event_note</i>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <a href="javascript:void(0);"  class="modal-close waves-effect waves-green btn-flat">Close</a>
      <!-- Add more buttons here as needed for additional actions -->
    </div>
  </div>
  <!-- Change Trainer Modal -->
  <div id="changeTrainerModal" class="modal custom-modal-size modal-fixed-footer" ref="changeTrainerModal">
    <div class="modal-content">
      <h4>Change Trainer</h4>
      <!-- Display Current Trainers -->
      <div class="current-trainers">
        <h6 class="trainers-list">Current Trainers:</h6>
        <p class="trainers-list" v-if="selectedTrainee && selectedTrainee.modulesInProgress && selectedTrainee.modulesInProgress[0].trainingTeam.trainers && selectedTrainee.modulesInProgress[0].trainingTeam.trainers.length">
          <span v-if="selectedTrainee.modulesInProgress[0].trainingTeam.trainers[0]">
            {{ selectedTrainee.modulesInProgress[0].trainingTeam.trainers[0].fname }} {{ selectedTrainee.modulesInProgress[0].trainingTeam.trainers[0].lname }}
          </span>
          <!-- Using margin for spacing -->
          <span class="trainer-spacing"></span>
          <span v-if="selectedTrainee.modulesInProgress[0].trainingTeam.trainers[1]">
            {{ selectedTrainee.modulesInProgress[0].trainingTeam.trainers[1].fname }} {{ selectedTrainee.modulesInProgress[0].trainingTeam.trainers[1].lname }}
          </span>
        </p>
        <p v-else>No trainers assigned</p>
      </div>
      <!-- Trainer Selection -->
      <div class="col s12 m6">
        <label for="trainer1Select">Choose New Trainer 1:</label>
        <select id="trainer1Select" ref="trainerSelect">
          <option value="" disabled selected>Choose Trainer 1</option>
          <option v-for="trainer in availableTrainers" :value="trainer._id">{{trainer.fname}} {{trainer.lname}}</option>
        </select>
      </div>
      <div class="col s12 m6">
        <label for="trainer2Select">Choose New Trainer 2:</label>
        <select id="trainer2Select" ref="trainerSelect">
          <option value="" disabled selected>Choose Trainer 2</option>
          <option v-for="trainer in availableTrainers" :value="trainer._id">{{trainer.fname}} {{trainer.lname}}</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <a href="javascript:void(0);" class="modal-close waves-effect waves-red btn-flat">Cancel</a>
      <a href="javascript:void(0);" class="modal-close waves-effect waves-green btn-flat">Save</a>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { zabApi } from '../../../../helpers/axios';


export default {
  name: 'InTraining',
  data() {
    return {
      // Existing data properties...
      selectedTrainee: {},
      selectedModule: null,
      isLoading: false,
      availableTrainers: null,
      currentTrainers: [],
    };
  },
  mounted() {
    this.initializeTooltips();
    const modalElem = this.$refs.updateProgressModal;
    M.Modal.init(document.querySelectorAll('.modal'));

    const elemsSelect = document.querySelectorAll('select');
    M.FormSelect.init(elemsSelect);
  },
  computed: {
    ...mapGetters('trainee', [
      'inTrainingTrainees', // Ensure this getter is defined in your Vuex store
      'matchedInTrainingTrainees',
      'getModuleById'
    ]),
  },
  methods: {
    ...mapActions('trainee', {
      trainingModules: state => state.trainingModules,
    }),
    openUpdateProgressModal(trainee) {
      this.selectedTrainee = trainee;
      this.isLoading = true;

      // Assuming 'getModuleById' is a Vuex getter or a method that retrieves module details by ID
      const moduleId = trainee.modulesInProgress[0].moduleId.id;
      const moduleDetails = this.getModuleById(moduleId);

      if (moduleDetails) {
        // Map each course in the module with completion data from 'modulesInProgress'
        const coursesWithCompletion = moduleDetails.courses.map(course => {
          // Find if there's completion data for this course
          const completionData = trainee.modulesInProgress[0].courses.find(c => c.courseName === course._id);
          return {
            ...course,
            isCompleted: !!completionData, // True if completion data is found
            completionDate: completionData ? this.formatDate(completionData.completionDate) : null, // Format completion date if present
          };
        });

        // Set the enriched module details as 'selectedModule' for the modal
        this.selectedModule = {
          ...moduleDetails,
          courses: coursesWithCompletion, // Include enriched courses array
        };
      }

      this.isLoading = false;

      // Initialize and open the modal
      const modalInstance = M.Modal.getInstance(this.$refs.updateProgressModal);
      modalInstance.open();
    },
    async openChangeTrainerModal(trainee) {
      this.selectedTrainee = trainee;
      console.log(this.selectedTrainee);

      // Assuming you might need to fetch a list of available trainers or perform some other preparation
      // If the available trainers depend on the trainee's current module or some other criteria, fetch that data
      // This is a placeholder, adjust the API endpoint as necessary
      const { data } = await zabApi.get(`/training/trainers/by-module/${trainee.modulesInProgress[0].moduleId.id}`);
      this.availableTrainers = data.data; // Adjust based on actual API response structure
      console.log(this.availableTrainers);

      // If you have some dynamic UI adjustments or selections to be made before opening the modal, do it here
      // For example, populating a select dropdown with the fetched trainers
      this.$nextTick(() => {
        const selectElement = this.$refs.trainerSelect;
        if (selectElement) {
          M.FormSelect.init(selectElement);
        } else {
          console.log("Select element not found");
        }
      });

      // Now, open the modal for changing the trainer
      const modalInstance = M.Modal.getInstance(this.$refs.changeTrainerModal);
      modalInstance.open();
    },
    calculateProgress(trainee) {
      if (!trainee.modulesInProgress || trainee.modulesInProgress.length === 0) return '0/0';

      const moduleId = trainee.modulesInProgress[0].moduleId.id;
      const module = this.getModuleById(moduleId);
      if (!module) return '0/0';

      const totalCourses = module.courses.length; // Assuming this matches the total courses correctly
      const completedCourses = trainee.modulesInProgress[0].courses.length; // Assuming this array contains only completed courses

      return `${completedCourses}/${totalCourses}`;
    },
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      const month = ('0' + (d.getMonth() + 1)).slice(-2); // Months are 0-based
      const day = ('0' + d.getDate()).slice(-2);
      const year = d.getFullYear();
      return `${month}-${day}-${year}`;
    },
    formatFacility(facility) {
    if (facility.toLowerCase() === "classroom") {
      return "CLASS"; // Transform "classroom" to "CLASS"
    }
    return facility.toUpperCase(); // Convert other facilities to uppercase
    },
    formatType(type) {
      return type.toUpperCase(); // Capitalize the first letter
    },
    shouldShowTooltip(description, maxLength = 40) {
      return description && description.length > maxLength;
    },
    initializeTooltips() {
      // Ensures the DOM has updated before initializing tooltips
      this.$nextTick(() => {
        M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
          margin: 0,
          // You can add other tooltip options here
        });
      });
    },
  },
};
</script>

<style scoped>

.no_trainees {
	padding: 0 1em 1em 1em;
	margin-top: 1em;
	font-style: italic;
}

.bold {
  font-weight: bold; /* Make text bold */
}

.capitalized {
  text-transform: capitalize; /* Capitalize text */
}

.centered-text {
  text-align: center;
}

.courses-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}

.courses-table th, .courses-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

/* Apply center alignment specifically to 'Type' and 'Facility' columns */
.courses-table .type-cell,
.courses-table .facility-cell {
  text-align: center; /* Center the text */
} 

.status-cell .completion-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.completed-status {
  display: flex;
  align-items: center;
  color: green;
}

.completion-date {
  margin-left: 5px; /* Adjust spacing as needed */
  white-space: nowrap; /* Prevent wrapping */
}

.tooltipped {
	cursor: pointer;
}

.center-align {
  text-align: center;
}

.courses-table .options-col {
  width: 140px; /* Adjust the width as needed */
  max-width: 120px; /* Set a maximum width */
}

.custom-modal-size {
  width: 70%; /* or any specific size */
  max-height: 90%; /* Adjust based on your needs */
  min-height: 300px
}

.trainers-list {
  text-align: center;
}
.trainer-spacing {
  margin-left: 2rem; /* Adjust this value to achieve the desired spacing */
}

</style>