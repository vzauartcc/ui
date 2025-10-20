<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Controller Activity Report</span>
			<div
				class="card-title2"
				style="display: flex; align-items: center; justify-content: space-between"
			>
				<div>
					<p>
						Showing controller activity in
						<strong>Q{{ currentQuarter }}, {{ chkDate2.getFullYear() }}</strong>
					</p>
				</div>
				<div>
					<a class="waves-effect waves-light btn" v-on:click="previousQuarter()">Previous</a>
					<a class="waves-effect waves-light btn" v-on:click="nextQuarter()">Next</a>
				</div>
			</div>
		</div>
		<div class="table_wrapper">
			<table class="medium striped" v-if="report">
				<thead>
					<tr>
						<th>Active?</th>
						<th @click="sort('fname')">
							Controller
							<div class="right">
								<i class="material-icons" v-if="sortBy !== 'fname'">unfold_more</i>
								<i class="material-icons active" v-else-if="sortBy === 'fname' && descending"
									>arrow_drop_down</i
								>
								<i class="material-icons active" v-else-if="sortBy === 'fname' && !descending"
									>arrow_drop_up</i
								>
							</div>
						</th>
						<th @click="sort('rating')">
							Rating
							<div class="right">
								<i class="material-icons" v-if="sortBy !== 'rating'">unfold_more</i>
								<i class="material-icons active" v-else-if="sortBy === 'rating' && descending"
									>arrow_drop_down</i
								>
								<i class="material-icons active" v-else-if="sortBy === 'rating' && !descending"
									>arrow_drop_up</i
								>
							</div>
						</th>
						<th @click="sort('totalTime')">
							Time
							<div class="right">
								<i class="material-icons" v-if="sortBy !== 'totalTime'">unfold_more</i>
								<i class="material-icons active" v-else-if="sortBy === 'totalTime' && descending"
									>arrow_drop_down</i
								>
								<i class="material-icons active" v-else-if="sortBy === 'totalTime' && !descending"
									>arrow_drop_up</i
								>
							</div>
						</th>
						<th @click="sort('obsTime')">
							OBS Time
							<div class="right">
								<i class="material-icons" v-if="sortBy !== 'obsTime'">unfold_more</i>
								<i class="material-icons active" v-else-if="sortBy === 'obsTime' && descending"
									>arrow_drop_down</i
								>
								<i class="material-icons active" v-else-if="sortBy === 'obsTime' && !descending"
									>arrow_drop_up</i
								>
							</div>
						</th>
						<th @click="sort('joinDate')">
							Join Date
							<div class="right">
								<i class="material-icons" v-if="sortBy !== 'joinDate'">unfold_more</i>
								<i class="material-icons active" v-else-if="sortBy === 'joinDate' && descending"
									>arrow_drop_down</i
								>
								<i class="material-icons active" v-else-if="sortBy === 'joinDate' && !descending"
									>arrow_drop_up</i
								>
							</div>
						</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="controller of sortedArray"
						:class="[controller.tooLow ? 'too_low' : '', controller.protected ? 'protected' : '']"
						:key="controller.cid"
					>
						<td>
							<i
								class="material-icons green-text"
								v-if="!controller.tooLow || controller.protected || controller.exempt"
								>check</i
							>
							<i class="material-icons red-text text-darken-1" v-else>close</i>
						</td>
						<td>
							<i class="type_controller material-icons right">{{
								controller.vis ? 'work' : 'home'
							}}</i>
							<router-link :to="`/controllers/${controller.cid}`" class="controller_name">
								<span class="bold">{{ controller.fname }} {{ controller.lname }}</span>
								<span class="bold" v-if="controller.absence.length !== 0"> (LOA)</span>
								<div class="controller_info">
									<h6>Controller Details</h6>
									<p class="bold">
										{{ controller.fname }} {{ controller.lname }} ({{ controller.oi }})
									</p>
									<p class="light">{{ controller.ratingLong }}</p>
									<div class="certifications" v-if="controller.rating > 1">
										<div class="title">Certifications</div>
										<span
											v-for="cert in reduceControllerCerts(controller.certifications)"
											:class="`cert cert_${cert.class}`"
											:key="cert.id"
										>
											{{ cert.name }}
										</span>
										<span v-if="controller.certifications.length === 0"> — </span>
									</div>
									<div class="certifications training_request" v-else>
										<div>
											{{ controller.ratingLong }} has made
											<b>{{ controller.totalRequests }}</b> training request(s) in the last 91 days
										</div>
										<div>
											{{ controller.ratingLong }} has had
											<b>{{ controller.totalSessions }}</b> training session(s) in the last 91 days
										</div>
									</div>
								</div>
							</router-link>
						</td>
						<td>{{ controller.ratingShort }}</td>
						<td>{{ controller.rating === 1 ? 'N/A' : secondsToHms(controller.totalTime) }}</td>
						<td>{{ controller.rating === 1 ? secondsToHms(controller.obsTime) : 'N/A' }}</td>
						<td>{{ dLong(new Date(controller.joinDate)) }}</td>
						<td class="options">
							<a
								:href="`#modal_delete_${controller.cid}`"
								data-position="top"
								data-tooltip="Remove Controller"
								class="tooltipped modal-trigger"
								><i class="material-icons red-text text-darken-2">delete</i></a
							>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="loading_container" v-else>
				<Spinner />
			</div>
		</div>
		<Teleport to="body">
			<div
				v-for="controller in sortedArray"
				:key="`modal-${controller.cid}`"
				:id="`modal_delete_${controller.cid}`"
				class="modal modal_delete"
			>
				<div class="modal-content">
					<h4>Remove Controller?</h4>
					<p>
						This will remove <b>{{ controller.fname }} {{ controller.lname }}</b> from the Chicago
						ARTCC.
					</p>
					<textarea
						class="materialize-textarea"
						placeholder="Reason for removal"
						v-model="reason"
						required
					></textarea>
				</div>
				<div class="modal-footer">
					<a href="#!" @click.prevent="removeController(controller.cid)" class="btn waves-effect"
						>Remove</a
					>
					<a href="#!" class="btn-flat waves-effect modal-close" @click.prevent>Cancel</a>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script>
