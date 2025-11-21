<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Create News Article</span>
			<div class="row">
				<form method="post" @submit.prevent="createNews">
					<div class="input-field col s12">
						<input id="title" type="text" v-model="form.title" required />
						<label for="title">Title</label>
					</div>
					<div class="input-field col s12">
						<span class="title">Content</span>
						<div id="tui_editor"></div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'create')"> <SmallSpinner /> </span>Create
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
import { mapState } from 'vuex';

export default {
	name: 'NewNews',
	title: 'Create News Article',
	data() {
		return {
			spinners: [],
			form: {
				title: '',
				content: '',
			},
		};
	},
	computed: {
		...mapState('user', ['user']),
	},
	async mounted() {
		this.$nextTick(() => {
			this.editor = new Editor({
				el: document.querySelector('#tui_editor'),
				height: '500px',
				initialEditType: 'wysiwyg',
				previewStyle: 'tab',
				usageStatistics: false,
				toolbarItems: [
					// Each array defines where a divider would be placed
					['heading', 'bold', 'italic'],
					[
						//   'strike',
						// 'divider',
						'hr',
						'quote',
						// 'divider',
						'ul',
						'ol',
					],
					[
						//   'task',
						'indent',
						'outdent',
						// 'divider',
						'table',
						// 'image',
						'link',
					],
					[
						// 'divider',
						'code',
						'codeblock',
					],
				],
			});
		});
	},
	methods: {
		async createNews() {
			try {
				this.spinners.push('create');
				await zauApi.post('/news', {
					title: this.form.title,
					content: this.editor.getMarkdown(),
					createdBy: this.user.data.cid,
				});

				this.toastSuccess('News article created');

				this.$router.push('/admin/news');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error creating news', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'create');
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
