<template>
  <div id="exam-modal" class="modal exam-modal modal-fixed-footer">
    <!-- Modal Header -->
    <div class="modal-header">
      <h4 class="exam-title">{{ currentTest.title }}</h4>
      <div class="timer-container">
        <div :class="['timer', { 'text-green': timeLeftInMinutes > 60, 'text-red': timeLeftInMinutes <= 60 }]">
          Time left: <span>{{ formattedTimeLeft }}</span>
        </div>
      </div>
    </div>
    <div class="modal-content">
      <div v-if="currentTest.questions && currentTest.questions.length">
      <div class="question-container" v-if="currentQuestion">
        <p class="question-text">{{ currentQuestionIndex + 1 }}. {{ currentQuestion.text }}</p>
        <ul class="options-list">
          <li v-for="(option, index) in currentQuestion.options" :key="index">
            <label :for="'option-' + currentQuestionIndex + '-' + index">
              <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span>
              <input class="with-gap" type="radio" :id="'option-' + currentQuestionIndex + '-' + index" :value="index" v-model="userAnswers[currentQuestionIndex]" @change="updateAnswer(currentQuestionIndex, index)">
              {{ option.text }}
            </label>
          </li>
        </ul>
      </div>
        <p v-else class="no-questions">No questions available.</p>
      </div>
      <p v-else>Loading questions...</p>
    </div>
    <div class="modal-footer">
      <button class="btn waves-effect waves-light btn-margin-right" @click="navigate(-1)" :disabled="currentQuestionIndex === 0">Previous</button>
      <button class="btn waves-effect waves-light btn-margin-right" @click="navigate(1)" :disabled="currentQuestionIndex >= currentTest.questions.length - 1">Next</button>
      <button class="btn waves-effect waves-light green btn-margin-right" @click="saveExamProgressExit">Save Progress</button>
      <button class="btn waves-effect waves-light red" @click="submitTest">Submit Test</button>
    </div>
  </div>
</template>

<script>
import { zabApi } from '../../../helpers/axios.js'

