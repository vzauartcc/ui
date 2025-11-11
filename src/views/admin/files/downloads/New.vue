<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">New Download</span>
			<div class="row row_no_margin">
				<form method="post" enctype="multipart/form-data" @submit.prevent="submitForm">
					<div class="input-field col s12 l6">
						<input id="name" type="text" v-model="form.name" required />
						<label for="name">Name</label>
					</div>
					<div class="input-field col s12 l6">
						<select id="category" v-model="form.category" class="materialize-select">
							<option value="" disabled selected>Choose a category</option>
							<option value="sectorFiles">Facility Files</option>
							<option value="training">References</option>
							<option value="misc">Miscellaneous</option>
							<option value="ins">Instructors</option>
							<option value="insguides">Instructors Guides</option>
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
					<div class="file-field input-field col s12">
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
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Create
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
import { mapState } from 'vuex';

export default {
	name: 'NewDownload',
	title: 'New Download',
	data() {
		return {
			spinners: [],
			form: {
				name: '',
				category: '',
				description: '',
			},
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
	},
	methods: {
		async submitForm() {
			try {
				const uploadId = Date.now();
				this.spinners.push('submit');
				this.toastInfo('Uploading...');
				const formData = new FormData();
				formData.append('name', this.form.name);
				formData.append('category', this.form.category);
				formData.append('description', this.form.description);
				formData.append('download', this.$refs.download.files[0]);
				formData.append('author', this.user.data._id);
				formData.append('uploadId', uploadId);

				this.uploadText = `${this.uploadText} .`;
				this.upload.timeout = setInterval(() => {
					if (this.upload.text.length > 15) {
						this.upload.text = this.upload.text.split(' ')[0];
					}

					this.upload.text = `${this.upload.text} .`;
				}, 750);

				const response = await zauApi.post(`/file/downloads`, formData, {
					onUploadProgress: (progressEvent) => {
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
					console.error('error creating download', e);
					this.toastError('Something went wrong, please try again later');
				}

				this.stopUploadUi(false);
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
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
				this.toastSuccess('Download created');

				setTimeout(() => {
					document.getElementById('fileInput').value = '';
					this.$router.push('/admin/files/downloads');
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
