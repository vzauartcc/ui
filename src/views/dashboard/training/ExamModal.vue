<template>
    <div id="exam-modal" class="modal modal-fixed-footer">
      <!-- Modal Header -->
      <div class="modal-header">
        <h4 class="exam-title">{{ currentTest.title }}</h4>
        <!-- Timer with conditional formatting -->
        <div :class="['timer', { 'text-green': timeLeftInMinutes > 60, 'text-red': timeLeftInMinutes <= 60 }]">
          Time left: <span>{{ formattedTimeLeft }}</span>
        </div>
      </div>
      <div class="modal-content">
        <div class="question-container" v-if="currentQuestion">
          <p class="question-text">{{ currentQuestionIndex + 1 }}. {{ currentQuestion.text }}</p>
          <ul class="options-list">
            <li v-for="(option, index) in currentQuestion.options" :key="index">
              <label :for="'option-' + currentQuestionIndex + '-' + index">
              <!-- Bind radio button value to the option's index or a unique identifier -->
              <input type="radio" 
                :id="'option-' + currentQuestionIndex + '-' + index" 
                :value="index" 
                v-model="userAnswers[currentQuestionIndex]" 
                @change="updateAnswer(currentQuestionIndex, index)">
                {{ option.text }}
              </label>
            </li>
          </ul>
        </div>
        <p v-else class="no-questions">No questions available.</p>
      </div>
      <div class="modal-footer">
        <button class="btn waves-effect waves-light btn-margin-right" @click="navigate(-1)" :disabled="currentQuestionIndex === 0">Previous</button>
        <button class="btn waves-effect waves-light btn-margin-right" @click="navigate(1)" :disabled="currentQuestionIndex >= currentTest.questions.length - 1">Next</button>
        <button class="btn waves-effect waves-light green btn-margin-right" @click="saveExamProgressExit">Save Progress</button>
        <!-- The last button might not need the right margin -->
        <button class="btn waves-effect waves-light red" @click="submitTest">Submit Test</button>
  </div>
    </div>
</template>
  
