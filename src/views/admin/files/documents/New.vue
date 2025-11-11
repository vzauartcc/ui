<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">New Document</span>
			<div class="row row_no_margin">
				<form method="post" @submit.prevent="addDocument">
					<div class="input-field col s12 m6">
						<input id="name" type="text" v-model="form.name" required />
						<label for="name">Name</label>
					</div>
					<div class="input-field col s12 m6">
						<select id="category" v-model="form.category" class="materialize-select">
							<option value="" disabled selected>Choose a category</option>
							<option value="sop">SOP</option>
							<option value="loa">LOA</option>
							<option value="policy">Policies</option>
							<option value="misc">Miscellaneous</option>
							<option value="training">Training</option>
						</select>
						<label>Category</label>
					</div>
					<div class="input-field col s12">
						<textarea
							id="description"
							class="materialize-textarea"
							data-length="400"
							v-model="form.description"
						></textarea>
						<label for="description">Description (optional)</label>
					</div>
					<div class="col s12 radio_select">
						<span class="title">Type</span>
						<p>
							<label>
								<input type="radio" value="file" v-model="form.type" />
								<span>File</span>
							</label>
							<label>
								<input type="radio" value="doc" v-model="form.type" />
								<span>Document</span>
							</label>
						</p>
					</div>
					<div class="col s12" v-show="form.type === 'doc'">
						<span class="title">Content</span>
						<div id="tui_editor"></div>
					</div>
					<div class="file-field input-field col s12" v-if="form.type === 'file'">
						<div class="btn waves-effect waves-light">
							<span>FILE</span>
							<input type="file" ref="download" id="fileInput" required />
						</div>
						<div class="file-path-wrapper">
							<input class="file-path validate" type="text" placeholder="Upload a file" />
						</div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'add')"> <SmallSpinner /> </span>Create
						</button>
					</div>
					<div class="col s12" v-if="!upload.text.endsWith('ing')">
						<div style="text-align: center">{{ upload.text }}</div>
						<div class="progress" role="progressbar">
							<div class="determinate" :style="barStyle"></div>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import Editor from '@toast-ui/editor';
import tableMergedCell from '@toast-ui/editor-plugin-table-merged-cell'; // Merging cells for SOPs
import '@toast-ui/editor/dist/toastui-editor.css'; // Editor's Style
import { mapState } from 'vuex';

export default {
	name: 'NewDoc',
	title: 'New Document',
	data() {
		return {
			spinners: [],
			form: {
				name: '',
				category: '',
				description: '',
				content: '',
				type: '',
			},
			editor: null,
			upload: {
				progress: 0,
				text: 'Uploading',
				timeout: null,
				poll: null,
			},
		};
	},
	async mounted() {
		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.CharacterCounter.init(document.querySelectorAll('textarea'), {});

		this.$nextTick(() => {
			this.editor = new Editor({
				el: document.querySelector('#tui_editor'),
				height: '500px',
				initialEditType: 'markdown',
				previewStyle: 'tab',
				usageStatistics: false,
				plugins: [tableMergedCell],
			});
		});
	},
	methods: {
		async addDocument() {
			if (this.form.type === 'doc') {
				this.form.content = this.editor.getMarkdown();

				try {
					this.spinners.push('add');
					await zauApi.post('/file/documents', this.form);

					this.toastSuccess('Document created');

					this.$router.push('/admin/files/documents');
				} catch (e) {
					if (e.response) {
						this.toastError(
							e.response.data.message || 'Something went wrong, please try again later',
						);
					} else {
						console.error('error creating document', e);
						this.toastError('Something went wrong, please try again later');
					}
				} finally {
					this.spinners = this.spinners.filter((s) => s !== 'add');
				}
			} else {
				this.toastInfo('Uploading...');
				const formData = new FormData();
				formData.append('name', this.form.name);
				formData.append('category', this.form.category);
				formData.append('description', this.form.description);
				formData.append('download', this.$refs.download.files[0]);
				formData.append('author', this.user.data._id);
				formData.append('type', this.form.type);

				try {
					const uploadId = Date.now();
					formData.append('uploadId', uploadId);

					this.spinners.push('add');

					this.uploadText = `${this.uploadText} .`;
					this.upload.timeout = setInterval(() => {
						if (this.upload.text.length > 15) {
							this.upload.text = this.upload.text.split(' ')[0];
						}

						this.upload.text = `${this.upload.text} .`;
					}, 750);

					const response = await zauApi.post(`/file/documents`, formData, {
						onUploadProgress: (progressEvent) => {
							console.log(progressEvent);
							const percent = (progressEvent.loaded / progressEvent.total) * 100;
							this.uploadProgress = (percent / 2).toFixed(0);
						},
					});

					if (response.status === 202) {
						this.pollS3(uploadId);
					} else if (response.status === 201) {
						this.stopUploadUi(true);
					}
				} catch (e) {
					if (e.response) {
						this.toastError(
							e.response.data.message || 'Something went wrong, please try again later',
						);
					} else {
						console.error('error uploading file', e);
						this.toastError('Something went wrong, please try again later');
					}

					this.stopUploadUi(false);
				} finally {
					this.spinners = this.spinners.filter((s) => s !== 'add');
				}
			}
		},
		stopUploadUi(success) {
			if (this.upload.timeout) {
				clearInterval(this.upload.timeout);
				this.upload.timeout = null;
			}
			this.upload.progress = 0;
			this.upload.text = 'Uploading';

			if (this.upload.poll) {
				clearInterval(this.upload.poll);
				this.upload.poll = null;
			}

			if (success === true) {
				this.toastSuccess('File uploaded');

				setTimeout(() => {
					document.getElementById('fileInput').value = '';
					this.$router.push('/admin/files/documents');
				}, 500);
			}
		},
		pollS3(id) {
			console.info('switching to s3 polling');
			const start = Date.now();
			this.upload.poll = setInterval(async () => {
				if (Date.now() - start < 120_000) {
					try {
						const response = await zauApi.get('/file/checkStatus/' + id);
						const { progress } = response.data;
						if (progress >= 100) {
							this.stopUploadUi(true);
						} else if (progress < 0) {
							this.stopUploadUi(false);
						} else {
							this.upload.progress = 50 + progress / 2;
						}
					} catch (e) {
						console.error('error polling s3 upload status', e);
					}
				} else {
					this.stopUploadUi(false);
				}
			}, 1000);
		},
	},
	computed: {
		...mapState('user', ['user']),
		barStyle() {
			return {
				width: `${this.upload.progress}%`,
			};
		},
	},
	unmounted() {
		if (this.upload.timeout) {
			clearInterval(this.upload.timeout);
		}
		if (this.upload.poll) {
			clearInterval(this.upload.poll);
		}
	},
};
</script>

