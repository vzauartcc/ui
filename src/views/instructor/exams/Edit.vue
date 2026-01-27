<template>
	<div v-if="!milestones || !exam"><Spinner /></div>
	<div class="create-exam-container" v-else>
		<div class="card">
			<div class="card-content">
				<span class="card-title">Edit Exam</span>
				<form @submit.prevent="submitExam">
					<div class="row">
						<div class="col s6">
							<div class="input-field">
								<input
									type="text"
									name="title"
									id="title"
									v-model="exam.title"
									maxlength="100"
									data-length="100"
								/>
								<label for="title" class="active">Exam Name <span class="red-text">*</span></label>
							</div>
						</div>
						<div class="input-field col s12">
							<textarea
								name="description"
								id="description"
								v-model="exam.description"
								maxlength="1000"
								data-length="1000"
							></textarea>
							<label for="description" class="active"
								>Exam Description <span class="red-text">*</span></label
							>
						</div>
						<div class="input-field col s4">
							<select v-model="exam.certCode" required class="materialize-select" disabled>
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
						<a href="#" class="btn right col s2 blue" @click.prevent="createQuestion"
							>New Question</a
						>
						<table>
							<thead>
								<tr>
									<td>Question Text</td>
									<td>Is Active</td>
									<td class="options">Options</td>
								</tr>
							</thead>
							<tr v-for="(question, idx) in exam.questions" :key="idx">
								<td>{{ question.text }}</td>
								<td>
									<div class="switch s12 col">
										<label>
											<input
												type="checkbox"
												@change="toggleActive(idx)"
												class="col"
												:checked="question.isActive"
											/>
											<span class="lever"></span>
										</label>
									</div>
								</td>
								<td class="options">
									<span v-if="!(question._id && question._id !== '')">
										<a href="#" class="col s1" @click.prevent="editQuestion(idx)"
											><i class="material-icons">edit</i></a
										>
										<a href="#" class="col s1" @click.prevent="deleteQuestion(idx)">
											<i class="material-icons red-text">delete_forever</i>
										</a>
									</span>
									<a href="#" class="col s1" @click.prevent="viewQuestion(idx)" v-else>
										<i class="material-icons">search</i>
									</a>
								</td>
							</tr>
						</table>
						<a href="#" class="btn right col s2 input-field blue" @click.prevent="createQuestion"
							>New Question</a
						>
					</div>
					<div class="row">
						<button type="submit" class="btn right" :disabled="spinners.length > 0 || !isFormValid">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Save
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

	<teleport to="body">
		<div id="modal_question_edit" class="modal modal_question_edit">
			<div class="modal-content">
				<div class="row">
					<div class="modal-title" v-if="newQuestion.isEdit >= 0">Edit Question</div>
					<div class="modal_title" v-else>Create Question</div>
				</div>
				<div class="row">
					<div class="input-field col s12">
						<textarea
							class="materialize-textarea"
							name="questionText"
							id="questionText"
							v-model="newQuestion.text"
							maxlength="400"
							data-length="400"
							rows="3"
						></textarea>
						<label for="questionText" class="active">Question</label>
					</div>
				</div>
				<div class="row mb-2">
					<div class="row col s12">
						<div class="col">
							<a href="#" class="btn" @click.prevent="addOption">Add option</a>
						</div>
						<div class="col">
							<a href="#" class="btn red" @click.prevent="setTrueFalse">True/False</a>
						</div>
					</div>
				</div>
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
						<input
							type="text"
							v-model="option.text"
							maxlength="100"
							data-length="100"
							class="option-text"
						/>
					</div>
					<a href="#" class="col s1 red-text" @click.prevent="removeOption(idx)"
						><i class="material-icons">delete_forever</i></a
					>
				</div>
			</div>
			<div class="modal-footer">
				<a href="#" @click.prevent="addQuestion(true)" class="blue left btn waves-effect"
					>Save + Create Another</a
				>
				<a href="#" @click.prevent="addQuestion(false)" class="btn waves-effect">Save</a>
				<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
			</div>
		</div>
	</teleport>

	<teleport to="body">
		<div id="modal_question_view" class="modal modal_question_view">
			<div class="modal-content">
				<div class="row">
					<div class="input-field col s12">
						<input
							type="text"
							name="questionText"
							id="questionText"
							v-model="newQuestion.text"
							disabled
						/>
						<label for="questionText" class="active">Question</label>
					</div>
				</div>
				<div class="row mb-2">
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
										disabled=""
									/>
									<span></span>
								</label>
							</div>
							<div class="s10 col">
								<input type="text" v-model="option.text" disabled="" />
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
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
			exam: null,
			newQuestion: {
				text: '',
				options: [
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
				],
				isEdit: -1,
			},
		};
	},
	async mounted() {
		await this.getMilestones();
		await this.getExam();

		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.CharacterCounter.init(document.querySelectorAll('input[type="text"]'), {});
		M.CharacterCounter.init(document.querySelectorAll('textarea'), {});
	},
	computed: {
		isFormValid() {
			return !(
				this.exam.title.trim() === '' ||
				this.exam.certCode.trim() === '' ||
				this.exam.questions.length === 0
			);
		},
	},
	methods: {
		async getExam() {
			try {
				const { data } = await zauApi.get(`/exam/${this.$route.params.examId}`);
				this.exam = data;
			} catch (e) {
				console.error('error getting exam', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
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
				options: [
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
				],
				isEdit: -1,
			};

			this.openQuestionModal();
		},
		openQuestionModal() {
			this.$nextTick(() => {
				const modal = document.getElementById(`modal_question_edit`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				}
			});
		},
		addQuestion(createAnother) {
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
				this.exam.questions[this.newQuestion.isEdit].text = this.newQuestion.text;
				this.exam.questions[this.newQuestion.isEdit].options = this.newQuestion.options;
			} else {
				this.exam.questions.push({
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

			if (createAnother === false) {
				M.Modal.getInstance(document.getElementById('modal_question_edit')).close();
			}
		},

		addOption() {
			this.newQuestion.options.push({ text: '', isCorrect: false });

			this.$nextTick(() => {
				M.CharacterCounter.init(document.querySelectorAll('input[type="text"].option-text'), {});
			});
		},
		setTrueFalse() {
			this.newQuestion.options = [
				{ text: 'True', isCorrect: false },
				{ text: 'False', isCorrect: false },
			];

			this.$nextTick(() => {
				M.CharacterCounter.init(document.querySelectorAll('input[type="text"].option-text'), {});
			});
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

		toggleActive(idx) {
			this.exam.questions[idx].isActive = !this.exam.questions[idx].isActive;
		},

		editQuestion(index) {
			this.newQuestion.isEdit = index;
			this.newQuestion.text = this.exam.questions[index].text;
			this.newQuestion.options = [...this.exam.questions[index].options];

			this.openQuestionModal();
		},
		deleteQuestion(index) {
			const retval = [];
			for (let i = 0; i < this.exam.questions.length; i++) {
				if (i !== index) {
					retval.push(this.exam.questions[i]);
				}
			}

			this.exam.questions = retval;
		},
		viewQuestion(index) {
			this.newQuestion.text = this.exam.questions[index].text;
			this.newQuestion.options = [...this.exam.questions[index].options];

			this.$nextTick(() => {
				const modal = document.getElementById(`modal_question_view`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				} else {
					console.error('unable to find view question modal');
					this.toastError('Something went wrong, please try again later');
				}
			});
		},

		async submitExam() {
			// Check for an empty exam name
			if (!this.exam.title.trim()) {
				this.toastError('Please provide an exam name');
				return;
			}

			// Check if there are no questions added
			if (this.exam.questions.length === 0) {
				this.toastError('Please add at least one question to the exam');
				return;
			}

			if (this.exam.certCode.trim() === '') {
				this.toastError('Milestone is required');
				return;
			}

			// Prepare the exam data for submission
			const examData = {
				title: this.exam.title,
				description: this.exam.description,
				questions: this.exam.questions,
				certCode: this.exam.certCode,
				isActive: this.exam.isActive,
			};

			try {
				this.spinners.push('submit');
				await zauApi.patch(`/exam/${this.exam._id}`, examData);
				this.$router.push({ path: '/ins/exams' });

				this.toastSuccess('Exam updated successfully');
			} catch (e) {
				console.error('error submitting exam', e);
				this.toastError(e.response.data.message || 'Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.options {
	width: 1em;

	i {
		cursor: pointer;
		user-select: none;
	}
}
</style>
