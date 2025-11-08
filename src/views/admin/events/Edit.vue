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

				if (this.selectedFile) {
					formData.append('banner', this.selectedFile); // ✅ Use selected file
				}

				await zauApi.put(`/event/${this.$route.params.slug}`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				this.toastSuccess('Event updated');
				this.$router.back();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error submitting event', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
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
