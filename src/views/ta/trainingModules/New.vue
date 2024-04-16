<template>
        <div class="card">
            <div class="card-content">
      <div class="row">
        <!-- Training Module Card -->
        <div class="col s12">
              <span class="card-title">{{ isEditing ? 'Edit Module' : 'Create Module' }}</span>
              <form @submit.prevent="submitModule">
                <div class="row">
                  <!-- Module Name Input -->
                  <div class="input-field col s12 m6">
                    <input id="moduleName" type="text" v-model="moduleData.name" required>
                    <label for="moduleName">Module Name</label>
                  </div>
                  <!-- Module Track Selection -->
                  <div class="input-field col s12 m6">
                    <select v-model="moduleData.track" required>
                      <option value="" disabled>Select Track</option>
                      <option value="home">Home</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    <label>Track</label>
                  </div>
                </div>
                <!-- Module Description -->
                <div class="input-field col s12">
                  <textarea id="moduleDescription" class="materialize-textarea" v-model="moduleData.description"></textarea>
                  <label for="moduleDescription">Description</label>
                </div>
                <!-- Prerequisites Selection -->
                <div class="input-field col s12">
                  <select v-model="moduleData.prerequisites" multiple>
                    <option value="" disabled>Select Prerequisites</option>
                    <option v-for="module in allModules" :key="module._id" :value="module._id">{{ module.name }}</option>
                  </select>
                  <label>Prerequisites</label>
                </div>
                <!-- Extension Module Selection -->
                <div class="col s12" v-if="moduleData.isExtension">
                  <label>
                    <input type="checkbox" v-model="moduleData.isExtension" />
                    <span>Is Extension Module</span>
                  </label>
                  <div class="input-field">
                    <select v-model="moduleData.extensionModule">
                      <option value="" disabled>Select Parent Module</option>
                      <option v-for="module in allModules" :key="module._id" :value="module._id">{{ module.name }}</option>
                    </select>
                    <label>Extension of Module</label>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        </div>

        
        <!-- Courses Card -->
        
          <div class="card">
            <div class="card-content">
                <div class="row">
                <div class="col s12">
              <span class="card-title">Courses</span>
              <button @click.prevent="addCourse" class="btn">Add Course</button>
              <div v-for="(course, index) in moduleData.courses" :key="index" class="card horizontal">
                <div class="card-stacked">
                  <div class="card-content">
                    <form @submit.prevent="() => {}">
                      <div class="row">
                        <!-- Course Name -->
                        <div class="input-field col s12 m6">
                          <input v-model="course.courseName" type="text" :id="'courseName' + index" required>
                          <label :for="'courseName' + index">Course Name</label>
                        </div>
                        <!-- Course Type -->
                        <div class="input-field col s12 m6">
                          <input v-model="course.type" type="text" :id="'courseType' + index">
                          <label :for="'courseType' + index">Type</label>
                        </div>
                      </div>
                      <!-- Course Description -->
                      <div class="input-field col s12">
                        <textarea v-model="course.description" class="materialize-textarea" :id="'courseDescription' + index"></textarea>
                        <label :for="'courseDescription' + index">Description</label>
                      </div>
                      <button @click.prevent="removeCourse(index)" class="btn red">Remove Course</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      
      <!-- Submit Button for Entire Module -->
      <div class="row">
        <div class="col s12 right-align">
          <button @click="submitModule" class="btn">{{ isEditing ? 'Update' : 'Create' }} Module</button>
        </div>
      </div>
</template>
  







<script>
export default {
  data() {
    return {
      isEditing: false, // Toggle between create and edit mode
      moduleData: {
        name: '',
        description: '',
        track: '',
        courses: [],
      },
      availableModules: [], // For prerequisites if needed
    };
  },
  methods: {
    addCourse() {
      this.moduleData.courses.push({
        courseName: '',
        description: '',
        type: '',
        facility: '',
        order: this.moduleData.courses.length,
        certifications: [],
        examId: null,
      });
    },
    removeCourse(index) {
      this.moduleData.courses.splice(index, 1);
    },
    submitModule() {
      if (this.isEditing) {
        // Call API to update the module
      } else {
        // Call API to create a new module
      }
    },
    // Optionally, fetch module details for editing
    fetchModuleDetails() {
      // API call to get module details and populate moduleData for editing
    },
  },
  mounted() {
    if (this.$route.params.moduleId) {
      this.isEditing = true;
      this.fetchModuleDetails();
    }
    // Initialize Materialize components
    this.$nextTick(() => {
      M.FormSelect.init(document.querySelectorAll('select'));
    });
  },
};
</script>

<style>

.card {
    padding: 10px;
    width: 100%;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .card.bottom {
    padding: 10px;
    width: 100%;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: auto;
  }
  
  .card-content.bottom {
      padding: -10px;
      height: 200px;
  }
  .card-body {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .input-field label {
    color: #9e9e9e; /* Materialize default label color for uniformity */
  }
  
  .input-field input[type=text]:focus + label {
    color: #26a69a; /* Materialize primary color for focus state */
  }
  
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  .right-align {
    text-align: right; /* Aligns the button container's content to the right */
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  thead th {
    background-color: #f4f4f4;
  }
  
  th, td {
    padding: 8px;
    border: 1px solid #ddd;
  }
  
  /* Ensure the question column takes the remaining space */
  th:first-child, td:first-child {
    width: 80%;
  }
  
  /* Align actions to the right */
  th:last-child, td:last-child {
    width: 20%;
    text-align: right;
  }
  
  /* Adjust button margins for visual separation */
  .btn {
    margin-left: 8px;
  }
  
  /* Initial button has no left margin for alignment */
  .btn:first-child {
    margin-left: 0;
  }
  </style>