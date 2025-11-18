<template>
	<div class="card">
		<div class="card-content">
			<button
				class="btn right waves-effect waves-light btn_add_signup modal-trigger"
				data-target="modal_add_signup"
			>
				<i class="material-icons">add</i>
			</button>
			<div class="card-title">
				Position Assignments <b>{{ event !== null ? `– ${event.name}` : '' }}</b>
			</div>
		</div>
		<div class="loading_container" v-if="event === null">
			<Spinner />
		</div>
		<div class="no_signups" v-else-if="event && (!event.signups || event.signups.length === 0)">
			There have been no sign-ups for this event yet
		</div>
		<div class="signups_wrapper" v-else>
			<div class="table_wrapper">
				<table class="signups_list striped">
					<thead class="signups_list_head">
						<tr>
							<th>Controller</th>
							<th>Event Endorsements</th>
							<th>Preferences</th>
							<th class="options">Options</th>
						</tr>
					</thead>
					<tbody class="signups_list_row">
						<tr v-for="signup in event.signups" :key="signup._id">
							<td>
								<router-link :to="`/controllers/${signup.user.cid}`">
									<span class="signup_name"
										>{{ signup.user.fname }} {{ signup.user.lname }}
										<span v-if="signup.user.vis">(VC)</span></span
									>
									<br />
								</router-link>
								<span class="signup_rating">{{ signup.user.ratingLong }}</span>
							</td>
							<td class="certs">
								<span
									v-for="cert in signup.user.certifications
										.filter((c) => c.class.includes('event') || c.class.includes('solo'))
										.sort((a, b) => b.order - a.order)"
									:key="cert.code"
									:class="`cert cert_${cert.class}`"
								>
									{{ cert.name }}
								</span>
							</td>
							<td>{{ signup.requests.join(', ') || 'None' }}</td>
							<td class="options">
								<!-- Use unique modal per user -->
								<a
									href="#"
									:data-target="'modal_delete_' + signup._id"
									class="tooltipped modal-trigger"
								>
									<i class="material-icons red-text text-darken-2" @click.prevent>delete</i>
								</a>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="card-content">
				<span class="card-title">Assignments</span>
			</div>
			<div class="position_table">
				<table class="striped">
					<thead>
						<tr>
							<th>Position</th>
							<th>Controller</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="position in event.positions" :key="position.pos">
							<td>{{ position.pos }}</td>
							<td>
								<select
									name=""
									id=""
									@change="assignPos(position._id)"
									:ref="`pos_${position._id}`"
									class="materialize-select"
								>
									<option value="" :selected="!position.takenBy">Unassigned</option>
									<option
										v-for="signup in event.signups"
										:key="signup.cid"
										:selected="position.takenBy === signup.cid"
										:value="signup.cid"
									>
										{{ signup.user.fname }} {{ signup.user.lname }}
									</option>
								</select>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="row row_no_margin">
				<div class="input-field col s12 signups_submit">
					<button
						type="submit"
						class="btn waves-effect waves-light right modal-trigger"
						data-target="modal_notify"
						:disabled="event.signups.length == 0 || event.submitted == true"
					>
						Send Notification Email
					</button>
				</div>
			</div>
		</div>

		<!-- Teleported Modals -->
		<Teleport to="body">
			<div id="modal_add_signup" class="modal modal_add_signup">
				<div class="modal-content">
					<h4>Manually add sign-up</h4>
					<p>
						Enter a CID to manually sign a controller up for this event. The controller must have
						logged in on the website at least once.
					</p>
					<div class="row row_no_margin">
						<form @submit.prevent="addSignup">
							<div class="input-field col s12">
								<input type="text" id="cid" v-model="cid" required />
								<label for="cid">Controller ID</label>
							</div>
						</form>
					</div>
				</div>
				<div class="modal-footer">
					<a
						href="#!"
						class="waves-effect waves-light btn"
						@click.prevent="addSignup"
						:class="{ disabled: spinners.length > 0 }"
						><span v-if="spinners.some((s) => s === 'add')"> <SmallSpinner /> </span>Add</a
					>
					<a href="#!" class="waved-effect waves-light modal-close btn-flat" @click.prevent
						>Cancel</a
					>
				</div>
			</div>
		</Teleport>

		<Teleport to="body" v-if="event && event.signups">
			<div v-for="signup in event.signups" :key="signup._id">
				<div :id="`modal_delete_${signup._id}`" class="modal modal_delete">
					<div class="modal-content">
						<h4>Delete sign-up?</h4>
						<p>
							This will delete <strong>{{ signup.user.fname }} {{ signup.user.lname }}</strong
							>'s sign-up for this event. You can still manually sign {{ signup.user.fname }} up.
						</p>
					</div>
					<div class="modal-footer">
						<a
							href="#!"
							class="waves-effect waves-light btn"
							@click.prevent="deleteSignup(signup.cid, signup._id)"
							:class="{ disabled: spinners.length > 0 }"
							><span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>Delete</a
						>
						<a href="#!" class="waves-effect waves-light modal-close btn-flat" @click.prevent
							>Cancel</a
						>
					</div>
				</div>
			</div>

			<div id="modal_notify" class="modal modal_notify">
				<div class="modal-content">
					<h4>Are you sure?</h4>
					<p>
						By clicking notify, an email will be sent out to all controllers that signed up with the
						position assignments. You can still make changes to the assignments after clicking
						notify. You cannot undo the email.
					</p>
				</div>
				<div class="modal-footer">
					<a
						href="#!"
						class="waves-effect waves-light btn"
						@click.prevent="notifyAssignments"
						:class="{ disabled: spinners.length > 0 }"
					>
						<span v-if="spinners.some((s) => s === 'notify')">
							<SmallSpinner />
						</span>
						Notify</a
					>
					<a href="#!" class="waved-effect waves-light modal-close btn-flat" @click.prevent
						>Cancel</a
					>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'EventAssignments',
	data() {
		return {
			spinners: [],
			allCerts: {},
			event: null,
			cid: null,
			selectedUser: null,
			deleteUser: null, // Stores the user data for deletion
		};
	},
	async mounted() {
		await this.getCertifications();
		await this.getEventData();
		if (this.event && this.event.name) {
			this.setTitle(`Position Assignments - ${this.event.name}`);
		}
		M.FormSelect.init(document.querySelectorAll('select'), {});
		this.$nextTick(() => {
			this.initializeStaticModals(); // Initialize static modals correctly
		});
	},
	methods: {
		async getCertifications() {
			try {
				const { data } = await zauApi.get('/controller/certifications');
				data.forEach((c) => {
					this.allCerts[c.code] = c;
				});

				console.log(this.allCerts);
			} catch (e) {
				console.error('error getting certifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getEventData() {
			try {
				const { data } = await zauApi.get(`/event/${this.$route.params.slug}/positions`);
				this.event = data || { signups: [] };
				this.event.signups.forEach((s) => {
					s.user.certCodes.forEach((c) => {
						s.user.certifications.push(
							this.allCerts[c] || { code: c, name: 'Unknown', class: 'Unknown' },
						);
					});
				});
				this.$nextTick(() => {
					this.initializeDynamicModals(); // Initialize dynamic modals after data loads
				});
			} catch (e) {
				console.error('error getting event positions', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		initializeStaticModals() {
			this.$nextTick(() => {
				const staticModals = document.querySelectorAll('#modal_add_signup, #modal_notify'); // Select static modals
				if (staticModals.length > 0) {
					staticModals.forEach((modal) => {
						if (!M.Modal.getInstance(modal)) {
							M.Modal.init(modal, { preventScrolling: false });
						}
					});
				}
			});
		},
		initializeDynamicModals() {
			this.$nextTick(() => {
				setTimeout(() => {
					// Delay ensures Vue finishes rendering
					const dynamicModals = document.querySelectorAll('.modal_delete');
					if (dynamicModals.length > 0) {
						dynamicModals.forEach((modal) => {
							if (!M.Modal.getInstance(modal)) {
								M.Modal.init(modal, { preventScrolling: false });
							}
						});
					}
				}, 300); // Slight delay to ensure modals are in DOM
			});
		},
		async notifyAssignments() {
			try {
				this.spinners.push('notify');
				await zauApi.patch(`/event/${this.$route.params.slug}/notify`, {
					assignment: this.event.positions,
				});

				this.toastSuccess('Controllers notified');

				await this.getEventData();
				setTimeout(() => M.Modal.getInstance(document.querySelector('#modal_notify')).close(), 200);
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error notifying', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'notify');
			}
		},
		async addSignup() {
			try {
				this.spinners.push('add');
				await zauApi.patch(`/event/${this.$route.params.slug}/mansignup/${this.cid}`);

				this.cid = null;
				this.toastSuccess('Sign-up manually added');

				await this.getEventData();
				M.FormSelect.init(document.querySelectorAll('select'), {});
				setTimeout(
					() => M.Modal.getInstance(document.querySelector('#modal_add_signup')).close(),
					200,
				);
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error adding signup', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'add');
			}
		},
		async deleteSignup(cid, modalId) {
			try {
				this.spinners.push('delete');
				await zauApi.delete(`/event/${this.$route.params.slug}/mandelete/${cid}`);

				this.toastSuccess('Sign-up manually deleted');
				await this.getEventData();

				// Close the specific modal
				this.$nextTick(() => {
					const modalElement = document.querySelector(`#modal_delete_${modalId}`);
					if (modalElement) {
						const modalInstance = M.Modal.getInstance(modalElement);
						if (modalInstance) modalInstance.close();
					}
				});
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting signup', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
		async assignPos(pos) {
			try {
				this.spinners.push('assign');
				// Retrieve selected CID from the dropdown
				const selectElement = this.$refs[`pos_${pos}`][0]; // Vue $refs returns an array for elements inside v-for
				const selectedCid = selectElement.value;

				await zauApi.patch(`/event/${this.$route.params.slug}/assign`, {
					position: pos,
					cid: selectedCid,
				});

				this.toastSuccess(`Position assigned successfully`);
				await this.getEventData(); // Refresh event data
				M.FormSelect.init(document.querySelectorAll('select'), {}); // Reinitialize dropdowns
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error assigning position', e);
					this.toastError('An error occurred while assigning position');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'assign');
			}
		},
		filterPos(userCerts) {
			let certsArray = [];
			userCerts.forEach((cert) => certsArray.push(cert.code));
			return this.event.positions.filter((pos) => {
				return certsArray.includes(pos.code);
			});
		},
	},
	watch: {
		event: {
			handler() {
				this.$nextTick(() => {
					this.initializeDynamicModals();
				});
			},
			deep: true,
			immediate: true, // Ensures it runs initially as well
		},
	},
};
</script>

<style scoped lang="scss">
.no_signups {
	font-style: italic;
	padding: 0 1em 1em 1em;
	margin-top: -1em;
}

.signup_name {
	font-weight: 700;
	color: $primary-color-light;
}

.card-title {
	width: calc(100% - 50px);
}

.signup_rating {
	display: block;
	margin-top: -4px;
}

.signups_submit {
	padding: 0.5em 1.5em;

	button {
		margin: 0.25em;
	}
}

.btn_add_signup {
	padding: 0 0.75em;
}

.options {
	i {
		cursor: pointer;
		user-select: none;
	}
}

.signups_list {
	td,
	th {
		&:not(.options) {
			min-width: 180px;
		}
	}
}

@media only screen and (max-width: 620px) {
	.table_wrapper {
		overflow: auto;
	}
}

.cert {
	display: inline-block;
	padding: 0.25rem 0.4rem;
	color: #fff;
	font-size: 0.85rem;
	margin: 2px;
	user-select: none;
}
</style>
