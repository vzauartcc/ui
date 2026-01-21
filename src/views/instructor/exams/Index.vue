<template>
	<div class="card">
		<div class="loading_container" v-if="!exams"><Spinner /></div>
		<div class="row row_no_margin" v-else>
			<div class="card-content">
				<span class="card-title">Exam Center</span>

				<div class="row col s12">
					<ul class="tabs">
						<li class="tab col s6"><a href="#exams" class="active">Exams</a></li>
						<li class="tab col s6"><a href="#attempts">Attempts</a></li>
					</ul>
				</div>

				<div class="tabs_content">
					<div id="exams" class="">
						<div class="row col s12" v-if="exams">
							<router-link to="/ins/exams/new" class="btn">Create Exam</router-link>
						</div>

						<div v-if="exams && exams.length === 0" class="row col s12">
							<p class="no_exams">There are no exams to display</p>
						</div>

						<div v-else>
							<div class="">
								<table class="table">
									<thead>
										<tr>
											<th>Title</th>
											<th class="center-align">Created By</th>
											<th class="center-align">Milestone</th>
											<th class="center-align">
												Questions {{ isExamEditor ? '(Active / Total)' : '' }}
											</th>
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
															:disabled="!isExamEditor"
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

					<div id="attempts">
						<div class="row">
							<div class="col s4">
								<select
									class="materialize-select"
									name="exam"
									id="examId"
									v-model="attemptSelectedExam"
								>
									<option value="">All Exams</option>
									<option
										v-for="(exam, id) in availableExams"
										:key="`exam-${id}`"
										:value="exam._id"
									>
										{{ exam.title }}
									</option>
								</select>
								<label for="examId"></label>
							</div>
							<div class="col s4">
								<select
									class="materialize-select"
									name="student"
									id="studentId"
									v-model="attemptSelectedUser"
								>
									<option value="0">All Students</option>
									<option
										v-for="(user, id) in availableStudents"
										:key="`user-${id}`"
										:value="user.cid"
									>
										{{ user.fname }} {{ user.lname }}
									</option>
								</select>
								<label for="studentId"></label>
							</div>
							<div class="col s4">
								<select
									class="materialize-select"
									name="status"
									id="statusId"
									v-model="attemptSelectedStatus"
								>
									<option value="">All Attempts</option>
									<option value="pending">Not Started</option>
									<option value="in_progress">In Progress</option>
									<option value="completed">Completed</option>
								</select>
								<label for="statusId"></label>
							</div>
						</div>
						<div v-if="attempts.length === 0">
							<p class="no_exams">There are no attempts to display</p>
						</div>
						<div v-else>
							<table class="table">
								<thead>
									<tr>
										<th>Student</th>
										<th>Exam</th>
										<th>Attempt #</th>
										<th>Assigned Date</th>
										<th>Score</th>
										<th>Options</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="attempt in attempts" :key="attempt._id">
										<td>{{ attempt.user.fname }} {{ attempt.user.lname }}</td>
										<td>{{ attempt.exam.title }}</td>
										<td>{{ attempt.attemptNumber }}</td>
										<td>{{ dShort(new Date(attempt.createdAt)) }}</td>
										<td>
											<span v-if="attempt.status === 'completed'">{{ attempt.grade }}%</span>
											<span v-else-if="attempt.status === 'timed_out'">Expired</span>
											<span v-else-if="attempt.status === 'in_progress'">In Progress</span>
											<span v-else>Not Started</span>
										</td>
										<td>
											<router-link
												:to="'/ins/exams/attempt/' + attempt._id"
												v-if="attempt.isComplete"
											>
												<i class="material-icons">search</i>
											</router-link>
											<a
												href="#"
												v-if="!attempt.isComplete"
												@click.prevent="deleteAttempt(attempt._id)"
												data-tooltip="Delete Attempt"
												data-position="top"
												class="tooltipped"
												><i class="material-icons red-text">delete</i></a
											>
										</td>
									</tr>
								</tbody>
							</table>
							<div v-if="attempts.length > 0">
								<Pagination
									:amount="attemptAmount"
									:page="attemptPage"
									:limit="attemptLimit"
									:amountOfPages="attemptPages"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<teleport to="body">
			<div v-for="exam in exams" :key="`modal_${exam._id}`">
				<!-- Assign Modal -->
				<div :id="`modal_assign_${exam._id}`" class="modal modal_assign">
					<div class="modal-content">
						<div class="modal_title">
							Assign Exam: <strong>{{ exam.title }}</strong>
						</div>
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
							class="btn blue white-text waves-effect"
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
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	name: 'ExamCenter',
	title: 'Exam Center',
	data() {
		return {
			spinners: [],
			exams: null,
			controllers: [],
			attempts: [],
			controller: 0,
			selectedExamId: null,
			examEditors: ['atm', 'datm', 'ta', 'ia'],
			attemptPage: 1,
			attemptLimit: 20,
			attemptSelectedExam: '',
			attemptSelectedUser: 0,
			attemptSelectedStatus: '',
			availableExams: [],
			availableStudents: [],
			attemptAmount: 0,
			attemptPages: 0,
		};
	},
	components: {
		Pagination,
	},
	async created() {
		await this.fetchExams();
		await this.fetchControllers();
		await this.fetchAttempts();

		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});

		M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});

		M.Tabs.init(document.querySelectorAll('.tabs'), {
			onShow: this.handleTabShow,
		});
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
		async fetchAttempts() {
			try {
				const { data } = await zauApi.get('/exam/attempt', {
					params: {
						page: this.attemptPage,
						limit: this.limit,
						user: this.attemptSelectedUser,
						exam: this.attemptSelectedExam,
						status: this.attemptSelectedStatus,
					},
				});

				this.attempts = data.attempts;

				this.attemptAmount = data.amount;
				this.attemptPages = Math.ceil(this.attemptAmount / this.limit);

				const uniqueExams = new Map();
				const uniqueUsers = new Map();

				for (const attempt of data.attempts) {
					if (!uniqueExams.has(attempt.examId)) {
						uniqueExams.set(attempt.examId, attempt.exam);
					}

					if (!uniqueUsers.has(attempt.student)) {
						uniqueUsers.set(attempt.student, attempt.user);
					}
				}

				this.availableExams = Array.from(uniqueExams.values());
				this.availableStudents = Array.from(uniqueUsers.values());
			} catch (e) {
				console.error('error getting attempts', e);
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

				const modal = document.getElementById(`modal_assign_${id}`);
				if (modal) {
					M.Modal.getInstance(modal).close();
				}

				this.toastSuccess('Exam Assigned!');
				this.controller = 0;
			} catch (e) {
				console.error('error assigning exam', e);
				this.toastError(e.response.data.message || 'Something went wrong, please try again later');
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
		async deleteAttempt(id) {
			try {
				await zauApi.delete('/exam/attempt/' + id);

				await this.fetchAttempts();
			} catch (e) {
				console.error('error deleting attempt', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
	},
	computed: {
		...mapState('user', ['user']),

		isExamEditor() {
			return this.user.data.roleCodes.some((rc) => this.examEditors.includes(rc));
		},
	},
	watch: {
		page: async function () {
			await this.fetchAttempts();
		},
		attemptSelectedExam: async function () {
			this.attemptPage = 1;
			await this.fetchAttempts();
		},
		attemptSelectedUser: async function () {
			this.attemptPage = 1;
			await this.fetchAttempts();
		},
		attemptSelectedStatus: async function () {
			this.attemptPage = 1;
			await this.fetchAttempts();
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
	font-style: italic;
}

.modal_assign {
	height: 75vh;
}
</style>
