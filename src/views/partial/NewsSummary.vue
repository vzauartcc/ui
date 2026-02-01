<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Recent News</span>
			<div v-if="!newsItems" class="loading_container">
				<Spinner />
			</div>
			<div v-else-if="newsItems && newsItems.length === 0" class="no_news">
				No news articles have been posted recently
			</div>
		</div>
		<div class="table_overflow_wrapper" v-if="newsItems && newsItems.length > 0">
			<table class="striped">
				<thead>
					<tr>
						<th>Title</th>
						<th class="options">Date</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="news in newsItems" :key="news.id">
						<td>
							<router-link :to="`/news/${news.uriSlug}`">{{ news.title }}</router-link>
						</td>
						<td class="options">{{ dLong(news.createdAt) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	data() {
		return {
			newsItems: null,
			page: 1,
			limit: 3,
		};
	},
	async mounted() {
		await this.getNews();
	},
	methods: {
		async getNews() {
			try {
				const { data } = await zauApi.get('/news', {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});

				this.newsItems = data.news.slice(0, 3);
				this.newsAmount = data.amount;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting news', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.no_news {
	font-style: italic;
}

tbody {
	tr {
		td {
			transition: 0.3s ease;
		}

		&:hover {
			td {
				background: #eaeaea;
			}
		}

		a {
			font-weight: 600;
		}
	}
}
</style>
