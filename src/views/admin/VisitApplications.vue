<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Visitor Applications</span>
		</div>
		<div class="card-content loading" v-if="applications === null">
			<Spinner />
		</div>
		<p class="no_visit" v-else-if="applications && applications.length === 0">
			There are no new visitor applications
		</p>
		<div class="table_wrapper" v-else>
			<table class="striped">
				<thead class="certs_list_head">
					<tr>
						<th>Name</th>
						<th>Rating</th>
						<th>Home ARTCC</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="certs_list_row">
					<tr v-for="app in applications" :key="app.application.cid">
						<td>{{ app.application.fname }} {{ app.application.lname }}</td>
						<td>{{ app.application.rating }}</td>
						<td>{{ app.application.home }}</td>
						<td class="options">
							<a href="#" class="modal-trigger" @click.prevent="openModal(app.application.cid)">
								<i class="material-icons">search</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<teleport to="body">
			<div v-for="app in applications" :key="`modal_${app.cid}`">
				<!-- Application Details Modal -->
				<div :id="`modal_${app.application.cid}`" class="modal modal_visit">
					<div class="modal-content">
						<div class="modal_title">Visiting Application</div>
						<div class="row row_no_margin">
							<div class="input-field col s6">
								<p id="name">{{ app.application.fname + ' ' + app.application.lname }}</p>
								<label for="name" class="active">Name</label>
							</div>
							<div class="input-field col s6">
								<p id="email">{{ app.application.email }}</p>
								<label for="email" class="active">Email</label>
							</div>
							<div class="input-field col s6">
								<p id="cid">{{ app.application.cid }}</p>
								<label for="cid" class="active">CID</label>
							</div>
							<div class="input-field col s6">
								<p id="rating">{{ app.application.rating }}</p>
								<label for="rating" class="active">Rating</label>
							</div>
							<div class="input-field col s6">
								<p id="home">{{ app.application.home }}</p>
								<label for="home" class="active">Home ARTCC</label>
							</div>
							<div class="input-field col s6">
								<p id="submission_date">{{ dtLong(app.application.createdAt) }}</p>
								<label for="submission_date" class="active">Date</label>
							</div>
							<div class="input-field col s12">
								<p id="join_reason">{{ app.application.reason }}</p>
								<label for="join_reason" class="active">Why would you like to visit ZAU?</label>
							</div>
						</div>
						<div class="row" v-if="!app.statusChecks.visiting">
							<hr />
							<div class="input-field col s6">
								<p
									id="50-hours"
									:style="!app.statusChecks.ratingConsolidation ? 'color: red' : 'color: green'"
								>
									{{
										app.statusChecks.ratingConsolidation
											? 'Yes'
											: app.statusChecks.ratingHours || 'Unknown' + ' hours'
									}}
								</p>
								<label for="50-hours" class="active"
									>Rating Consolidation (50 hours in rating)</label
								>
							</div>
							<div class="input-field col s6">
								<p id="promo" :style="!app.statusChecks.promo ? 'color: red' : 'color: green'">
									{{
										app.statusChecks.promo
											? 'Yes'
											: app.statusChecks.promoDays || 'Unknown' + ' days'
									}}
								</p>
								<label for="promo" class="active">90 days in rating</label>
							</div>
							<div class="input-field col s6">
								<p id="rating" :style="!app.statusChecks.hasRating ? 'color: red' : 'color: green'">
									{{ app.statusChecks.hasRating ? 'Yes' : 'No' }}
								</p>
								<label for="rating" class="active">Has S3 rating</label>
							</div>
							<div class="input-field col s6">
								<p
									id="60-days"
									:style="!app.statusChecks.recentlyRostered ? 'color: red' : 'color: green'"
								>
									{{
										app.statusChecks.recentlyRostered
											? 'Yes'
											: app.statusChecks.visitingDays || 'Unknown' + ' days'
									}}
								</p>
								<label for="60-days" class="active"
									>60 days since added to a VATUSA subdivision</label
								>
							</div>
							<div class="input-field col s6">
								<p id="has-home" :style="!app.statusChecks.hasHome ? 'color: red' : 'color: green'">
									{{ app.statusChecks.hasHome ? 'Yes' : 'No' }}
								</p>
								<label for="has-home" class="active">Has home facility</label>
							</div>
							<div class="input-field col s6">
								<p
									id="needs-basic"
									:style="!app.statusChecks.needsBasic ? 'color: red' : 'color: green'"
								>
									{{ !app.statusChecks.needsBasic ? 'Yes' : 'No' }}
								</p>
								<label for="needs-basic" class="active">Needs Basic</label>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
						<a href="#" class="btn-flat right" @click.prevent="openRejectModal(app.application.cid)"
							>Reject</a
						>
						<a
							href="#"
							class="waves-effect waves-light btn right"
							@click.prevent="approveVisitor(app.application.cid)"
							:style="app.statusChecks.visiting ? '' : 'background-color:red'"
							:class="{ disabled: spinners.length > 0 }"
						>
							<span v-if="spinners.some((s) => s === 'approve')">
								<SmallSpinner />
							</span>
							Approve</a
						>
						<p v-if="app.statusChecks.visiting" class="left" style="color: green">
							Meets VATUSA requirements
						</p>
						<p v-else class="left" style="color: red; font-weight: bolder">
							Does not meet VATUSA requirements
						</p>
					</div>
				</div>

				<!-- Reject Application Modal -->
				<div :id="`modal_reject_${app.application.cid}`" class="modal modal_visit">
					<div class="modal-content">
						<div class="modal_title">Reject Visiting Application?</div>
						<p>
							This will reject the visiting application from
							<strong>{{ app.fname + ' ' + app.lname }}</strong
							>. You must provide a reason for rejection below. This will also be shown to the
							applicant.
						</p>
						<div class="row row_no_margin">
							<div class="input-field col s12">
								<input
									:id="`reason_${app.application.cid}`"
									:name="`reason_${app.application.cid}`"
									v-model="reason[app.application.cid]"
								/>
								<label :for="`reason_${app.application.cid}`" class="active">Reason</label>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							class="waves-effect btn modal-close"
							@click.prevent="rejectVisitor(app.application.cid)"
							:class="{ disabled: spinners.length > 0 }"
						>
							<span v-if="spinners.some((s) => s === 'reject')">
								<SmallSpinner />
							</span>
							Reject</a
						>
						<a href="#" class="waves-effect btn-flat modal-close" @click.prevent>Cancel</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'VisitorApplications',
	title: 'Visitor Applications',
	data() {
		return {
			applications: null,
			reason: {},
			spinners: [],
		};
	},
	async mounted() {
		await this.getNewApplications();
	},
	methods: {
		async getNewApplications() {
			try {
				const { data } = await zauApi.get('/controller/visit');
				this.applications = data;
				this.$nextTick(() => {
					this.initModals();
				});
			} catch (e) {
				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		openModal(cid) {
			const modal = document.getElementById(`modal_${cid}`);
			if (modal) {
				M.Modal.getInstance(modal).open();
			}
		},
		initModals() {
			this.$nextTick(() => {
				const modals = document.querySelectorAll('.modal');
				M.Modal.init(modals, {
					preventScrolling: false,
				});
			});
		},
		async approveVisitor(cid) {
			try {
				this.spinners.push('approve');
				await zauApi.patch(`/controller/visit/${cid}`);
				this.toastSuccess('Visiting application approved!');
				await this.getNewApplications();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error approving application', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'approve');
			}
		},
		async rejectVisitor(cid) {
			try {
				this.spinners.push('reject');
				await zauApi.delete(`/controller/visit/${cid}`, {
					data: {
						reason: this.reason[cid],
					},
				});

				this.toastSuccess('Visiting application rejected later');
				await this.getNewApplications();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error rejecting application', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'reject');
			}
		},
		openRejectModal(i) {
			M.Modal.getInstance(document.querySelector(`#modal_${i}`)).close();
			M.Modal.getInstance(document.querySelector(`#modal_reject_${i}`)).open();
		},
	},
};
</script>

<style scoped lang="scss">
.modal_title {
	font-size: 1.8em;
	margin-bottom: 0.5em;
}
.no_visit {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

#join_reason {
	font-family: inherit;
	width: 100%;
}

.row {
	.input-field p {
		margin: 0.33em 0 0 0;
		white-space: pre-wrap;
	}
}
</style>