<style scoped lang="scss">
.title {
	color: #9e9e9e;
	font-size: 0.75rem;
}

p label {
	margin-right: 1.5em;
}

.radio_select {
	margin-bottom: 1em;
}

#tui_editor {
	&:deep(.tui-editor-contents) {
		font-family: 'Lato', 'Helvetica', sans-serif;
		font-size: 1rem;
	}

	&:deep(code) {
		background-color: $gray_light;
		padding: 0.125em;
		color: $secondary-color-dark;
	}

	&:deep(h1) {
		border-bottom: 2px solid #ebebeb;
	}

	&:deep(h2) {
		counter-reset: h3;
		font-size: 2em;
		border-bottom: none;
		font-weight: 400;
		color: #000;
		margin-bottom: 0.25em;

		&:first-of-type {
			margin-top: 0;
		}

		&::before {
			counter-increment: h2;
			content: counter(h2) '. ';
		}
	}

	&:deep(h3) {
		counter-reset: h4;
		margin-bottom: 10px;
		font-size: 1.75em;
		font-weight: 400;
		color: #000;

		&::before {
			counter-increment: h3;
			content: counter(h2) '.' counter(h3) '. ';
		}
	}

	&:deep(h4) {
		counter-reset: h5;
		margin-bottom: 10px;
		font-size: 1.5em;
		font-weight: 400;
		line-height: 110%;
		margin: 1.52rem 0 0.912rem 0;
		color: #000;

		&::before {
			counter-increment: h4;
			content: counter(h2) '.' counter(h3) '.' counter(h4) '. ';
		}
	}

	&:deep(h5) {
		margin-bottom: 10px;
		border-bottom: none;
		font-style: normal;
		font-size: 1.25em;
		color: #000;
		font-weight: 400;

		&::before {
			counter-increment: h5;
			content: counter(h2) '.' counter(h3) '.' counter(h4) '.' counter(h5) '. ';
		}
	}

	&:deep(p) {
		color: #000;
		& + p {
			margin-top: 1.5em;
		}
	}

	&:deep(ul) {
		color: #000;

		li {
			list-style: disc outside;
			margin-left: 2em;

			&::before {
				background-color: #000;
				content: normal;
			}
		}
	}

	&:deep(ol) {
		color: #000;

		li {
			&::before {
				color: #000;
			}
		}
	}

	&:deep(a) {
		text-decoration: underline;
	}

	&:deep(table) {
		width: calc(100% + 30px);
		margin-left: -15px;
		display: table;
		border-collapse: collapse;
		border: none;
		border-spacing: 0;
		color: #000;
	}

	&:deep(thead) {
		border-bottom: 1px solid #666;
	}

	&:deep(tbody) {
		display: table-row-group;
		vertical-align: middle;
		border-color: inherit;
	}

	&:deep(tr) {
		border-bottom: none;
	}

	&:deep(tr:nth-child(odd)) {
		background-color: rgba(242, 242, 242, 0.5);
	}

	&:deep(td) {
		padding: 0.25em 1em !important;
		border: none;
	}

	&:deep(th) {
		background-color: #fff;
		color: #000;
		border: none;
		font-weight: 700;
	}
}
</style>
