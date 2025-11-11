<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Event</span>
			<div class="loading_container" v-if="form === null">
				<Spinner />
			</div>
			<div class="row row_no_margin" v-else>
				<form enctype="multipart/form-data" @submit.prevent="submitForm">
					<div class="input-field col s12">
						<input id="name" type="text" v-model="form.name" required />
						<label for="name" class="active">Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="startDate" type="text" class="datepicker" ref="start_date" required />
						<label for="startDate" class="active">Start Time (Zulu)</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="endDate" type="text" class="datepicker" ref="end_date" required />
						<label for="endDate" class="active">End Time (Zulu)</label>
					</div>
					<div class="file-field input-field col s12">
						<div class="btn waves-effect waves-light">
							<span>FILE</span>
							<input type="file" ref="banner" @change="updateFilePath" />
						</div>
						<div class="file-path-wrapper">
							<input class="file-path" type="text" :value="filePath" readonly />
						</div>
					</div>
					<div class="input-field col s12">
						<textarea
							id="description"
							class="materialize-textarea"
							v-model="form.description"
						></textarea>
						<label for="description" class="active">Description</label>
					</div>
					<div class="input-field col s12">
						<div class="row row_no_margin">
							<div class="col s12 l6 push-l3">
								<div class="card card_positions z-depth-2">
									<p class="positions_title">Event Positions</p>
									<p class="no_pos" v-if="form.positions && form.positions.length === 0">
										No positions added yet
									</p>
									<ul v-else>
										<li v-for="position in form.positions" class="collection-item" :key="position">
											<div class="pos_header">
												{{ position }}
												<span class="delete_pos" @click="deletePos(position)">Delete</span>
											</div>
										</li>
									</ul>
									<form @submit.prevent="addPosition">
										<input
											type="text"
											class="positions_input"
											placeholder="CHI_35_CTR"
											name="pos"
											ref="pos"
											required
										/>
										<button class="positions_submit" type="submit" name="action">
											<i class="material-icons">add</i>
										</button>
									</form>
								</div>
							</div>
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
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { DateTime } from 'luxon';

export default {
	data() {
		return {
			spinners: [],
			form: null,
			selectedFile: null,
			upload: {
				progress: 0,
				text: 'Uploading',
				timeout: null,
			},
		};
	},
	async mounted() {
		await this.getEvent();
		this.setTitle(`Edit ${this.form.name}`);
		M.textareaAutoResize(document.getElementById('description'));
	},
	computed: {
		filePath() {
			return this.selectedFile ? this.selectedFile.name : this.form?.bannerUrl || '';
		},
		barStyle() {
			return {
				width: `${this.upload.progress}%`,
			};
		},
	},
	methods: {
		async getEvent() {
			try {
				const { data } = await zauApi.get(`/event/${this.$route.params.slug}`);
				this.form = data;
				if (this.form.positions && this.form.positions.length != 0) {
					this.form.positions = this.form.positions.map((p) => p.pos);
				} else {
					this.form.positions = [];
				}

				this.$nextTick(() => {
					// Okay, so working with timezones with JS is hard. This is really gross and I hate it, but it works so 🤷‍♀️
					const startTime = DateTime.fromISO(this.form.eventStart);
					const endTime = DateTime.fromISO(this.form.eventEnd);

					flatpickr(this.$refs.start_date, {
						enableTime: true,
						time_24hr: true,
						defaultDate: startTime.plus({ minutes: -startTime.offset }).toISO(),
						disableMobile: true,
						minuteIncrement: 15,
						dateFormat: 'Y-m-dTH:i:00.000\\Z',
						altFormat: 'Y-m-d H:i',
						altInput: true,
					});

					flatpickr(this.$refs.end_date, {
						enableTime: true,
						time_24hr: true,
						defaultDate: endTime.plus({ minutes: -endTime.offset }).toISO(),
						disableMobile: true,
						minuteIncrement: 15,
						dateFormat: 'Y-m-dTH:i:00.000\\Z',
						altFormat: 'Y-m-d H:i',
						altInput: true,
					});
				});
			} catch (e) {
				console.error('error getting event', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		updateFilePath(event) {
			if (event.target.files.length > 0) {
				this.selectedFile = event.target.files[0]; // ✅ Store new file
				this.form.bannerUrl = this.selectedFile.name; // ✅ Update input field
			}
		},
		async submitForm() {
			try {
				this.spinners.push('submit');
				const formData = new FormData();
				formData.append('name', this.form.name);
				formData.append('startTime', `${this.$refs.start_date.value}`);
				formData.append('endTime', `${this.$refs.end_date.value}`);
				formData.append('description', this.form.description);
				formData.append('positions', JSON.stringify(this.form.positions));

				const uploadId = Date.now();

				if (this.selectedFile) {
					formData.append('banner', this.selectedFile); // ✅ Use selected file
					formData.append('uploadId', uploadId);
				}

				this.uploadText = `${this.uploadText} .`;
				this.upload.timeout = setInterval(() => {
					if (this.upload.text.length > 15) {
						this.upload.text = this.upload.text.split(' ')[0];
					}

					this.upload.text = `${this.upload.text} .`;
				}, 750);

				const response = await zauApi.put(`/event/${this.$route.params.slug}`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
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
					console.error('error submitting event', e);
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
				this.toastSuccess('Event uploaded');

				setTimeout(() => {
					this.$router.back();
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
		async addPosition() {
			const newPos = this.$refs.pos.value.toUpperCase();

			if (!newPos) {
				this.toastError('Position cannot be empty');
				return;
			}

			if (this.form.positions.includes(newPos)) {
				this.toastError('Position already exists');
				return;
			}

			// ✅ Preserve selectedFile before updating form
			const tempFile = this.selectedFile;

			// ✅ Use Vue reactivity-friendly update
			this.form.positions.push(newPos);

			// ✅ Restore the selected file
			this.selectedFile = tempFile;

			// ✅ Clear input field
			this.$refs.pos.value = '';
		},
		async deletePos(position) {
			this.form.positions = this.form.positions.filter((pos) => pos !== position);
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
.card_positions {
	padding: 0;

	.positions_title {
		font-weight: 600;
		padding: 0.5em 1em;
	}

	form {
		padding: 0.5em 1em;
	}

	.positions_input {
		width: calc(100% - 40px);
		margin-right: 10px;
	}

	.positions_submit {
		border: none;
		background-color: transparent;
		color: $primary-color;
		text-align: right;
		cursor: pointer;
		width: 40px;
		float: right;
		margin-top: -30px;
	}

	.collection-item {
		border: 0;

		.material-icons {
			float: right;
		}
	}

	.pos_header {
		padding: 0.5em 1em;
	}

	.collection-item:nth-of-type(odd) {
		background-color: $gray-mild;
	}

	.no_pos {
		padding: 0.5em 1em;
		font-style: italic;
	}

	.delete_pos {
		color: #9e9e9e;
		font-size: 0.8rem;
		cursor: pointer;
		text-decoration: underline;
		margin-right: 0.5rem;
		float: right;
	}
}
</style>
