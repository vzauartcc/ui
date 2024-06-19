<template>
  <div id="score-modal" class="modal modal-fixed-footer with-header">
    <div class="modal-header">
      <h4>Exam Results</h4>
      <p class="score-text">
        Your Score: <span :class="score >= 80 ? 'green-text' : 'red-text'">{{ score }}%</span>
      </p>
    </div>
    <div class="modal-content scrollable-content">
      <ul class="collection with-header">
        <li v-for="(question, index) in questions" :key="question._id" class="collection-item">
          <div class="question-text">{{ index + 1 }}. {{ question.text }}</div>
          <ul>
            <li v-for="(option, index) in question.options" :key="option._id">
              <span>
                <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span> {{ option.text }}
                <i v-if="option.isCorrect === true" class="material-icons green-text">check</i>
                <i v-if="option._id === question.selectedOption && option.isCorrect === false" class="material-icons red-text">close</i>
              </span>
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div class="modal-footer">
      <button class="modal-close btn waves-effect waves-light" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExamScoreModal',
  props: ['score', 'questions'],
  methods: {
    getOptionLetter(index) {
      return String.fromCharCode(65 + index); // Convert index to letter (0 -> A, 1 -> B, etc.)
    },
  },
};
</script>

<style scoped>
.green-text {
  color: #4CAF50 !important;
}

.red-text {
  color: #F44336 !important;
}

.option-letter {
  font-weight: bold;
  margin-right: 5px;
}

.question-text {
  font-size: 20px; /* Make question text larger */
  font-weight: bold;
  margin-bottom: 10px;
}

.collection-item {
  padding: 10px 0; /* Adjust as needed */
}

.collection-item span {
  font-size: 18px; /* Adjust size as needed */
}

.collection-item span i.material-icons {
  vertical-align: middle; /* Align icons with text */
}

.modal-footer .btn {
  margin-bottom: 0;
}

.modal-header {
    padding: 14px;
    text-align: center;
    position: sticky;
}
.modal.modal-fixed-footer.with-header .modal-content {
    height: calc(88% - 56px) !important;
    padding: 23px !important;
}

.modal-content {
  padding-top: 20px;
  padding-bottom: 160px;
  overflow-y: auto;
  max-height: calc(100vh - 120px); /* Adjust based on header/footer height */
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
}

.score-text {
  margin: 0;
  color: black;
}

.modal {
  position: absolute;
  overflow-y: hidden;
}
</style>
