<template>
    <div class="card home_intro">
      <div class="card-content">
        <!-- Always show Exam Center title -->
        <div class="row">
          <div class="col s10">
            <span class="card-title">Exam Center</span>
          </div>
          <!-- Conditionally show the Create button if exams have been fetched -->
          <div class="col s2 right-align" v-if="exams">
            <router-link to="/ins/exams/new" class="btn new_event_button">Create</router-link>
          </div>
        </div>
        
        <!-- Show spinner while loading -->
        <div v-if="!exams" class="center-align">
          <Spinner />
        </div>
  
        <!-- Show no exams message if exams array is empty -->
        <div v-if="exams && exams.length === 0" class="left-align">
          <p class="no_exams">There are no exams to display</p>
        </div>
        
        <!-- Show table if exams array is not empty -->
        <div v-if="exams && exams.length > 0">
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th>
                <th class="center-align">Created By</th>
                <th class="center-align">Questions/Test</th>
                <th class="center-align">Question Pool</th>
                <th class="center-align">Duration</th>
                <th class="center-align">Options</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exam in exams" :key="exam.id">
                <td>{{ exam.title }}</td>
                <td class="center-align">{{ exam.createdBy.fname + ' ' + exam.createdBy.lname }}</td>
                <td class="center-align">{{ exam.questionSubsetSize }}</td>
                <td class="center-align">{{ exam.questionsCount }}</td>
                <td class="center-align">{{ exam.timeLimit }}</td>
                <td class="center-align">
                  <button @click="editExam(exam._id)" class="btn waves-effect waves-light">
                    <i class="material-icons">edit</i>
                  </button>
                  <button @click="prepareDelete(exam._id)" class="btn red waves-effect waves-light modal-trigger">
                    <i class="material-icons">delete</i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table> 
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div id="deleteExamModal" class="modal">
      <div class="modal-content">
        <h4>Confirm Removal</h4>
        <p>Are you sure you want to remove this exam?</p>
      </div>
      <div class="modal-footer">
        <a href="#!" class="modal-close waves-effect waves-red btn-flat" @click="cancelDelete">Cancel</a>
        <a href="#!" class="modal-close waves-effect waves-green btn-flat" @click="confirmDelete">Confirm</a>
      </div>
    </div>
  </div>
</template>
  
<script>
import { zabApi } from '@/helpers/axios.js';

export default {
    name: 'ExamCenter',
	title: 'Exam Center',
    data() {
      return {
        exams: [], // This will hold your exams data
        selectedExamId: null, // ID of the exam to be deleted
      };
    },
    async created() {
      await this.fetchExams();
      M.Modal.init(document.querySelectorAll('.modal'), {
		preventScrolling: false
	  });
    },
    watch: {
        selectedExamId(newVal, oldVal) {
            if (newVal !== null) {
                this.openDeleteModal();
            }
        },
    },
    methods: {
      async fetchExams() {
        try {
            const { data } = await zabApi.get('/exam/exams');
            console.log(data.data);
            this.exams = data.data;
            this.initModal();
        } catch(e) {
          console.error("There was an error fetching the exams: ", e);
        };
      },
      editExam(id) {
        // Navigate to the exam edit page using Vue Router
        this.$router.push(`/ins/exams/${id}`);
      },
      prepareDelete(id) {
            this.selectedExamId = id;
           
      },
      cancelDelete() {
        this.selectedExamId = null; // Reset on cancel
        // Optionally reinitialize or ensure the modal can be opened again if needed
        // this.initModal(); // Uncomment this line if reinitialization is necessary
      },
      async confirmDelete() {
        if (!this.selectedExamId) return;
        try {
          await zabApi.delete(`/exam/exams/${this.selectedExamId}`);
          this.toastSuccess('Exam deleted successfully');
          this.selectedExamId = null; // Reset selected exam ID
          await this.fetchExams(); // Refresh the list
        } catch (e) {
          console.error("There was an error deleting the exam: ", e);
          this.toastError('Failed to delete the exam.');
        }
      },
      openDeleteModal() {
        const instance = M.Modal.getInstance(document.getElementById('deleteExamModal'));
        if (instance) {
          instance.open();
        }
      }
    }
};
</script>
  
<style scoped>
.exam-center .card {
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