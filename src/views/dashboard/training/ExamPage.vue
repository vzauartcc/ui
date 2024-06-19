<template>
 <div>
    <div v-if="examState === 'not_attempted'">
      <p>Not Attempted</p>
      <button class="btn green waves-effect waves-light" @click="startExam">Start</button>
    </div>
    <div v-else-if="examState === 'in_progress'">
      <p>In Progress</p>
      <button class="btn green waves-effect waves-light" @click="startExam">
        {{ formattedTimeRemaining }}
      </button>
    </div>
    <div v-else-if="examState === 'completed'">
      <p>Completed</p>
    </div>
    <div v-else-if="examState === 'cooldown'">
      <p>In Cooldown</p>
      <button class="btn red waves-effect waves-light">
        {{ formattedCooldownTimeRemaining }}
      </button>
    </div>
    <ExamModal ref="examModal" :currentTest="currentTest" @close="closeExamModal" @submit="handleExamSubmit" />
    <ExamScoreModal ref="scoreModal" :score="score" :questions="scoredQuestions" @close="closeScoreModal" />

  </div>
</template>

<script>
import ExamModal from '../training/ExamModal.vue';
import ExamScoreModal from '../training/ExamScoreModal.vue';
import { zabApi } from '../../../helpers/axios.js'

export default {
  name: 'ExamPage',
  components: {
    ExamModal,
    ExamScoreModal
  },
  data() {
    return {
      showExamModal: false,
      showScoreModal: false,
      currentTest: {
        title: '',
        examId: '65d5222ae3c16270b1203497', // Replace with actual exam ID', // Replace with actual exam ID
        endTime: '2024-06-17T23:59:59Z',
        questions: [],
      },
      examState: 'not_attempted', // States: not_attempted, in_progress, completed, cooldown
      timeRemaining: null,
      attemptId: null,
      score: null,
      scoredQuestions: [],
    };
  },
  computed: {
    formattedTimeRemaining() {
      return this.formatTime(this.calculateRemainingTime(this.currentTest.endTime));
    },
    formattedCooldownTimeRemaining() {
      const cooldownEndTime = new Date(new Date(this.currentTest.endTime).getTime() + 22 * 60 * 60 * 1000);
      return this.formatTime(this.calculateRemainingTime(cooldownEndTime.toISOString()));
    },
  },
  methods: {
    async startExam() {
      try {
        console.log('Starting exam with ID:', this.currentTest.examId);
        const response = await zabApi.post(`/exam/start/${this.currentTest.examId}`);
        console.log('Response from server:', response.data);
        if (response.data && response.data.attemptId) {
          this.currentTest.attemptId = response.data.attemptId;
          this.currentTest.title = response.data.exam
          this.timeRemaining = response.data.timeRemaining;
          this.currentTest.endTime = response.data.endTime;
          this.currentTest.questions = response.data.questions; // Update questions with server response
          this.examState = 'in_progress';
          this.showExamModal = true;
          this.$nextTick(() => {
            const elem = this.$refs.examModal.$el;
            const instance = M.Modal.init(elem, { dismissible: false });
            instance.open();
          });
          this.startTimer();
        }
      } catch (error) {
        console.error('Error starting exam:', error);
        if (error.response && error.response.data) {
          const data = error.response.data;
          console.log('Error response data:', data);
          if (data.message === 'You are in cooldown period.') {
            this.cooldownTimeRemaining = data.cooldownTime;
            this.examState = 'cooldown';
            this.startCooldownTimer();
          }
        }
      }
    },
    closeExamModal() {
      this.showExamModal = false;
    },
    closeScoreModal() {
      this.showScoreModal = false;
    },
    handleExamSubmit(data) {
      this.score = data.score;
      this.scoredQuestions = data.questions;
      this.examState = 'completed';
      this.$nextTick(() => {
        const elem = this.$refs.scoreModal.$el;
        const instance = M.Modal.init(elem, { dismissible: false });
        instance.open();
      });
    },
    calculateRemainingTime(endTimeISO) {
      const endTime = new Date(endTimeISO).getTime();
      const currentTime = new Date().getTime();
      return Math.max(endTime - currentTime, 0);
    },
    formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining -= 1000;
        } else {
          clearInterval(this.timerInterval);
          this.examState = 'completed';
        }
      }, 1000);
    },
    startCooldownTimer() {
      this.cooldownTimerInterval = setInterval(() => {
        if (this.cooldownTimeRemaining > 0) {
          this.cooldownTimeRemaining -= 1000;
        } else {
          clearInterval(this.cooldownTimerInterval);
          this.examState = 'not_attempted';
        }
      }, 1000);
    },
  },
  watch: {
    showExamModal(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          const elem = this.$refs.examModal.$el;
          const instance = M.Modal.init(elem, { dismissible: false });
          instance.open();
        });
      }
    },
    showScoreModal(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          const elem = this.$refs.scoreModal.$el;
          const instance = M.Modal.init(elem, { dismissible: false });
          instance.open();
        });
      }
    }
  },
  beforeDestroy() {
    clearInterval(this.timerInterval);
    clearInterval(this.cooldownTimerInterval);
  },
};
</script>

<style scoped>
button {
  margin: 20px;
  font-size: 16px;
}
</style>
