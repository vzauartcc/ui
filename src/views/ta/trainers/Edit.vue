<template>
  <div class="row">
    <div class="col s12">
      <div class="card">
        <div class="loading_container" v-if="!trainer || !allModules">
          <Spinner />
        </div>
        <div class="card-content" v-else>
          <div class="row">
            <!-- Trainer Name and OI -->
            <div class="col s12 m8">
              <span class="card-title">
                {{ trainer.fname }} {{ trainer.lname }} - {{ trainer.oi }}
              </span>
            </div>
            <!-- Trainer Role, Rating, and Can Conduct EVAL -->
            <div class="col s12 m4">
              <div class="badge-container right-align">
                <span class="new badge" data-badge-caption="">
                  {{ getRole(trainer.roleCodes) }} - {{ trainer.ratingShort }}
                </span>
              </div>
            </div>
          </div>
          <!-- Modules List with Checkboxes & Can Conduct EVAL Option -->
          <div class="row valign-wrapper">
            <!-- Assignable Modules Table -->
            <div class="col s12 m6 l6">
              <h6>Assignable Modules:</h6>
              <table>
                <thead>
                  <tr>
                    <th>Module Name</th>
                    <th>Can Train</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="module in allModules" :key="module._id" @click="event => toggleModuleAssignment(event, module._id)" class="clickable-row">
                    <td>{{ module.name }}</td>
                    <td class="center-align">
                      <label>
                        <input type="checkbox" :checked="isModuleAssigned(module._id)" />
                        <span></span>
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Can Conduct EVAL Checkbox -->
            <div class="col s12 m6 l6 flex-container">
              <div class="center-align full-width">
                <label>
                  <input type="checkbox" v-model="canConductEval"/>
                  <span>Can Conduct EVAL</span>
                </label>
              </div>
            </div>
          </div>
          <!-- Save Button -->
          <div class="card-action right-align">
            <button class="btn waves-effect waves-light" @click="saveTrainer">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script>
import { zabApi } from '../../../helpers/axios';

export default {
  name: 'Trainer',
	title: 'Edit Trainer',
  data() {
    return {
      trainer: null,
      allModules: null,
      canConductEval: null,
    };
  },
  created() {
    this.fetchAllModules();
    this.fetchTrainer();
  },
  methods: {
    async fetchTrainer() {
      const { data } = await zabApi.get(`/training/trainers/${this.$route.params.cid}`);
      this.trainer = data.data.trainer;
      this.trainer.assignableModules = data.data.trainerProfile.assignableModules;
      this.canConductEval = data.data.trainerProfile.canConductEVAL;
      console.log(this.trainer);
      console.log(this.canConductEval);
    },
    async fetchAllModules() {
      const { data } = await zabApi.get('/training/modules');
      this.allModules = data.data;
      console.log(this.allModules);
    },
    isModuleAssigned(moduleId) {
      // Check if any of the trainer's assignableModules contain the moduleId
      return this.trainer.assignableModules.some(assignableModule => 
      assignableModule.moduleId._id === moduleId);
    },
    toggleModuleAssignment(event, moduleId) {
      // Check if the click is directly on the checkbox or its label
      if (event.target.type !== 'checkbox' && !event.target.closest('label')) {
        // Find the checkbox in the current row and toggle its "checked" property
        const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          // Manually trigger the update for the module assignment
          this.updateModuleAssignment(moduleId, checkbox.checked);
        }
      } else {
        // If the click is directly on the checkbox, just update the assignment
        this.updateModuleAssignment(moduleId, event.target.checked);
      }
    },
    updateModuleAssignment(moduleId, isChecked) {
      const moduleIndex = this.trainer.assignableModules.findIndex(m => m.moduleId._id === moduleId);
      if (isChecked && moduleIndex === -1) {
        // Add the module
        this.trainer.assignableModules.push({ moduleId: { _id: moduleId }, canTeach: true });
      } else if (!isChecked && moduleIndex !== -1) {
        // Remove the module
        this.trainer.assignableModules.splice(moduleIndex, 1);
      } 
      // Ensure reactivity
      this.trainer.assignableModules = [...this.trainer.assignableModules];
    },
    getRole(roleCodes) {
      if (roleCodes.includes('ins')) {
        return 'INS';
      } else if (roleCodes.includes('mtr')) {
        return 'MTR';
      }
      return 'N/A'; // Default case if neither role is found
    },
    async saveTrainer() {
      try {
        const payload = {
          assignableModules: this.trainer.assignableModules,
          canConductEVAL: this.canConductEval
        };

        const response = await zabApi.put(`/training/trainerProfile/${this.trainer._id}`, payload);
        console.log('Successfully updated the trainer profile:', response.data);

        // Success toast
        this.toastSuccess('Trainer profile updated successfully!');
    
        // Redirect
        this.$router.push('/ta/trainers');
      } catch (error) {
        console.error('Failed to update the trainer profile:', error);
        this.toastError('Failed to update the trainer profile. Please try again.');
      }
    }

  }
};
</script>

<style scoped>

.margin-top-custom {
  margin-top: 20px; /* Adjust the value as needed */
}

table tbody {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

.flex-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.clickable-row {
  cursor: pointer;
}

.full-width {
  width: 100%;
}
</style>
