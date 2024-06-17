<template>
    <div class="playground">
        <button class="btn waves-effect waves-light" @click="openExamModal">Open Exam</button>
        <ExamModal ref="examModal" :currentTest="mockExam" />
    </div>
</template>
  
<script>
import ExamModal from '../dashboard/training/ExamModal.vue';
  
export default {
    components: {
      ExamModal,
    },
    data() {
        return {
            isModalOpen: false,
      // Directly defining mock data within the playground component
      mockExam: {
        title: "Fundamentals of Programming",
        description: "An exam covering basic programming concepts, including variables, control structures, and data structures.",
        questions: [
          {
            text: "Which data type is typically used to store a textual value?",
            isTrueFalse: false,
            options: [
              { text: "Integer", isCorrect: false },
              { text: "String", isCorrect: true },
              { text: "Boolean", isCorrect: false },
              { text: "Array", isCorrect: false },
            ],
          },
          {
            text: "A 'for' loop is used to iterate over a sequence.",
            isTrueFalse: true,
            options: [
              { text: "True", isCorrect: true },
              { text: "False", isCorrect: false },
            ],
          },
          {
            text: "Which of the following is a valid JSON format?",
            isTrueFalse: false,
            options: [
              { text: "{ key: 'value' }", isCorrect: false },
              { text: '{"key": "value"}', isCorrect: true },
              { text: "<key>value</key>", isCorrect: false },
              { text: "'key' = 'value'", isCorrect: false },
            ],
                }
                ],
                questionSubsetSize: 3,
                timeLimit: 30,
                endTime: new Date('2024-12-31T23:59:59'),
                createdBy: "5f8d0d55b54764421b715e3d",
            },
        };
    },
    methods: {
        openExamModal() {
            this.$refs.examModal.openModal();
        },
    },
};
</script>
  