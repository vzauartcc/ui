<template>
	<div class="card home_intro">
		<div class="card-content">
			<div class="row">
				<div class="col s10">
					<span class="card-title">Exam Center</span>
				</div>
			</div>

			<div v-if="!attempts" class="center-align">
				<Spinner />
			</div>

			<!-- Show no exams message if exams array is empty -->
			<div v-if="attempts && attempts.length === 0" class="left-align">
				<p class="no_exams">There are no attempts to display</p>
			</div>

			<!-- Show table if exams array is not empty -->
			<div v-else>
				<div class="card-body">
					<table class="table">
						<thead>
							<tr>
								<th>Title</th>
								<th>Milestone</th>
								<th>Questions (Remaining)</th>
								<th>Status</th>
								<th>
									{{ attempts.filter((a) => a.isComplete).length > 0 ? 'Take Exam' : '' }}
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="attempt in attempts"
								:key="attempt._id"
								class="lighten-3"
								:class="{
									green: attempt.passed === true,
									red: attempt.passed === false,
								}"
							>
								<td
									:class="{ tooltipped: shouldShowTooltip(attempt.exam.title) }"
									:data-tooltip="shouldShowTooltip(attempt.exam.title) ? attempt.exam.title : ''"
								>
									{{ truncateExamName(attempt.exam.title, 20).text }}
								</td>
								<td>{{ attempt.exam.certification.name }}</td>
								<td>
									{{ attempt.questionOrder.length }} ({{
										attempt.questionOrder.length -
										attempt.responses.filter((r) => r.selectedOptions?.length !== 0).length
									}})
								</td>
								<td>{{ getExamStatus(attempt) }}</td>
								<td>
									<router-link
										:to="'/dash/training/exams/' + attempt._id"
										class="tooltipped"
										data-position="top"
										data-tooltip="Take Exam"
										v-if="!attempt.isComplete"
									>
										<i class="material-icons">login</i>
									</router-link>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
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
			attempts: [],
			examEditors: ['atm', 'datm', 'ta', 'ia'],
		};
	},
	async created() {
		await this.fetchExams();

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
				const { data } = await zauApi.get(`/exam/attempt/by-user/${this.user.data.cid}`);
				const complete = data.filter((a) => a.status === 'completed');
				const timedout = data.filter((a) => a.status === 'timed_out');
				const working = data.filter((a) => a.status === 'in_progress');
				const backlog = data.filter((a) => a.status === 'not_started');
				this.attempts = [
					...[...working, ...backlog].sort(
						(a, b) => new Date(a.createdAt).getTime() + new Date(b.createdAt).getTime(),
					),
					...complete.sort(
						(a, b) => new Date(a.updatedAt).getTime() + new Date(b.updatedAt).getTime(),
					),
					...timedout.sort(
						(a, b) => new Date(a.updatedAt).getTime() + new Date(b.updatedAt).getTime(),
					),
				];
			} catch (e) {
				console.error('error getting attempts', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		truncateExamName(title, maxLength = 20) {
			if (title && title.length > maxLength) {
				return { text: title.substring(0, maxLength) + '...', truncated: true };
			}
			return { text: title, truncated: false };
		},

		getExamStatus(attempt) {
			const today = new Date();
			const assignedDate = new Date(attempt.createdAt);
			const expiresDate = new Date(attempt.createdAt);
			expiresDate.setDate(assignedDate.getDate() + 31);
			switch (attempt.status) {
				case 'in_progress':
					return `In Progress (${Math.floor((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days remaining)`;
				case 'completed':
					return `Completed (${attempt.grade}%)`;
				case 'timed_out':
					return `Expired`;
				default:
					return `Pending (${Math.floor((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days remaining)`;
			}
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
