<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Download</span>
			<div class="loading_container" v-if="loading === true">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<form method="post" enctype="multipart/form-data" @submit.prevent="submitForm">
					<div class="input-field col s12 l6">
						<input id="name" type="text" v-model="form.name" required />
						<label for="name" class="active">Name</label>
					</div>
					<div class="input-field col s12 l6">
						<select id="category" v-model="form.category" class="materialize-select">
							<option value="" disabled selected>Choose a category</option>
							<option value="sectorFiles">Facility Files</option>
							<option value="training">References</option>
							<option value="mfr">SOPs and LOAs</option>
							<option value="misc">Miscellaneous</option>
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
						<label for="description" class="active">Description (optional)</label>
					</div>
					<div class="file-field input-field col s12">
						<div class="btn">
							<span>FILE</span>
							<input type="file" ref="download" />
						</div>
						<div class="file-path-wrapper">
							<input class="file-path validate" type="text" v-model="form.fileName" />
						</div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Update
						</button>
					</div>
					<div class="col s12" v-if="!upload.text.endsWith('ing')">
						<div style="text-align: center">{{ upload.text }}</div>
						<div class="progress" role="progressbar">
							<div class="determinate" :style="barStyle" id="progress_bar"></div>
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
	name: 'EditDownload',
	data() {
		return {
			spinners: [],
			form: {
				name: '',
				category: '',
				description: '',
				fileName: '',
			},
			loading: true,
			upload: {
				progress: 0,
				text: 'Uploading',
				timeout: null,
			},
		};
	},
	async mounted() {
		await this.getDownload();
		this.setTitle(`Edit ${this.form.name}`);
		M.FormSelect.init(document.querySelectorAll('select'), {});
		M.CharacterCounter.init(document.querySelectorAll('textarea'), {});
		M.textareaAutoResize(document.querySelector('textarea'));
	},
	methods: {
		async getDownload() {
			try {
				this.loading = true;
				const { data } = await zauApi.get(`/file/downloads/${this.$route.params.id}`);
				this.form = data;
				this.loading = false;
			} catch (e) {
				console.error('error getting download', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async submitForm() {
			try {
				this.spinners.push('submit');
				const formData = new FormData();
				formData.append('name', this.form.name);
				formData.append('category', this.form.category);
				formData.append('description', this.form.description);
				formData.append('download', this.$refs.download.files[0]);

				this.uploadText = `${this.uploadText} .`;
				this.upload.timeout = setInterval(() => {
					if (this.upload.text.length > 15) {
						this.upload.text = this.upload.text.split(' ')[0];
					}

					this.upload.text = `${this.upload.text} .`;
				}, 750);

				await zauApi.put(`/file/downloads/${this.$route.params.id}`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					onUploadProgress: (progressEvent) => {
						const percent = (progressEvent.loaded / progressEvent.total) * 100;
						this.uploadProgress = percent.toFixed(0);
						if (percent > 99) {
							// Switch to infinite progress bar
							document
								.getElementById('progress_bar')
								.classList.replace('determinate', 'indeterminate');
							this.upload.text = 'Saving .';
						}
					},
				});

				this.uploadProgress = 0;
				this.uploadText = 'Uploading';

				this.toastSuccess('Download updated');
				this.$router.go(-1); // go back to the previous page
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error updating download', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');

				if (this.upload.timeout) {
					clearInterval(this.upload.timeout);
					this.upload.timeout = null;
				}
				this.upload.progress = 0;
				this.upload.text = 'Uploading';
			}
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
	},
};
</script>
