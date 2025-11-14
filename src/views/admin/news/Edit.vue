<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Article</span>
			<div class="loading_container" v-if="!news">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<form method="post" @submit.prevent="updateNews">
					<div class="input-field col s12">
						<input id="title" type="text" v-model="news.title" required />
						<label for="title">Title</label>
					</div>
					<div class="input-field col s12">
						<span class="title">Content</span>
						<div id="tui_editor"></div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'update')"> <SmallSpinner /> </span>Update
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css'; // Editor's Style

export default {
	name: 'EditNews',
	data() {
		return {
			spinners: [],
			news: null,
		};
	},
	async mounted() {
		await this.getArticle();
		this.setTitle(`Edit ${this.news.title}`);
		this.$nextTick(() => {
			M.FormSelect.init(document.querySelectorAll('select'), {});
			M.CharacterCounter.init(document.querySelectorAll('textarea'), {});
			M.updateTextFields();
			this.editor = new Editor({
				el: document.querySelector('#tui_editor'),
				height: '500px',
				initialEditType: 'wysiwyg',
				previewStyle: 'tab',
				usageStatistics: false,
				initialValue: this.news.content,
			});
		});
	},
	methods: {
		async getArticle() {
			try {
				const { data } = await zauApi.get(`/news/${this.$route.params.slug}`);
				this.news = data;
			} catch (e) {
				console.error('error getting article', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async updateNews() {
			try {
				this.spinners.push('update');
				this.news.content = this.editor.getMarkdown();
				await zauApi.patch(`/news/${this.$route.params.slug}`, this.news);

				this.toastSuccess('News article updated');

				this.$router.push('/admin/news');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error updating news', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'update');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.title {
	color: #9e9e9e;
	font-size: 0.75rem;
}
</style>
