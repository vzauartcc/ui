<template>
    <div class="progress-screen">
      <!-- Loop through each module in progress -->
      <div v-for="module in modulesInProgress" :key="module._id" class="module">
        <h2>{{ module.name }}</h2> <!-- Module Name -->
        <p>{{ module.description }}</p> <!-- Module Description -->
  
        <!-- Table for Courses within the Module -->
        <table class="courses-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Facility</th>
              <th>Status</th> <!-- Header for completion status -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in module.courses" :key="course.courseName">
              <td>{{ course.courseName }}</td>
              <td>{{ course.description }}</td>
              <td>{{ course.type }}</td>
              <td>{{ course.facility }}</td>
              <td class="status-cell">
                <!-- White square with conditional green check -->
                <div class="completion-status" :class="{'completed': course.completed}">
                  <span v-if="course.completed">&#10004;</span> <!-- Display checkmark if course.completed is true -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
<script>
import {zabApi} from '@/helpers/axios.js';

export default {
    name: 'Training Progress',
    data() {
      return {
        // Sample structure for modulesInProgress data
        modulesInProgress: [
          {
            _id: "module1",
            name: "S1 Ground Control Training",
            description: "This module covers foundational knowledge...",
            courses: [
              {
                courseName: "Gen Admin Policy Exam",
                description: "Covers general administrative policies.",
                type: "exam",
                facility: "classroom"
              },
              // Additional courses...
            ]
          },
          // Additional modules...
        ]
      };
    },
    created() {
		// Ideally, fetch the user's training progress here to update modulesInProgress
		this.fetchTrainingProgress();
	},
    methods: {
		async fetchTrainingProgress() {
			// Fetch the user's training progress from the backend and update modulesInProgress
      		// This is a placeholder - replace with your actual API call
			  const cid = this.$store.state.user.user.data.cid;
      		try {
        		const { data } = await zabApi.get(`/training/modules/${cid}`);
        		const populatedProgress = data.populatedProgress;

                // Assuming you only have one module in progress and want to access its details:
                if (populatedProgress.modulesInProgress && populatedProgress.modulesInProgress.length > 0) {
                    this.modulesInProgress = [populatedProgress.modulesInProgress[0].moduleId];
                } else {
                    this.modulesInProgress = [];
                }

				console.log(this.modulesInProgress)
      		} catch (error) {
        		console.error("Error fetching training progress:", error);
      		}
		},
    }
};
</script>
  
<style scoped>
.progress-screen .module {
  margin-bottom: 40px;
}

.courses-table {
  width: 100%;
  border-collapse: collapse;
}

.courses-table th,
.courses-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.courses-table th {
  background-color: #f2f2f2;
}

.status-cell .completion-status {
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

.status-cell .completed {
  background-color: #fff; /* Keep background white */
  color: green; /* Green check */
}
</style>