import { zabApi } from '@/helpers/axios.js';

export default {
	data() {
		return {
			report: null,
			chkDate2: new Date(),
			currentQuarter: Math.floor((new Date().getMonth() + 3) / 3), // default to the current quarter
			reason: '',
			sortBy: null,
			descending: true,
		};
	},
	async mounted() {
		await this.getActivity();
		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});
	},
	methods: {
		async getActivity(quarter = null) {
			const d = new Date();
			const selectedDate = quarter ? new Date(quarter) : d;
			const currentQuarter = Math.floor((selectedDate.getMonth() + 3) / 3); // Calculate the current quarter (1-4)
			const year = selectedDate.getFullYear();

			this.chkDate2 = selectedDate; // Update the selected date
			this.currentQuarter = currentQuarter; // Update the current quarter

			const { data: reportData } = await zabApi.get('/stats/activity', {
				params: {
					quarter: currentQuarter,
					year: year,
				},
			});

			this.report = reportData.data;
		},

		async previousQuarter() {
			let currentQuarter = Math.floor((this.chkDate2.getUTCMonth() + 3) / 3);
			let newYear = this.chkDate2.getUTCFullYear();

			if (currentQuarter === 1) {
				currentQuarter = 4;
				newYear -= 1;
			} else {
				currentQuarter -= 1;
			}

			const newDate = new Date(newYear, (currentQuarter - 1) * 3, 1);
			await this.getActivity(newDate);
			this.$forceUpdate(); // Trigger re-render if needed
		},

		async nextQuarter() {
			let currentQuarter = Math.floor((this.chkDate2.getUTCMonth() + 3) / 3);
			let newYear = this.chkDate2.getUTCFullYear();

			if (currentQuarter === 4) {
				currentQuarter = 1;
				newYear += 1;
			} else {
				currentQuarter += 1;
			}

			const newDate = new Date(newYear, (currentQuarter - 1) * 3, 1);
			if (newDate <= new Date()) {
				await this.getActivity(newDate);
				this.$forceUpdate();
			} else {
				console.log('Cannot select a future quarter.');
			}
		},

		async removeController(cid) {
			try {
				this.toastInfo('Removing controller...');
				const { data } = await zabApi.delete(`/controller/${cid}`, {
					data: {
						reason: this.reason,
					},
				});

				this.reason = '';

				if (data.ret_det.code === 200) {
					this.toastSuccess('Controller removed from roster');

					this.$nextTick(() => {
						M.Modal.getInstance(document.querySelector('.modal_delete')).close();
					});
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch (e) {
				console.log(e);
			}
		},
		secondsToHms(secs) {
			const days = Math.floor(secs / 86400);
			const remainderSeconds = secs % 86400;
			const hms = new Date(remainderSeconds * 1000).toISOString().substring(11, 19);
			return hms.replace(/^(\d+)/, (h) => `${+h + days * 24}`.padStart(2, '0'));
		},
		sec2hms(secs) {
			if (!secs) return '00:00:00';
			let hours = Math.floor(secs / 3600);
			if (hours < 10) {
				hours = `00${hours}`.slice(-2);
			}
			const minutes = `0${Math.round((secs / 60) % 60)}`.slice(-2);
			const seconds = `0${secs % 60}`.slice(-2);
			return `${hours}:${minutes}:${seconds}`;
		},
		reduceControllerCerts(certs) {
			if (!certs) return [];

			// Step 1: Sort certs by the 'order' property
			const sortedCerts = certs.sort((a, b) => (b.order || 0) - (a.order || 0));

			// Step 2: Remove non-tier certs if a tier-1 cert exists for the same facility/type
			const facilityMap = {}; // Track if a tier-1 or tier-2 cert exists for the same facility/type

			return sortedCerts.filter((cert) => {
				const facilityType = `${cert.facility}-${cert.type}`; // Facility + type (e.g., ORD-GND/DEL)

				if (cert.class === 'tier-1') {
					// If it's tier-1, store it and ensure only tier-1 and tier-2 certs are shown for this facility/type
					facilityMap[facilityType] = 'tier-1';
					return true; // Always show tier-1
				}

				if (cert.class === 'tier-2') {
					// If a tier-1 cert exists for this facility/type, show only tier-1 and tier-2
					if (facilityMap[facilityType] === 'tier-1') return true;
					// Otherwise, allow tier-2 to be displayed
					facilityMap[facilityType] = 'tier-2';
					return true;
				}

				if (cert.class === 'non-tier') {
					// Only display non-tier if no tier-1 cert exists for this facility/type
					if (!facilityMap[facilityType]) {
						facilityMap[facilityType] = 'non-tier';
						return true;
					}
					// If a tier-1 cert exists, don't display non-tier
					return false;
				}

				// For other cert types (e.g., solo), just include them
				return true;
			});
		},
		sort(p) {
			if (p === this.sortBy) {
				this.descending = !this.descending;
			} else {
				this.sortBy = p;
				this.descending = true;
			}
		},
	},
	computed: {
		sortedArray() {
			let array = this.report;

			if (this.sortBy && this.descending) {
				array.sort((a, b) => (b[this.sortBy] > a[this.sortBy]) - (b[this.sortBy] < a[this.sortBy]));
			} else if (this.sortBy && !this.descending) {
				array.sort((a, b) => (a[this.sortBy] > b[this.sortBy]) - (a[this.sortBy] < b[this.sortBy]));
			}

			return array;
		},
	},
};
</script>

<style lang="scss" scoped>
.protected {
	background: rgba($accent-color, 0.25) !important;
}

.bold {
	font-weight: 600;
}

.table_wrapper {
	overflow: auto;

	table {
		min-width: 700px;

		.type_controller {
			color: rgba(0, 0, 0, 0.87);
			margin-right: -14px;
		}

		th {
			user-select: none;
			cursor: pointer;

			i {
				font-size: 17px;
				color: #a8a8a8;
				position: absolute;
				margin-top: 4px;

				&.active {
					color: #a8a8a8;
					font-size: 24px;
					margin-top: 0;
					margin-left: -3px;
				}
			}
		}
	}
}

.controller_name {
	&:hover {
		.controller_info {
			opacity: 1;
		}
	}
}

.controller_info {
	position: absolute;
	margin-top: 15px;
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.3s;
	width: 300px;
	z-index: 500;
	background: #fff;
	box-shadow: 0px 0px 10px 0px rgba(#000, 0.5);

	&::before {
		left: 10%;
		transform: translateX(-10%);
		content: '';
		pointer-events: none;
		display: inline-block;
		position: absolute;
		bottom: 100%;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 10px 10px 10px;
		border-color: transparent transparent #122049 transparent;
	}

	h6 {
		background: $primary-color;
		padding: 10px;
		color: #fff;
		font-weight: 300;
		margin: 0;
	}

	p {
		padding: 0 0.75em;
		margin: 0;

		&.bold {
			padding-top: 0.5em;
		}

		&.light {
			font-weight: 300;
			margin-top: -5px;
			color: #000;
		}
	}

	.certifications {
		padding: 0.5em 0.75em 0.75em 0.75em;
	}

	.training_request {
		color: #000;
		font-size: 0.875rem;
	}

	.cert {
		display: inline-block;
		padding: 0.125rem 0.25rem;
		color: #fff;
		font-size: 0.8rem;
		margin: 2px;
		user-select: none;

		& + .title {
			margin-top: 1em;
		}

		&.cert_senior {
			background: $cert_senior;
		}

		&.cert_junior {
			background: $cert_junior;
		}

		&.cert_training {
			background: $cert_training;
		}

		&.cert_center {
			background-color: $secondary-color-dark;
		}

		&.cert_tier-1 {
			background: $secondary-color;
		}

		&.cert_tier-2 {
			background: $primary-color;
		}

		&.cert_non-tier {
			background: $secondary-color-light;
		}

		&.cert_solon {
			background: #ffa500;
		}

		&.cert_solom {
			background: #ffe83e;
			color: #000000;
		}
	}

	.title {
		color: #9e9e9e;
		font-size: 0.8rem;
	}
}
</style>
