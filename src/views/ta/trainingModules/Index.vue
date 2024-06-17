<template>
    <div class="card home_intro">
      <div class="card-content">
        <!-- Always show Exam Center title -->
        <div class="row">
          <div class="col s10">
            <span class="card-title">Training Modules</span>
          </div>
          <!-- Conditionally show the Create button if exams have been fetched -->
          <div class="col s2 right-align" v-if="modules">
            <router-link to="/ta/module-management/new" class="btn new_event_button">Create</router-link>
          </div>
        </div>
        
        <!-- Show spinner while loading -->
        <div v-if="!modules" class="center-align">
          <Spinner />
        </div>
  
        <!-- Show no exams message if exams array is empty -->
        <div v-if="modules && modules.length === 0" class="left-align">
          <p class="no_modules">There are no modules to display</p>
        </div>
        
        <!-- Show table if exams array is not empty -->
        <div v-if="modules && modules.length > 0">
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th class="center-align">Module Name</th>
                <th class="center-align">Track</th>
                <th class="center-align">Courses</th>
                <th class="center-align">Extension</th>
                <th class="center-align">Options</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="module in modules" :key="module.id">
                <td>{{ module.name }}</td>
                <td class="center-align">{{ module.track }}</td>
                <td class="center-align">{{ module.courses.length }}</td>
                <td class="center-align">{{ module.isExtension }}</td>
                <td class="center-align">
                  <div class="row">
                    <button @click="editExam(module._id)" class="btn waves-effect waves-light">
                      <i class="material-icons">edit</i>
                    </button>
                    <button @click="prepareDelete(module._id)" class="btn red waves-effect waves-light modal-trigger">
                      <i class="material-icons">delete</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table> 
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div id="deleteModuleModal" class="modal">
      <div class="modal-content">
        <h4>Confirm Removal</h4>
        <p>Are you sure you want to remove this exam?</p>
      </div>
      <div class="modal-footer">
        <a href="javascript:void(0);" class="modal-close waves-effect waves-red btn-flat" @click="cancelDelete">Cancel</a>
        <a href="javascript:void(0);" class="modal-close waves-effect waves-green btn-flat" @click="confirmDelete">Confirm</a>
      </div>
    </div>
  </div>
</template>
  
<script>
import { zabApi } from '@/helpers/axios.js';

export default {
    name: 'TrainingModules',
	title: 'Training Modules',
    data() {
      return {
        modules: [], // This will hold your exams data
        selectedModuleId: null, // ID of the exam to be deleted
      };
    },
    async created() {
      await this.fetchModules();
      M.Modal.init(document.querySelectorAll('.modal'), {
		preventScrolling: false
	  });
    },
    watch: {
        selectedModuleId(newVal, oldVal) {
            if (newVal !== null) {
                this.openDeleteModal();
            }
        },
    },
    methods: {
      async fetchModules() {
        try {
            const { data } = await zabApi.get('/training/modules');
            this.modules = data.data;
            console.log(this.modules);
        } catch(e) {
          console.error("There was an error fetching the training modules: ", e);
        };
      },
      editModule(id) {
        // Navigate to the exam edit page using Vue Router
        this.$router.push(`/ta/module/${id}`);
      },
      prepareDelete(id) {
            this.selectedModuleId = id;
           
      },
      cancelDelete() {
        this.selectedModuleId = null; // Reset on cancel
        // Optionally reinitialize or ensure the modal can be opened again if needed
        // this.initModal(); // Uncomment this line if reinitialization is necessary
      },
      async confirmDelete() {
        if (!this.selectedModuleId) return;
        try {
          await zabApi.delete(`/training/module/${this.selectedModuleId}`);
          this.toastSuccess('Module deleted successfully');
          this.selectedExamId = null; // Reset selected exam ID
          await this.fetchModules(); // Refresh the list
        } catch (e) {
          console.error("There was an error deleting the module: ", e);
          this.toastError('Failed to delete the module.');
        }
      },
      openDeleteModal() {
        const instance = M.Modal.getInstance(document.getElementById('deleteModuleModal'));
        if (instance) {
          instance.open();
        }
      }
    }
};
</script>
  
<style scoped>
.home_intro .card {
    margin-top: 20px;
}
  
.table th, .table td {
    vertical-align: middle;
}

.modal-footer .btn, .modal-footer .btn-flat {
  cursor: pointer;
}


.btn {
  margin-left: 8px;
}

/* Initial button has no left margin for alignment */
.btn:first-child {
  margin-left: 0;
}

.no_exams {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}
  </style>