<script>
export default {
  name: 'ExamModal',
  props: ['currentTest'],
  data() {
    return {
      currentQuestionIndex: 0,
      userAnswers: {},
      startTime: Date.now(),
      now: Date.now(),
      endTime: new Date(this.currentTest.endTime).getTime(),
      timer: null,
      questionStartTime: Date.now(), // Track start time of the current question
      questionTimeSpent: {},
    };
  },
  computed: {
    currentQuestion() {
      return this.currentTest.questions[this.currentQuestionIndex];
    },
    timeLeft() {
        const timeLeft = this.endTime - this.now; // Calculate time left based on updated current time
        return timeLeft > 0 ? timeLeft : 0; // Ensure timeLeft doesn't go negative
    },
    timeLeftInMinutes() {
      return Math.floor(this.timeLeft / 60000); // Convert milliseconds to minutes
    },
    formattedTimeLeft() {
      const hours = Math.floor(this.timeLeft / 3600000); // Convert milliseconds to hours
      const minutes = Math.floor((this.timeLeft % 3600000) / 60000); // Remaining minutes
      const seconds = Math.floor((this.timeLeft % 60000) / 1000); // Remaining seconds

      if (hours > 0) {
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      } else {
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      }
    },
  },
  watch: {
    timeLeft(newValue) {
      if (newValue <= 0) {
        this.submitTest();
      }
    },
  },
  mounted() {
    this.initializeModal();
    this.startTimer();

  },
  methods: {
    initializeModal() {
        this.$nextTick(() => {
            const options = { dismissible: false }; // Prevent modal from closing when clicking outside of it
            M.Modal.init(this.$el, options); // Initialize the modal
        });
    },
    openModal() {
      const instance = M.Modal.getInstance(this.$el);
      instance.open();
    },
    closeModal() {
      const instance = M.Modal.getInstance(this.$el);
      instance.close();
    },
    startTimer() {
      this.timer = setInterval(() => {
        this.now = Date.now(); // Update current time, triggering reactivity
      }, 1000);
    },
    navigate(direction) {
      const currentTime = Date.now();
      const timeSpentOnCurrentQuestion = currentTime - this.questionStartTime;
    
      // Save time spent on the current question
      if (this.questionTimeSpent[this.currentQuestionIndex] !== undefined) {
        this.questionTimeSpent[this.currentQuestionIndex] += timeSpentOnCurrentQuestion;
      } else {
        this.questionTimeSpent[this.currentQuestionIndex] = timeSpentOnCurrentQuestion;
      }
    
      // Update the start time for the next question
      this.questionStartTime = currentTime;
    
      // Navigate to the next or previous question
      this.currentQuestionIndex += direction;
    
      // Additional logic to handle navigation (e.g., bounds checking)...
    },

    updateAnswer(questionIndex, optionIndex) {
        // Direct assignment works in Vue 3 due to the improved reactivity system
        this.userAnswers[questionIndex] = optionIndex;
    },

    submitTest() {
      const currentTime = Date.now();
      const timeSpentOnCurrentQuestion = currentTime - this.questionStartTime;
      // Ensure time is recorded for the last question
      if (this.questionTimeSpent[this.currentQuestionIndex] !== undefined) {
        this.questionTimeSpent[this.currentQuestionIndex] += timeSpentOnCurrentQuestion;
      } else {
        this.questionTimeSpent[this.currentQuestionIndex] = timeSpentOnCurrentQuestion;
      }
      clearInterval(this.timer);

      const responses = Object.keys(this.userAnswers).map(questionIndex => {
        const questionId = this.currentTest.questions[questionIndex]._id;
        const optionIndex = this.userAnswers[questionIndex];
        const optionId = this.currentTest.questions[questionIndex].options[optionIndex]._id;
        const timeSpent = this.questionTimeSpent[questionIndex] || 0; // Fallback to 0 if not defined

        return {
          question: questionId,
          selectedOption: optionId,
          timeSpent: Math.floor(timeSpent / 1000), // Convert milliseconds to seconds
          // isCorrect and attemptOrder can be added if needed
        };
      });

      // Example submission (replace with your actual API call)
      console.log("Submitting answers:", responses);

      // Reset the test after submission
      this.resetTest();
    },
    async saveProgress() {
        try {
            console.log('Saving progress...');
            // Replace this with your actual save logic (e.g., an API call)
            await this.saveExamProgress();          
        } catch (error) {
            console.error('Failed to save progress:', error);
            // Handle any errors that occur during the save operation
        }
    },

    // Example async function to simulate saving exam progress
    async saveExamProgress() {
        // Simulate an asynchronous operation (e.g., API call)
        return new Promise((resolve) => setTimeout(resolve, 1000)); // Simulates a delay
    },

    async saveExamProgressExit() {
        try {
            console.log('Saving progress...');
            // Replace this with your actual save logic (e.g., an API call)
            await this.saveExamProgress();

            // Close the modal after the asynchronous operation completes
            this.closeModal();
        } catch (error) {
            console.error('Failed to save progress:', error);
            // Handle any errors that occur during the save operation
        }
    },

    resetTest() {
      // Reset component state
    },
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
};
</script>

  
<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee; /* Optional, adds a visual separation */
}

.exam-title {
  margin: 0;
}

.text-green {
  color: #4CAF50; /* Materialize green */
}

.text-red {
  color: #F44336; /* Materialize red */
}

/* Ensure radio buttons are visible */
input[type="radio"] {
  opacity: 1; /* Override any global styles that might be hiding the radios */
  position: static; /* Adjust if needed */
  margin-right: 10px;
}
#exam-modal .modal-content {
  padding: 20px;
}

/* Style for question text */
#exam-modal p {
  margin-bottom: 15px;
  font-size: 18px; /* Adjust size as needed for readability */
}

/* Style for options list to improve readability */
#exam-modal ul {
  list-style-type: none; /* Remove default list style */
  padding-left: 0; /* Remove default padding */
}

#exam-modal li {
  padding: 10px 0; /* Add some padding to each option for better clickability */
}

#exam-modal label {
  display: block; /* Make label block to increase clickable area */
  cursor: pointer; /* Change cursor to indicate clickable area */
}

#exam-modal input[type="radio"] {
  margin-right: 10px;
}

.btn-margin-right {
  margin-right: 10px !important; /* Adjust as needed */
}
</style>