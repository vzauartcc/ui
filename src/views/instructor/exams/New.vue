<template>
	<div v-if="!milestones"><Spinner /></div>
	<div class="create-exam-container" v-else>
		<div class="card">
			<div class="card-content">
				<span class="card-title">Create Exam</span>
				<form @submit.prevent="submitExam">
					<div class="row">
						<div class="input-field col s6">
							<input type="text" name="title" id="title" v-model="examName" />
							<label for="title" class="active">Exam Name <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s12">
							<input type="text" name="description" id="description" v-model="examDescription" />
							<label for="description">Exam Description <span class="red-text">*</span></label>
						</div>
						<div class="input-field col s4">
							<select v-model="milestone" required class="materialize-select">
								<option value="" disabled selected>Select a milestone</option>
								<option
									v-for="milestone in milestones"
									:key="milestone._id"
									:value="milestone.code"
								>
									{{ milestone.name }}
								</option>
							</select>
							<label>Milestone <span class="red-text">*</span></label>
						</div>
					</div>
					<div class="row">
						<h6 class="col s10">Questions</h6>
						<a href="#" class="btn right col s2" @click.prevent="createQuestion">New Question</a>
						<table>
							<thead>
								<tr>
									<td>Question Text</td>
									<td>Is Active</td>
									<td class="options">Options</td>
								</tr>
							</thead>
							<tr v-for="(question, idx) in questions" :key="idx">
								<td>{{ question.text }}</td>
								<td>
									<label>
										<input
											type="checkbox"
											name=""
											class="active"
											v-model="question.isActive"
											id="indeterminate-checkbox"
										/>
										<span></span>
									</label>
								</td>
								<td class="options">
									<a href="#" class="col s1" @click.prevent="editQuestion(idx)"
										><i class="material-icons">edit</i></a
									>
									<a href="#" class="col s1 red-text" @click.prevent="removeQuestion(idx)"
										><i class="material-icons">delete_forever</i></a
									>
								</td>
							</tr>
						</table>
					</div>
					<div class="row">
						<button type="submit" class="btn right" :disabled="spinners.length > 0 || !isFormValid">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Create!
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

	<teleport to="body">
		<div id="modal_question" class="modal modal_question">
			<div class="modal-content">
				<div class="modal-title" v-if="newQuestion.isEdit >= 0">Edit Question</div>
				<div class="modal_title" v-else>Create Question</div>
				<div class="row">
					<div class="input-field col s12">
						<input type="text" name="questionText" id="questionText" v-model="newQuestion.text" />
						<label for="questionText" class="active">Question</label>
					</div>
				</div>
				<div class="row col mb-2">
					<a href="#" class="btn" @click.prevent="addOption">Add option</a>
					<div class="row">
						<div class="row">
							<p class="col s1">Correct</p>
							<p class="col">Answer</p>
						</div>
						<div class="row" v-for="(option, idx) in newQuestion.options" :key="idx">
							<div class="col s1">
								<label>
									<input
										type="checkbox"
										class="active"
										v-model="option.isCorrect"
										id="indeterminate-checkbox"
									/>
									<span></span>
								</label>
							</div>
							<div class="s10 col">
								<input type="text" v-model="option.text" />
							</div>
							<a href="#" class="col s1 red-text" @click.prevent="removeOption(idx)"
								><i class="material-icons">delete_forever</i></a
							>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<a href="#" @click.prevent="addQuestion" class="btn waves-effect"> Save</a>
				<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
			</div>
		</div>
	</teleport>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	data() {
		return {
			spinners: [],
			milestones: null,
			milestone: '',
			examName: '',
			examDescription: '',
			newQuestion: {
				text: '',
				options: [{ text: '', isCorrect: false }],
				isEdit: -1,
			},
			questions: [],
		};
	},
	async mounted() {
		await this.getMilestones();

		M.FormSelect.init(document.querySelectorAll('select'), {});
	},
	computed: {
		isFormValid() {
			return !(
				this.examName.trim() === '' ||
				this.milestone.trim() === '' ||
				this.questions.length === 0
			);
		},
	},
	methods: {
		async getMilestones() {
			try {
				const { data } = await zauApi.get('/controller/certifications');
				this.milestones = data
					.filter((m) => !m.class.includes('solo'))
					.sort((a, b) => a.order - b.order);
			} catch (e) {
				this.toastError('Something went wrong, please try again later');
				console.error('error getting milestones', e);
			}
		},
		createQuestion() {
			this.newQuestion = {
				text: '',
				options: [{ text: '', isCorrect: false }],
				isEdit: -1,
			};

			this.openQuestionModal();
		},
		openQuestionModal() {
			this.$nextTick(() => {
				const modal = document.getElementById(`modal_question`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				}
			});
		},
		addQuestion() {
			// Check if the question text is empty
			if (!this.newQuestion.text.trim()) {
				this.toastError('Please fill in the question.');
				return;
			}

			if (this.newQuestion.text.length > 400) {
				this.toastError('Question length cannot exceed 400 characters');
				return;
			}

			if (this.newQuestion.options.length < 2) {
				this.toastError('At least two options are required');
				return;
			}

			if (this.newQuestion.options.every((o) => o.isCorrect === false)) {
				this.toastError('At least one option must be marked correct');
				return;
			}

			if (this.newQuestion.options.every((o) => o.text.trim() === '')) {
				this.toastError('Please fill in the option text.');
				return;
			}

			if (this.newQuestion.options.some((o) => o.text.length > 100)) {
				this.toastError('Answers may not exceed 100 characters');
				return;
			}

			if (this.newQuestion.isEdit >= 0) {
				this.questions[this.newQuestion.isEdit].text = this.newQuestion.text;
				this.questions[this.newQuestion.isEdit].options = this.newQuestion.options;
			} else {
				this.questions.push({
					text: this.newQuestion.text,
					isActive: true,
					options: this.newQuestion.options,
				});
			}

			this.newQuestion = {
				text: '',
				options: [{ text: '', isCorrect: false }],
				isEdit: -1,
			};

			M.Modal.getInstance(document.getElementById('modal_question')).close();
		},

		addOption() {
			this.newQuestion.options.push({ text: '', isCorrect: false });
		},

		removeOption(index) {
			const newOptions = [];
			for (let i = 0; i < this.newQuestion.options.length; i++) {
				if (i !== index) {
					newOptions.push(this.newQuestion.options[i]);
				}
			}

			this.newQuestion.options = newOptions;
		},

		editQuestion(index) {
			this.newQuestion.isEdit = index;
			this.newQuestion.text = this.questions[index].text;
			this.newQuestion.options = [...this.questions[index].options];

			this.openQuestionModal();
		},

		removeQuestion(index) {
			const newQuestions = [];
			for (let i = 0; i < this.questions.length; i++) {
				if (i !== index) {
					newQuestions.push(this.questions[i]);
				}
			}

			this.questions = newQuestions;
		},

		async submitExam() {
			// Check for an empty exam name
			if (!this.examName.trim()) {
				this.toastError('Please provide an exam name');
				return;
			}

			// Check if there are no questions added
			if (this.questions.length === 0) {
				this.toastError('Please add at least one question to the exam');
				return;
			}

			if (this.milestone.trim() === '') {
				this.toastError('Milestone is required');
				return;
			}

			// Prepare the exam data for submission
			const examData = {
				title: this.examName,
				description: this.examDescription,
				questions: this.questions,
				certCode: this.milestone,
			};

			try {
				this.spinners.push('submit');
				await zauApi.post('/exam', examData);
				this.$router.push({ path: '/ins/exams' });

				this.toastSuccess('Exam submitted successfully');
			} catch (e) {
				console.error('error submitting exam', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.options {
	width: 7em;

	i {
		cursor: pointer;
		user-select: none;
	}
}
</style>