export default {
  name: 'ExamModal',
  props: ['currentTest'],
  data() {
    return {
      currentQuestionIndex: 0,
      userAnswers: {},
      startTime: Date.now(),
      now: Date.now(),
      timer: null,
      questionStartTime: Date.now(),
      questionTimeSpent: {},
    };
  },
  computed: {
    currentQuestion() {
      return this.currentTest.questions[this.currentQuestionIndex];
    },
    timeLeft() {
      const endTime = new Date(this.currentTest.endTime).getTime();
      const now = this.now;
      const timeLeft = endTime - now;
      return timeLeft > 0 ? timeLeft : 0;
    },
    timeLeftInMinutes() {
      return Math.floor(this.timeLeft / 60000);
    },
    formattedTimeLeft() {
      const hours = Math.floor(this.timeLeft / 3600000);
      const minutes = Math.floor((this.timeLeft % 3600000) / 60000);
      const seconds = Math.floor((this.timeLeft % 60000) / 1000);

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
    this.startTimer();
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        this.now = Date.now();
      }, 1000);
    },
    navigate(direction) {
      const currentTime = Date.now();
      const timeSpentOnCurrentQuestion = currentTime - this.questionStartTime;

      if (this.questionTimeSpent[this.currentQuestionIndex] !== undefined) {
        this.questionTimeSpent[this.currentQuestionIndex] += timeSpentOnCurrentQuestion;
      } else {
        this.questionTimeSpent[this.currentQuestionIndex] = timeSpentOnCurrentQuestion;
      }

      this.questionStartTime = currentTime;
      this.currentQuestionIndex += direction;
    },
    updateAnswer(questionIndex, optionIndex) {
      this.userAnswers[questionIndex] = optionIndex;
    },
    submitTest() {
    const currentTime = Date.now();
    const timeSpentOnCurrentQuestion = currentTime - this.questionStartTime;

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
      const timeSpent = this.questionTimeSpent[questionIndex] || 0;

      return {
        question: questionId,
        selectedOption: optionId,
        timeSpent: Math.floor(timeSpent / 1000),
      };
    });

    console.log("Submitting answers:", responses);

    zabApi.patch(`/exam/submit/${this.currentTest.attemptId}`, { responses })
      .then(response => {
        this.$emit('submit', response.data);
      })
      .catch(error => {
        console.error('Error submitting exam:', error);
      });

    this.resetTest();
  },
  resetTest() {
    this.userAnswers = {};
    this.currentQuestionIndex = 0;
    this.questionTimeSpent = {};
    this.questionStartTime = Date.now();
    this.closeModal();
  },
  closeModal() {
      this.$emit('close');
      const elem = this.$el;
      const instance = M.Modal.getInstance(elem);
      if (instance) {
        instance.close();
      }
    },
    async saveProgress() {
      try {
        await this.saveExamProgress();
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    },
    updateCurrentQuestionTimeSpent() {
      const currentTime = Date.now();
      const timeSpentOnCurrentQuestion = currentTime - this.questionStartTime;
      if (this.questionTimeSpent[this.currentQuestionIndex] !== undefined) {
        this.questionTimeSpent[this.currentQuestionIndex] += timeSpentOnCurrentQuestion;
      } else {
        this.questionTimeSpent[this.currentQuestionIndex] = timeSpentOnCurrentQuestion;
      }
      this.questionStartTime = currentTime;
    },
    async saveExamProgress() {
      this.updateCurrentQuestionTimeSpent();

      const responses = Object.keys(this.userAnswers).map(questionIndex => {
        const questionId = this.currentTest.questions[questionIndex]._id;
        const optionIndex = this.userAnswers[questionIndex];
        const optionId = this.currentTest.questions[questionIndex].options[optionIndex]._id;
        const timeSpent = this.questionTimeSpent[questionIndex] || 0;

        // Ensure timeSpent is a valid number
        const validTimeSpent = isNaN(timeSpent) ? 0 : timeSpent;

        return {
          questionId,
          selectedOption: optionId,
          timeSpent: Math.floor(validTimeSpent / 1000),
        };
      });

      console.log(this.currentTest);
      try {
        const response = await zabApi.patch(`/exam/save/${this.currentTest.attemptId}`, { responses });
        console.log(response.data.message);
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    },
    async saveExamProgressExit() {
      try {
        await this.saveExamProgress();
        const elem = this.$el;
      const instance = M.Modal.getInstance(elem);
      if (instance) {
        instance.close();
      }
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    },
    initializeModal() {
      this.$nextTick(() => {
        const elem = this.$el;
        const instance = M.Modal.init(elem, { dismissible: false });
        instance.open();
      });
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
  position: relative;
}

.modal {
  max-width: 80%;
}

.timer-container {
  position: absolute;
  bottom: 10px;
  right: 10px;
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

.exam-modal {
  width: 100% !important;
  max-height: 100% !important;
  overflow: hidden;
}

/* Ensure radio buttons are visible */
input[type="radio"] {
  opacity: 1; /* Override any global styles that might be hiding the radios */
  position: static; /* Adjust if needed */
  margin-right: 10px;
}
#exam-modal .modal-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 150px); /* Adjust as needed to fit within the viewport */
}

/* Style for question text */
#exam-modal p {
  margin-bottom: 15px;
  font-size: 24px; /* Adjust size as needed for readability */
}


#exam-modal .option-letter {
  font-weight: bold;
  margin-right: 20px; /* Optional: add space between the letter and the option text */
  font-size: 20px;
  color:rgb(94, 89, 89);
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
  font-size: 20px;
}

#exam-modal input[type="radio"] {
  margin-right: 10px;
}

.btn-margin-right {
  margin-right: 10px !important; /* Adjust as needed */
}
</style>