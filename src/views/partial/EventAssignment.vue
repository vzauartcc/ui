<template>
	<div class="card signup-card">
		<div class="card-content">
			<span class="card-title">Position Assignments</span>
		</div>
		<div class="card-content" v-if="!event">
			<Spinner />
		</div>
		<div v-else>
			<EventAssignmentTable
				v-for="category in positionCategories"
				:category="category"
				:key="category"
			/>
			<div class="card-content assignment_cta">
				<div
					v-if="!event.open || new Date(event.eventStart).getTime() < Date.now()"
					class="sign_up_err"
				>
					Sign-ups for this event are closed
				</div>
				<div v-else-if="!user.data" class="sign_up_err">Log in to sign up</div>
				<div v-else-if="user.data.member === false" class="sign_up_err">
					You are not a member of ZAU
				</div>
				<div v-else-if="assignedPositions" class="sign_up_err">
					You have been assigned a position. Contact the EC if you need to cancel.
				</div>
				<div v-else-if="requestedPositions" class="requested_pos">
					You have requested:<br />
					{{ currentUserRequests || 'No preference' }}<br />
					<button
						@click="deleteRequest()"
						class="btn btn-small waves-effect waves-light btn_delete"
						:disabled="spinners.length > 0"
					>
						<span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>
						Delete Request
					</button>
				</div>
				<button
					v-else
					class="btn waves-effect waves-light modal-trigger btn_signup"
					data-target="assignment_modal"
				>
					Sign up
				</button>
			</div>
			<div id="assignment_modal" class="modal assignment_modal">
				<div class="modal-content">
					<h4>Sign up for {{ event.name }}</h4>
					<p>
						The positions for this event will be assigned by the events coordinator. Please indicate
						up to three preferred positions below. If you do not have a preference, leave the field
						empty. <br /><br /><b style="color: red"
							>You must press enter after each callsign to add the preference!</b
						>
					</p>
					<p>
						Please be advised that requests are just that — requests. The Event Coordinator may
						place you on any (or no) position depending on multiple factors.
					</p>
					<div class="chips chips-placeholder"></div>
				</div>
				<div class="modal-footer">
					<a
						href="#"
						class="waves-effect waves-light btn"
						@click.prevent="addRequest()"
						:class="{ disabled: spinners.length > 0 }"
						><span v-if="spinners.some((s) => s === 'add')"> <SmallSpinner /> </span>Sign up</a
					>
					<a href="#!" class="modal-close waves-effect btn-flat">Cancel</a>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';
import EventAssignmentTable from './EventAssignmentTable.vue';

export default {
	components: {
		EventAssignmentTable,
	},
	data() {
		return {
			spinners: [],
			event: null,
			positionCategories: {
				enroute: {
					title: 'Enroute',
					positions: null,
				},
				tracon: {
					title: 'TRACON',
					positions: null,
				},
				local: {
					title: 'Local',
					positions: null,
				},
			},
		};
	},
	async mounted() {
		await this.getPositions();
		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false,
		});
		this.chips = M.Chips.init(document.querySelector('.chips'), {
			placeholder: 'Enter a callsign',
			secondaryPlaceholder: ' ',
			limit: 3,
		});
	},
	methods: {
		async getPositions() {
			try {
				const { data } = await zauApi.get(`/event/${this.$route.params.slug}/positions`);
				this.event = data;

				if (this.event.positions !== null) {
					this.positionCategories.enroute.positions = this.event.positions.filter((position) =>
						['CTR'].includes(position.type),
					);
					this.positionCategories.tracon.positions = this.event.positions.filter((position) =>
						['DEP', 'APP'].includes(position.type),
					);
					this.positionCategories.local.positions = this.event.positions.filter((position) =>
						['DEL', 'GND', 'TWR'].includes(position.type),
					);
				}
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting positions', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async addRequest() {
			try {
				this.spinners.push('add');
				const requests = this.chips.chipsData.map((chip) => chip.tag);

				const confirm =
					requests.length === 0
						? window.confirm(
								'You have not entered any preferences. Are you sure you want to submit your request with no preference?',
							)
						: true;

				if (!confirm) {
					return;
				}

				await zauApi.patch(`/event/${this.$route.params.slug}/signup`, { requests });

				this.toastSuccess('Request submitted');

				await this.getPositions();
				this.$nextTick(() => {
					M.Modal.getInstance(document.querySelector('#assignment_modal')).close();
				});
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
		async deleteRequest() {
			try {
				this.spinners.push('delete');
				while (this.chips.chipsData.length) {
					this.chips.deleteChip(0);
				}

				await zauApi.delete(`/event/${this.$route.params.slug}/signup`);

				this.toastSuccess('Request deleted');
				await this.getPositions();
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
	},
	computed: {
		...mapState('user', ['user']),
		requestedPositions() {
			if (this.event.signups) {
				return this.event.signups.some((su) => su.cid == this.user.data.cid);
			} else {
				return false;
			}
		},
		assignedPositions() {
			if (this.event.positions) {
				return this.event.positions.some((su) => su.user && su.user.cid == this.user.data.cid);
			} else {
				return false;
			}
		},
		currentUserRequests() {
			if (this.event.signups) {
				return this.event.signups
					.filter((su) => su.cid == this.user.data.cid)[0]
					.requests.join(`, `);
			} else {
				return false;
			}
		},
	},
};
</script>

<style scoped lang="scss">
.assignment_cta {
	padding: 1em !important;
	text-align: center;
}

.sign_up_err,
.btn_signup {
	margin-top: -1em;
}

.requested_pos {
	margin-top: -1em;
	line-height: 1.8;
}

.assignment_modal {
	.chips {
		height: 30px;
		margin-bottom: 2rem;
	}

	.dropdown-content {
		width: auto !important;
	}
}

.btn_delete {
	margin-top: 0.5em;
}

.modal-footer {
	padding-left: 20px;
}

.chips.focus {
	border-bottom: 1px solid $primary-color-light;
	box-shadow: 0 1px 0 0 $primary-color-light;
}
</style>
