<template>
	<div class="create-exam-container">
		<div class="card">
			<div class="card-content">
				<div class="card-title col s12">
					<span class="card-title">Create Exam</span>
				</div>
				<form @submit.prevent="addQuestion">
					<!-- Toggle between Multiple Choice and True/False -->
					<div class="switch">
						<!-- Disable switch when editing a question -->
						<label>
							Multiple Choice
							<input
								type="checkbox"
								v-model="isTrueFalse"
								:disabled="editingQuestionIndex !== null"
							/>
							<span class="lever" :class="{ active: newQuestion.isTrueFalse }"></span>
							True/False
						</label>
					</div>
					<!-- Question Text Input -->
					<div class="row">
						<div class="input-field col s12">
							<input type="text" id="question" v-model="newQuestion.text" />
							<label for="question" :class="{ active: newQuestion.text }">Question</label>
						</div>
					</div>
					<!-- Options Input -->
					<div class="row">
						<div v-if="!isTrueFalse">
							<div v-for="index in [0, 1, 2, 3]" :key="index" class="col s6">
								<label>
									<input
										type="radio"
										name="correctOption"
										:value="index"
										v-model="correctOptionIndex"
										class="with-gap"
									/>
									<span></span>
								</label>
								<div class="input-field inline">
									<input
										type="text"
										:id="'option' + index"
										v-model="newQuestion.options[index].text"
									/>
									<label
										:for="'option' + index"
										:class="{ active: newQuestion.options[index].text }"
										>Option {{ index + 1 }}</label
									>
								</div>
							</div>
						</div>
						<div v-else>
							<div class="col s1">
								<label>
									<input
										type="radio"
										name="correctOption"
										value="0"
										v-model="correctOptionIndex"
										class="with-gap"
									/>
									<span>True</span>
								</label>
								<label>
									<input
										type="radio"
										name="correctOption"
										value="1"
										v-model="correctOptionIndex"
										class="with-gap"
									/>
									<span>False</span>
								</label>
							</div>
						</div>
					</div>
					<!-- Submit Button -->
					<div class="row">
						<div class="col s12 right-align">
							<button type="submit" class="btn right">
								{{ editingQuestionIndex === null ? 'Add Question' : 'Update Question' }}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>

	<!-- Questions List -->
	<div class="card" v-if="questions.length > 0">
		<div class="card-content">
			<div class="card-title col s12"><span class="card-title">Exam Questions</span></div>
			<table>
				<thead>
					<tr>
						<th>Question</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(question, qIndex) in questions" :key="qIndex">
						<td>{{ question.text }}</td>
						<td>
							<button @click="editQuestion(qIndex)" class="btn waves-effect waves-light">
								<i class="material-icons">edit</i>
							</button>
							<button @click="removeQuestion(qIndex)" class="btn red waves-effect waves-light">
								<i class="material-icons">delete</i>
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<!-- Exam Name Input and Submit Button -->
	<div class="card bottom" v-if="questions.length > 0">
		<div class="card-content bottom">
			<div class="row">
				<!-- Exam Name Input -->
				<div class="input-field col s8 m6">
					<input id="exam-name" type="text" v-model="examName" maxlength="50" />
					<label for="exam-name" :class="{ active: examName }">Exam Name</label>
				</div>
				<!-- Duration Input -->
				<div class="input-field col s8 m2">
					<input id="exam-duration" type="number" v-model="examDuration" />
					<label for="exam-duration" :class="{ active: examDuration }">Duration (minutes)</label>
				</div>
				<!-- Submit Button -->
				<div class="col s12 m4 right-align">
					<button
						class="btn bottom waves-effect waves-light"
						@click="submitExam"
						:disabled="spinners.length > 0"
					>
						<span v-if="spinners.some((s) => s === 'submit')"> <SmallSpinner /> </span>
						Submit Exam<i class="material-icons right">send</i>
					</button>
				</div>
			</div>
			<!-- Description Input -->
			<div class="row">
				<div class="input-field col s8 m9">
					<textarea
						id="exam-description"
						class="materialize-textarea"
						v-model="examDescription"
					></textarea>
					<label for="exam-description" :class="{ active: examDescription }">Description</label>
				</div>
				<div class="input-field col s8 m3">
					<input id="exam-questionSubset" type="number" v-model="questionSubsetSize" />
					<label for="exam-questionSubset" :class="{ active: questionSubsetSize }"
						>Questions Per Test</label
					>
				</div>
			</div>
		</div>
		<!-- Materialize Modal for Confirmation -->
		<div ref="removeQuestionModal" id="removeQuestionModal" class="modal">
			<div class="modal-content">
				<h4>Confirm Removal</h4>
				<p>Are you sure you want to remove this question?</p>
			</div>
			<div class="modal-footer">
				<a
					href="javascript:void(0);"
					class="modal-close waves-effect waves-red btn-flat"
					@click="cancelRemove()"
					>Cancel</a
				>
				<a
					href="javascript:void(0);"
					class="modal-close waves-effect waves-green btn-flat"
					@click="confirmRemove()"
					>Confirm</a
				>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	data() {
		return {
			spinners: [],
			examName: '',
			examDescription: '',
			examDuration: '240',
			newQuestion: {
				text: '',
				options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
				isTrueFalse: false,
			},
			isTrueFalse: false, // false for Multiple Choice, true for True/False
			correctOptionIndex: null,
			questions: [],
			editingQuestionIndex: null,
			questionSubsetSize: '',
			questionToRemoveIndex: null,
			modalInitialized: false,
		};
	},
	mounted() {
		this.initializeModal();
	},
	watch: {
		// Assuming `questions.length` dictates modal availability
		'questions.length'(newLength) {
			this.$nextTick(() => {
				if (newLength > 0 && !this.modalInstance) {
					this.initializeModal();
				}
			});
		},
	},
	methods: {
		addQuestion() {
			// Check if the question text is empty
			if (!this.newQuestion.text.trim()) {
				this.toastError('Please fill in the question.');
				return;
			}

			// Set the question type based on the toggle
			this.newQuestion.isTrueFalse = this.isTrueFalse;

			// True/False Question Validation
			if (this.isTrueFalse) {
				if (this.correctOptionIndex === null) {
					this.toastError('Please select a correct option.');
					return;
				}
				// Set the True/False options and mark the correct one
				this.newQuestion.options = [
					{ text: 'True', isCorrect: this.correctOptionIndex === 0 },
					{ text: 'False', isCorrect: this.correctOptionIndex === 1 },
				];
			} else {
				// Multiple-Choice Question Validation
				if (this.newQuestion.options.some((option) => !option.text.trim())) {
					this.toastError('Please fill in all options.');
					return;
				}
				if (this.correctOptionIndex === null) {
					this.toastError('Please select a correct option.');
					return;
				}
			}

			// Update the correct option index if editing a true/false question
			if (this.isTrueFalse && this.editingQuestionIndex !== null) {
				// Find the selected option and update isCorrect accordingly
				this.newQuestion.options.forEach((option, index) => {
					option.isCorrect = index === parseInt(this.correctOptionIndex);
				});
			}

			// Mark the correct option for multiple-choice questions
			if (!this.isTrueFalse) {
				this.newQuestion.options.forEach((option, index) => {
					option.isCorrect = index === parseInt(this.correctOptionIndex);
				});
			} else {
				// For true/false, automatically set isCorrect based on the option text
				this.newQuestion.options.forEach((option, index) => {
					option.isCorrect = index === parseInt(this.correctOptionIndex);
				});
			}

			if (this.editingQuestionIndex !== null) {
				// Directly assign the updated question to the specific index in the array
				// This will maintain reactivity in Vue 3
				this.questions[this.editingQuestionIndex] = { ...this.newQuestion };
				// Ensure to trigger reactivity for arrays explicitly if needed
				this.questions = [...this.questions];
			} else {
				// Add a new question to the array
				this.questions.push(this.newQuestion);
			}

			// Reset form for next question
			this.resetForm();
		},

		getOptionText(index) {
			// Ensure that newQuestion.options[index] exists before accessing its text property
			if (this.newQuestion.options[index]) {
				return this.newQuestion.options[index].text;
			} else {
				return ''; // Return an empty string if newQuestion.options[index] is undefined
			}
		},

		resetForm() {
			this.newQuestion = {
				text: '',
				options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
			};
			this.correctOptionIndex = null;
			this.editingQuestionIndex = null; // No longer editing
		},

		editQuestion(index) {
			this.editingQuestionIndex = index; // Track the index of the question being edited
			const questionToEdit = this.questions[index];
			this.newQuestion = JSON.parse(JSON.stringify(questionToEdit)); // Deep clone the question to avoid direct mutation
			this.isTrueFalse = this.newQuestion.isTrueFalse;
			this.correctOptionIndex = questionToEdit.options.findIndex((option) => option.isCorrect);
		},

		initializeModal() {
			this.$nextTick(() => {
				const modalElem = this.$refs.removeQuestionModal;
				if (modalElem) {
					M.Modal.init(modalElem);
					this.modalInitialized = true;
				}
			});
		},

		removeQuestion(index) {
			if (!this.modalInitialized) {
				this.initializeModal(); // Ensure modal is initialized
			}
			this.questionToRemoveIndex = index;
			this.$nextTick(() => {
				const instance = M.Modal.getInstance(this.$refs.removeQuestionModal);
				if (instance) {
					instance.open();
				} else {
					console.error('Modal instance is not available.');
				}
			});
		},

		confirmRemove() {
			// Use the stored index to remove the question
			if (this.questionToRemoveIndex !== null) {
				if (this.editingQuestionIndex === this.questionToRemoveIndex) {
					// The question being edited is the one being deleted, reset the form
					this.resetForm();
					// Additionally, reset editingQuestionIndex to indicate no question is currently being edited
					this.editingQuestionIndex = null;
				}
				this.questions.splice(this.questionToRemoveIndex, 1);
				this.questionToRemoveIndex = null; // Reset the index
			}
		},

		cancelRemove() {
			// Reset the index if the user cancels
			this.questionToRemoveIndex = null;
		},

		async submitExam() {
			// Check for an empty exam name
			if (!this.examName.trim()) {
				this.toastError('Please provide an exam name.');
				return;
			}

			// Check if there are no questions added
			if (this.questions.length === 0) {
				this.toastError('Please add at least one question to the exam.');
				return;
			}

			if (
				!this.examDuration ||
				isNaN(this.examDuration) ||
				this.examDuration <= 0 ||
				this.examDuration >= 601 ||
				!Number.isInteger(Number(this.examDuration))
			) {
				this.toastError('Please enter a valid exam duration between 0 and 600 (Whole Minutes).');
				return; // Stop the submission process if validation fails
			}

			// First, ensure questionSubsetSize is parsed as a number, if it's numeric
			if (
				!this.questionSubsetSize ||
				isNaN(this.questionSubsetSize) ||
				this.questionSubsetSize <= 0 ||
				!Number.isInteger(Number(this.questionSubsetSize))
			) {
				this.toastError('Please enter a valid number of questions per test.');
				return; // Stop the submission process if validation fails
			}

			// Validate if questionSubsetSize exceeds the number of questions in the array
			if (this.questionSubsetSize > this.questions.length) {
				this.toastError(
					`The number of questions per test cannot exceed the total number of questions (${this.questions.length}).`,
				);
				return; // Stop the submission process if validation fails
			}

			// Prepare the exam data for submission
			const examData = {
				title: this.examName,
				description: this.examDescription,
				questions: this.questions,
				questionSubsetSize: this.questionSubsetSize,
				timeLimit: parseInt(this.examDuration),
			};

			try {
				this.spinners.push('submit');
				// Example API call to save the exam
				await zauApi.post('/exam/exams', examData);
				// If successful, redirect to the exams index page
				this.$router.push({ path: '/ins/exams' });
				// Optionally, display a success message
				this.toastSuccess('Exam submitted successfully');
			} catch (e) {
				console.error('error submitting exam', e);
				// Handle API errors (e.g., show an error message)
				this.toastError(e.message || 'Failed to submit the exam.');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
	},
};
</script>

<style scoped>
.card {
	padding: 10px;
	width: 100%;
	background-color: white;
	border: 1px solid #ddd;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card.bottom {
	padding: 10px;
	width: 100%;
	background-color: white;
	border: 1px solid #ddd;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.input-field input[type='text']:focus + label {
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

th,
td {
	padding: 8px;
	border: 1px solid #ddd;
}

/* Ensure the question column takes the remaining space */
th:first-child,
td:first-child {
	width: 80%;
}

/* Align actions to the right */
th:last-child,
td:last-child {
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
