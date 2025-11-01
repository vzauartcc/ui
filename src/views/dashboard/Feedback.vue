<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Your Feedback</span>
		</div>
		<div class="loading_container" v-if="!feedback">
			<Spinner />
		</div>
		<p class="no_feedback" v-else-if="feedback && feedback.length === 0">
			You have not received any feedback yet
		</p>
		<div class="feedback_wrapper" v-else>
			<table class="feedback_list striped">
				<thead class="feedback_list_head">
					<tr>
						<th>Date</th>
						<th>Position</th>
						<th>Rating</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="feedback_list_row" v-if="feedback">
					<tr v-for="(feedback, i) in feedback" :key="feedback._id">
						<td>{{ dtLong(feedback.createdAt) }}</td>
						<td id="position">{{ feedback.position || '—' }}</td>
						<td>{{ convertRating(feedback.rating) }}</td>
						<td class="options">
							<a
								href="#"
								@click.prevent="openModal(i)"
								data-position="top"
								data-tooltip="View Details"
								class="tooltipped modal-trigger"
							>
								<i class="material-icons">search</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div v-if="feedback && feedbackAmount !== 0">
			<Pagination
				:amount="feedbackAmount"
				:page="page"
				:limit="limit"
				:amountOfPages="amountOfPages"
			/>
		</div>
		<teleport to="body">
			<div v-for="(feedback, i) in feedback" :key="`modal_feedback_${i}`">
				<div :id="`modal_feedback_${i}`" class="modal modal_feedback">
					<div class="modal-content">
						<div class="modal_title">Feedback Details</div>
						<p>{{ feedback.comments || '—' }}</p>
					</div>
					<div class="modal-footer">
						<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
</template>

<script>
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'UserFeedback',
	title: 'Your Feedback',
	data() {
		return {
			feedback: null,
			feedbackAmount: 0,
			page: 1,
			limit: 10,
			amountOfPages: 1,
		};
	},
	components: {
		Pagination,
	},
	async mounted() {
		this.getMyFeedback();
		await this.getMyFeedback();
		this.$nextTick(() => {
			this.initModals(); // Initialize modals properly
		});
	},
	methods: {
		async getMyFeedback() {
			try {
				const { data } = await zauApi.get(`/feedback/own`, {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});
				this.feedback = data.data.feedback;
				this.feedbackAmount = data.data.amount;
			} catch (e) {
				console.error('error getting my feedback', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		initModals() {
			this.$nextTick(() => {
				const modals = document.querySelectorAll('.modal');
				M.Modal.init(modals, { preventScrolling: false });
			});
		},
		openModal(i) {
			const modal = document.getElementById(`modal_feedback_${i}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		convertRating(rating) {
			const ratings = ['Poor', 'Below Average', 'Average', 'Above Average', 'Excellent'];
			return ratings[rating - 1];
		},
	},
	watch: {
		page: async function () {
			await this.getMyFeedback();
			M.Modal.init(document.querySelectorAll('.modal'), {
				preventScrolling: false,
			});
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
				margin: 0,
			});
		},
	},
};
</script>

<style scoped lang="scss">
.no_feedback {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.modal_title {
	font-size: 1.8em;
	margin-bottom: 0.5em;
}

.feedback_list {
	min-width: 400px;
}

.feedback_wrapper {
	width: 100%;
	overflow: auto;
}

#position {
	text-transform: capitalize;
}

.feedback {
	#comments {
		font-family: inherit;
		white-space: pre-wrap;
		overflow: hidden;
		width: 100%;
	}

	.row {
		.input-field p,
		.input-field div {
			margin: 0.33em 0 0 0;
			line-break: normal;
		}
	}
}

.feedback_content {
	margin-top: -3px;
	white-space: pre-wrap;
}
</style>
