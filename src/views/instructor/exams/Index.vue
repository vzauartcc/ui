<template>
	<div class="card home_intro">
		<div class="card-content">
			<!-- Always show Exam Center title -->
			<div class="row">
				<div class="col s10">
					<span class="card-title">Exam Center</span>
				</div>
				<!-- Conditionally show the Create button if exams have been fetched -->
				<div class="col s2 right-align" v-if="exams">
					<router-link to="/ins/exams/new" class="btn new_event_button">Create</router-link>
				</div>
			</div>

			<!-- Show spinner while loading -->
			<div v-if="!exams" class="center-align">
				<Spinner />
			</div>

			<!-- Show no exams message if exams array is empty -->
			<div v-if="exams && exams.length === 0" class="left-align">
				<p class="no_exams">There are no exams to display</p>
			</div>

			<!-- Show table if exams array is not empty -->
			<div v-if="exams && exams.length > 0">
				<div class="card-body">
					<table class="table">
						<thead>
							<tr>
								<th>Title</th>
								<th class="center-align">Created By</th>
								<th class="center-align">Milestone</th>
								<th class="center-align">Questions {{ isExamEditor ? '(Active / Total)' : '' }}</th>
								<th class="center-align">Active</th>
								<th class="center-align">Options</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="exam in exams" :key="exam._id">
								<td
									:class="{ tooltipped: shouldShowTooltip(exam.title) }"
									:data-tooltip="shouldShowTooltip(exam.title) ? exam.title : ''"
								>
									{{ truncateExamName(exam.title, 20).text }}
								</td>
								<td class="center-align">
									{{ exam.user.fname + ' ' + exam.user.lname }}
								</td>
								<td class="center-align">{{ exam.certification.name }}</td>
								<td class="center-align">
									{{ exam.questions.filter((e) => e.isActive).length }}
									{{ isExamEditor ? `/ ${exam.questions.length}` : '' }}
								</td>
								<td class="center-align">
									<div class="switch">
										<label>
											<input
												type="checkbox"
												@change="toggleActive(exam._id)"
												:checked="exam.isActive"
											/>
											<span class="lever"></span>
										</label>
									</div>
								</td>
								<td class="center-align">
									<a
										href="#"
										@click="prepareAssign(exam._id)"
										class="blue-text tooltipped"
										data-position="top"
										data-tooltip="Assign Exam"
										v-if="exam.isActive"
									>
										<i class="material-icons">person_add</i>
									</a>
									<a
										href="#"
										@click="editExam(exam._id)"
										class="tooltipped"
										data-position="top"
										data-tooltip="Edit Exam"
										v-if="isExamEditor"
									>
										<i class="material-icons">edit</i>
									</a>
									<a
										href="#"
										@click="prepareDelete(exam._id)"
										class="red-text modal-trigger tooltipped"
										data-position="top"
										data-tooltip="Delete Exam"
										v-if="isExamEditor"
									>
										<i class="material-icons">delete</i>
									</a>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
		<teleport to="body">
			<div v-for="exam in exams" :key="`modal_${exam._id}`">
				<!-- Assign Modal -->
				<div :id="`modal_assign_${exam._id}`" class="modal modal_assign">
					<div class="modal-content">
						<div class="modal_title">Assign Exam</div>
					</div>
					<div class="row">
						<div class="input-field col s12 m6">
							<select class="materialize-select" v-model="controller" required>
								<option value="" disabled selected>Select a controller</option>
								<option
									v-for="controller in controllers"
									:value="controller.cid"
									:key="controller.cid"
								>
									{{ controller.fname }} {{ controller.lname }}
								</option>
							</select>
							<label>Controller</label>
						</div>
					</div>
					<div class="modal-footer">
						<a href="#!" class="waves-effect btn-flat modal-close" @click.prevent="controller = 0"
							>Close</a
						>
						<a
							href="#!"
							class="btn blue white-text waves-effect modal-close"
							@click.prevent="assignExam(exam._id)"
							>Assign</a
						>
					</div>
				</div>

				<!-- Delete Modal -->
				<div :id="`modal_delete_${exam._id}`" class="modal modal_delete">
					<div class="modal-content">
						<h4>Delete Exam?</h4>
						<p>
							This will delete the exam
							<strong>{{ exam.title }}</strong>
						</p>
					</div>
					<div class="modal-footer">
						<a
							href="#!"
							@click.prevent="confirmDelete(exam._id)"
							class="btn waves-effect modal-close"
							:class="{ disabled: spinners.length > 0 }"
							><span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>Delete</a
						>
						<a href="#!" class="btn-flat waves-effect modal-close" @click.prevent>Cancel</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	name: 'ExamCenter',
	title: 'Exam Center',
	data() {
		return {
			spinners: [],
			exams: [],
			controllers: [],
			controller: 0,
			selectedExamId: null,
			examEditors: ['atm', 'datm', 'ta', 'ia'],
		};
	},
	async created() {
		await this.fetchExams();
		await this.fetchControllers();

		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});
		M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
	},
	mounted() {
		this.initializeTooltips();
	},
	updated() {
		this.initializeTooltips();
	},
	methods: {
		async fetchExams() {
			try {
				const { data } = await zauApi.get('/exam');
				this.exams = data;
			} catch (e) {
				console.error('error getting exams', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async fetchControllers() {
			try {
				const { data } = await zauApi.get('/feedback/controllers');
				this.controllers = data;
			} catch (e) {
				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		editExam(id) {
			this.$router.push(`/ins/exams/${id}`);
		},
		prepareAssign(id) {
			const modal = document.getElementById(`modal_assign_${id}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		prepareDelete(id) {
			this.selectedExamId = id;
			const modal = document.getElementById(`modal_delete_${id}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		cancelDelete() {
			this.selectedExamId = null;
		},
		async assignExam(id) {
			if (this.controller === 0) return;

			try {
				this.spinners.push('assign');

				await zauApi.post(`/exam/${id}/assign`, {
					cid: this.controller,
				});

				this.controller = 0;
				this.spinners = this.spinners.filter((s) => s !== 'assign');
			} catch (e) {
				console.error('error assigning exam', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'assign');
			}
		},
		async confirmDelete() {
			if (!this.selectedExamId) return;
			try {
				this.spinners.push('delete');
				await zauApi.delete(`/exam/${this.selectedExamId}`);
				this.toastSuccess('Exam deleted successfully');
				this.selectedExamId = null;
				await this.fetchExams();
			} catch (e) {
				console.error('error deleting exams', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
		async toggleActive(id) {
			try {
				const examId = this.exams.findIndex((e) => e._id === id);

				if (examId === -1) {
					throw new Error('Exam not found');
				}
				this.spinners.push('toggle');

				const exam = this.exams[examId];

				const { data } = await zauApi.patch(`/exam/${id}`, {
					title: exam.title,
					description: exam.description,
					questions: exam.questions,
					isActive: !exam.isActive,
					certCode: exam.certCode,
				});

				this.exams[examId] = data.exam;

				this.toastSuccess('Exam updated successfully!');
				this.spinners = this.spinners.filter((s) => s !== 'toggle');
			} catch (e) {
				console.error('error toggling exam', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'toggle');
			}
		},
		truncateExamName(title, maxLength = 20) {
			if (title && title.length > maxLength) {
				return { text: title.substring(0, maxLength) + '...', truncated: true };
			}
			return { text: title, truncated: false };
		},

		shouldShowTooltip(title, maxLength = 20) {
			return title && title.length > maxLength;
		},

		initializeTooltips() {
			this.$nextTick(() => {
				M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
					margin: 0,
				});
			});
		},
	},
	computed: {
		...mapState('user', ['user']),

		isExamEditor() {
			return this.user.data.roleCodes.some((rc) => this.examEditors.includes(rc));
		},
	},
};
</script>

<style scoped>
.exam-center .card {
	margin-top: 20px;
}

.table th,
.table td {
	vertical-align: middle;
}

.modal-footer .btn,
.modal-footer .btn-flat {
	cursor: pointer;
}

.btn {
	margin-left: 8px;
}

/* Initial button has no left margin for alignment */
.btn:first-child {
	margin-left: 0;
}

.no_exams {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.modal_assign {
	height: 75vh;
}
</style>
