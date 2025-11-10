<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">New Event</span>
			<div class="row row_no_margin">
				<form method="post" enctype="multipart/form-data" @submit.prevent="submitForm">
					<div class="input-field col s12">
						<input id="name" type="text" v-model="form.name" required />
						<label for="name">Name</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="start_date" type="text" class="datepicker" ref="start_date" required />
						<label for="start_date">Start Time (Zulu)</label>
					</div>
					<div class="input-field col s12 m6">
						<input id="end_date" type="text" class="datepicker" ref="end_date" required />
						<label for="end_date">End Time (Zulu)</label>
					</div>
					<div class="file-field input-field col s12">
						<div class="btn waves-effect waves-light">
							<span>FILE</span>
							<input type="file" ref="banner" required />
						</div>
						<div class="file-path-wrapper">
							<input
								class="file-path validate"
								type="text"
								placeholder="Banner (.jpg .png or .gif, less than 30 MB)"
							/>
						</div>
					</div>
					<div class="input-field col s12">
						<textarea
							id="description"
							class="materialize-textarea"
							v-model="form.description"
						></textarea>
						<label for="description">Description</label>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Submit
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
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

export default {
	name: 'NewEvent',
	title: 'New Event',
	data() {
		return {
			spinners: [],
			form: {
				name: '',
				eventStart: {
					date: '',
					time: '',
				},
				eventEnd: {
					date: '',
					time: '',
				},
				description: '',
				positions: [],
			},
			upload: {
				progress: 0,
				text: 'Uploading',
				timeout: null,
			},
		};
	},
	async mounted() {
		const today = new Date(new Date().toUTCString());
		flatpickr(this.$refs.start_date, {
			enableTime: true,
			time_24hr: true,
			minDate: today,
			disableMobile: true,
			minuteIncrement: 15,
			dateFormat: 'Y-m-dTH:i:00.000\\Z',
			altFormat: 'Y-m-d H:i',
			altInput: true,
		});

		flatpickr(this.$refs.end_date, {
			enableTime: true,
			time_24hr: true,
			minDate: today,
			disableMobile: true,
			minuteIncrement: 15,
			dateFormat: 'Y-m-dTH:i:00.000\\Z',
			altFormat: 'Y-m-d H:i',
			altInput: true,
		});
	},
	methods: {
		deletePos(pos) {
			const i = this.form.positions.findIndex((obj) => obj.pos === pos);
			this.form.positions = [
				...this.form.positions.slice(0, i),
				...this.form.positions.slice(i + 1),
			];
		},
		async submitForm() {
			const formData = new FormData();
			formData.append('banner', this.$refs.banner.files[0]);
			formData.append('name', this.form.name);
			formData.append('startTime', `${this.$refs.start_date.value}`);
			formData.append('endTime', `${this.$refs.end_date.value}`);
			formData.append('description', this.form.description);

			try {
				this.spinners.push('submit');

				this.uploadText = `${this.uploadText} .`;
				this.upload.timeout = setInterval(() => {
					if (this.upload.text.length > 15) {
						this.upload.text = this.upload.text.split(' ')[0];
					}

					this.upload.text = `${this.upload.text} .`;
				}, 750);

				await zauApi.post('/event', formData, {
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

				this.toastSuccess('Event created');
				this.$router.push('/admin/events');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error creating event', e);
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
		centerPos() {
			return this.form.positions.filter((pos) => pos.type === 'CTR');
		},
		traconPos() {
			return this.form.positions.filter((pos) => pos.type === 'APP');
		},
		localPos() {
			return this.form.positions.filter(
				(pos) => pos.type === 'TWR' || pos.type === 'GND' || pos.type === 'DEL',
			);
		},
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

<style scoped lang="scss">
.card_positions {
	padding: 0;

	.positions_title {
		font-weight: 600;
		padding: 1em;
	}

	form {
		padding: 1em;
	}

	.positions_input {
		width: calc(100% - 2em);
		margin-right: 1em;
	}

	.positions_submit {
		border: none;
		background-color: transparent;
		color: $primary-color;
		text-align: right;
		cursor: pointer;
		width: 2em;
		float: right;
		margin-top: -30px;
	}

	.collection-item {
		border: 0;
		padding-left: 0.5em;

		.material-icons {
			float: right;
		}
	}

	.pos_header {
		padding: 0.5em;
	}

	.collection-item:nth-of-type(odd) {
		background-color: $gray-mild;
	}

	.no_pos {
		margin-left: 1em;
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
