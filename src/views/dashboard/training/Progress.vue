<template>
  <div class="progress-screen">
    <!-- Spinner shown when loading -->
    <div class="loading_container" v-if="isLoading">
      <Spinner />
    </div>
    <!-- Modules content shown when not loading and modules are present -->
    <div v-if="!isLoading && modulesWithCompletionData.length > 0">
      <div class="card">
        <div v-for="module in modulesWithCompletionData" :key="module._id" class="module-card">
          <div class="card-title col s12"><span class="card-title">{{ module.name }}</span></div>
          <div class="card-body">
            <p>{{ module.description }}</p>
            <!-- Table for Courses within the Module -->
            <table class="courses-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Facility</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in module.courses" :key="course._id">
                  <td>{{ course.courseName }}</td>
                  <td :class="{ 'tooltipped': shouldShowTooltip(course.description) }"
                    :data-tooltip="shouldShowTooltip(course.description) ? course.description : ''">
                    {{ truncateDescription(course.description, 60).text }}
                  </td>
                  <td :class="'bold capitalized type-cell'">{{ formatType(course.type) }}</td>
                  <td :class="'bold facility-cell'">{{ formatFacility(course.facility) }}</td>
                  <td class="status-cell">
                    <div class="completion-status" :class="{'completed': course.isCompleted}">
                      <span v-if="course.isCompleted" class="completed-status">
                        &#10004; <span class="completion-date">{{ course.completionDate }}</span>
                      </span>
                      <span v-else class="in-progress-box"></span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- Optionally, show a message when not loading and no modules are present -->
    <div v-if="!isLoading && modulesWithCompletionData.length === 0">
      No modules available.
    </div>
  </div>
</template>
  
<script>
import {zabApi} from '@/helpers/axios.js';

export default {
  name: 'Training Progress',
  title: 'Training Progress',
  data() {
    return {
      populatedProgress: {}, // Hold the entire response for manipulation
      isLoading: false
    };
  },
  created() {
	  // Ideally, fetch the user's training progress here to update modulesInProgress
		this.fetchTrainingProgress();
	},
  mounted() {
    this.initializeTooltips();
    M.Tooltip.init(document.querySelectorAll(".tooltipped"), {
      margin: 0,
    });
  },
  updated() {
    this.initializeTooltips();
  },
  methods: {
	  async fetchTrainingProgress() {
      const cid = this.$store.state.user.user.data.cid;
      this.isLoading = true; // Start loading
      try {
        const { data } = await zabApi.get(`/training/modules/${cid}`);
        this.populatedProgress = data.populatedProgress;
      } catch (error) {
        console.error("Error fetching training progress:", error);
      } finally {
        this.isLoading = false; // Stop loading
      }
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
    truncateDescription(description, maxLength = 60) {
      if (description && description.length > maxLength) {
        return { text: description.substring(0, maxLength) + '...', truncated: true };
      }
      return { text: description, truncated: false }; // Return original if within limit or empty
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
  computed: {
    modulesWithCompletionData() {
      if (!this.populatedProgress.modulesInProgress) {
        return [];
      }

      const data = this.populatedProgress.modulesInProgress.map(moduleProgress => {
        const module = moduleProgress.moduleId; // The module details

        const coursesWithCompletion = module.courses.map(course => {
          const completion = moduleProgress.courses.find(c => c.courseName === course._id);

          return {
            ...course,
            isCompleted: !!completion?.isCompleted,
            completionDate: completion?.completionDate ? this.formatDate(completion.completionDate) : null,
          };
        });

        return {
          ...module,
          courses: coursesWithCompletion,
        };
      });

      // Log the final computed data before returning
      console.log(data);

      return data;
    },
  },
};
</script>
  
<style scoped>
.module-card .card {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
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

.card-header {
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.card-body {
  padding: 10px;
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

.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.in-progress-box {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
}
</style>