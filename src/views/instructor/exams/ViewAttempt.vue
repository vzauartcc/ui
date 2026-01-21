<template>
	<div class="card">
		<div class="loading_container" v-if="!attempt"><Spinner /></div>
		<div class="row row_no_margin" v-else>
			<div class="card-content">
				<div class="col s12">
					<div class="card-title">
						{{ attempt.user.fname }} {{ attempt.user.lname }} - {{ attempt.exam.title }}
					</div>
					<div class="card col s12">
						<div class="card-content">
							<strong class="card-title green-text" v-if="attempt.passed === true">Passed</strong>
							<strong class="card-title red-text" v-else
								>Failed <span v-if="attempt.status === 'timed_out'">(Timed Out)</span></strong
							>
							<table class="table">
								<tbody>
									<tr>
										<td class="bdr">Student</td>
										<td class="bdr">{{ attempt.user.fname }} {{ attempt.user.lname }}</td>
									</tr>
									<tr>
										<td class="bdr">Exam</td>
										<td class="bdr">{{ attempt.exam.title }}</td>
									</tr>
									<tr>
										<td class="bdr">Total Score</td>
										<td class="bdr">
											{{ attempt.totalScore }} / {{ attempt.questionOrder.length }} pts
											<span v-if="attempt.status === 'timed_out'"> (Attempt timed out)</span>
										</td>
									</tr>
									<tr>
										<td class="bdr">Grade</td>
										<td class="bdr">
											{{ attempt.grade }}%
											<span v-if="attempt.status === 'timed_out'"> (Attempted timed out)</span>
										</td>
									</tr>
									<tr>
										<td class="bdr">Assigned Date</td>
										<td class="bdr">{{ dShort(new Date(attempt.createdAt)) }}</td>
									</tr>
									<tr>
										<td class="bdr">Start Time</td>
										<td class="bdr">
											{{ attempt.startTime ? dtShort(new Date(attempt.startTime)) : '' }}
										</td>
									</tr>
									<tr>
										<td class="bdr">Completed Time</td>
										<td class="bdr">
											{{ attempt.status === 'timed_out' ? '' : dtShort(new Date(attempt.endTime)) }}
										</td>
									</tr>
									<tr>
										<td class="bdr">Time Spent</td>
										<td class="bdr">{{ attemptHHMMSS(attempt.totalTime) }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div class="card-content">
					<a
						@click="scrollToSection(idx)"
						class="white-text dropdown-trigger col center chip"
						v-for="(response, idx) in attempt.responses"
						:key="idx"
						:class="{ green: response.isCorrect, red: !response.isCorrect }"
					>
						{{ idx + 1 }}
					</a>
				</div>
				<div class="card-content">
					<div class="card col s12 grey lighten-1">
						<div class="card-content">
							<div class="card-title">Answer Key</div>
							<div class="row green lighten-4">
								<i class="material-icons">check</i> Correct answer selected
							</div>
							<div class="row red lighten-4">
								<i class="material-icons">close</i> Correct answer <strong>not</strong> selected
							</div>
						</div>
					</div>
				</div>
				<div v-for="response in attempt.responses" :key="response.questionId" class="card-content">
					<div
						class="card col s12 response-item"
						:id="`response-${response.questionId}`"
						ref="responseItems"
					>
						<div class="card-content">
							<div class="card-title">{{ questionsById[response.questionId].text }}</div>
							<template
								v-for="option in questionsById[response.questionId].options"
								:key="option._id"
							>
								<div
									class="row lighten-4"
									:class="{
										green: option.isCorrect && response.selectedOptions.includes(option._id),
										red: option.isCorrect && !response.selectedOptions.includes(option._id),
									}"
								>
									<div class="col s1">
										<i
											class="material-icons"
											v-if="option.isCorrect && response.selectedOptions.includes(option._id)"
											>check</i
										>
										<i
											class="material-icons"
											v-if="option.isCorrect && !response.selectedOptions.includes(option._id)"
											>close</i
										>
									</div>
									<div class="col">
										{{ option.text }}
									</div>
								</div>
							</template>
							<p>
								<i class="material-icons green-text" v-if="response.isCorrect">check_circle</i
								><i class="material-icons red-text" v-else>cancel</i>
								{{ response.isCorrect ? '1' : '0' }}/1 points
							</p>
							<p>
								<i class="material-icons">access_time</i> {{ attemptHHMMSS(response.timeSpent) }}
							</p>
							<br />
							<div class="card card-content">
								<p>
									Correct answer(s):
									{{
										questionsById[response.questionId].options
											.filter((o) => o.isCorrect)
											.map((o) => o.text)
											.join(', ')
									}}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '../../../helpers/axios';

export default {
	data() {
		return {
			attempt: null,
		};
	},
	async mounted() {
		await this.fetchAttempt();
	},
	methods: {
		async fetchAttempt() {
			try {
				const { data } = await zauApi.get(`/exam/attempt/review/${this.$route.params.attemptId}`);

				this.attempt = data;
			} catch (e) {
				console.error('error getting attempt', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		scrollToSection(index) {
			const element = this.$refs.responseItems[index];
			if (element) {
				const topPos = element.getBoundingClientRect().top;

				const totalScroll = topPos + window.pageYOffset;

				window.scrollTo({
					top: totalScroll,
					behavior: 'smooth',
				});
			}
		},
		attemptHHMMSS(inMs) {
			if (!inMs) return null;
			const time = inMs / 1000;
			const hours = Math.floor(time / 3600);
			const minutes = `0${Math.round((time / 60) % 60)}`.slice(-2);
			const seconds = `0${Math.round(time % 60)}`.slice(-2);

			let retval = '';
			if (hours > 0) {
				retval += `${hours}h `;
			}
			return `${retval}${minutes}m ${seconds}s`;
		},
	},
	computed: {
		questionsById() {
			const map = {};
			this.attempt.questionOrder.forEach((question) => {
				map[question._id] = question;
			});
			return map;
		},
	},
};
</script>

<style scoped lang="scss">
.table th,
.table td {
	vertical-align: middle;
}

.row.bdr {
	border-top: 1px solid #ccc;
	border-bottom: 1px solid #ccc;
}

.col.bdr {
	border-left: 1px solid #ccc;
	border-right: 1px solid #ccc;
}
</style>
