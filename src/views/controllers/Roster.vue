<template>
	<div>
		<div class="card" v-if="!user.isLoggedIn">
			<div class="card-content">
				<span class="card-title">Controller Roster</span>
				<span>
					Due to privacy concerns, the roster has been hidden for non-VATSIM members. If you are a
					member of VATSIM, click the login button below to view the roster.<br /><br />
				</span>
				<div class="center-align">
					<button class="btn btn-waves login_button" @click="login">Login via VATSIM</button>
				</div>
			</div>
		</div>
		<div v-else>
			<div class="card">
				<div class="card-content">
					<span class="card-title">Home Controllers</span>
				</div>
				<table class="controller_list striped">
					<thead class="controller_list_head">
						<tr>
							<th class="name">Name</th>
							<th class="certs">Certifications</th>
						</tr>
					</thead>
					<tbody class="controller_list_row" v-if="controllers.home">
						<tr v-for="controller in controllers.home" :key="controller.cid">
							<td class="name">
								<router-link :to="`/controllers/${controller.cid}`">
									{{ controller.fname }} {{ controller.lname }} ({{ controller.oi }})
									<span
										v-if="controller.absence && controller.absence.length > 0"
										class="controller_loa hide-on-med-and-down"
										>LOA</span
									> </router-link
								><br />
								<div class="rating">
									{{ controller.ratingLong }}
								</div>
								<span
									v-if="controller.absence && controller.absence.length > 0"
									class="controller_loa hide-on-large-only mobile"
									>LOA</span
								>
							</td>
							<td class="certs">
								<span
									v-for="role in controller.roles"
									:class="`tooltipped cert cert_${role.class}`"
									:key="role.id"
									:data-tooltip="role.name"
									data-position="top"
								>
									{{ role.code.toUpperCase() }}
								</span>
								<span
									v-for="cert in reduceControllerCerts(controller.certifications)"
									:class="`cert cert_${cert.class}`"
									:key="cert.id"
								>
									{{ cert.name }}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
				<div class="loading_container" v-if="!controllers.home">
					<Spinner />
				</div>
			</div>
			<div class="card">
				<div class="card-content">
					<span class="card-title">Visiting Controllers</span>
				</div>
				<table class="controller_list striped">
					<thead class="controller_list_head">
						<tr>
							<th class="name">Name</th>
							<th class="certs">Certifications</th>
						</tr>
					</thead>
					<tbody class="controller_list_row" v-if="controllers.visiting">
						<tr v-for="controller in controllers.visiting" :key="controller.cid">
							<td class="name">
								<router-link :to="`/controllers/${controller.cid}`">
									{{ controller.fname }} {{ controller.lname }} ({{ controller.oi }})
									<span
										v-if="controller.absence && controller.absence.length > 0"
										class="controller_loa hide-on-med-and-down"
										>LOA</span
									> </router-link
								><br />
								<div class="rating">
									{{ controller.ratingLong }}
								</div>
								<span
									v-if="controller.absence && controller.absence.length > 0"
									class="controller_loa hide-on-large-only mobile"
									>LOA</span
								>
							</td>
							<td class="certs">
								<span
									v-for="role in controller.roles"
									:class="`tooltipped cert cert_${role.class}`"
									:key="role.id"
									:data-tooltip="role.name"
									data-position="top"
								>
									{{ role.code.toUpperCase() }}
								</span>
								<span
									v-for="cert in reduceControllerCerts(controller.certifications)"
									:class="`cert cert_${cert.class}`"
									:key="cert.id"
								>
									{{ cert.name }}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
				<div class="loading_container" v-if="!controllers.visiting">
					<Spinner />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { vatsimAuthRedirectUrl } from '@/helpers/uriHelper.js';
import { mapState } from 'vuex';

export default {
	name: 'Controller Roster',
	title: 'Controller Roster',
	data() {
		return {
			controllers: {
				home: null,
				visiting: null,
			},
		};
	},
	async mounted() {
		await this.getControllers();
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0,
		});
	},
	methods: {
		async getControllers() {
			try {
				const { data } = await zauApi.get('/controller');
				this.controllers = data.data;
				this.controllers.home = this.controllers.home.filter((c) => c.member);
				this.controllers.visiting = this.controllers.visiting.filter((c) => c.member);
			} catch (e) {
				console.error('error getting controllers', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async login() {
			localStorage.setItem('redirect', this.$route.path);
			window.location.href = vatsimAuthRedirectUrl;
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
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.controller_list {
	padding: 10px;
}
.controller_list_head {
	position: relative;
	font-weight: 700;
	border-bottom: 1px solid #666;
}

.controller_list_row {
	tr {
		transition: background-color 0.3s ease;
		&:hover {
			background: #eaeaea;
		}
	}

	div {
		padding: 0.5rem 1rem;
	}
}

tr th {
	text-align: left !important;
}

td {
	padding: 0.25em 1em !important;
}

.name {
	min-width: 150px;
}

.name a {
	font-weight: 700;
	-webkit-user-select: none; /* Safari 3.1+ */
	-moz-user-select: none; /* Firefox 2+ */
	-ms-user-select: none; /* IE 10+ */
	user-select: none; /* Standard syntax */
	-webkit-user-drag: none;
}

.name .rating {
	font-weight: 400;
	margin: -10px 0 0 -15px;
	padding-bottom: 0 !important;
}

.cert {
	display: inline-block;
	padding: 0.25rem 0.4rem;
	color: #fff;
	font-size: 0.85rem;
	margin: 2px;
	user-select: none;

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

.tooltipped {
	cursor: pointer;
}

.controller_loa {
	background: $secondary-color-dark;
	color: #fff;
	font-weight: 400;
	padding: 0.2rem 0.4rem;
	font-size: 0.9rem;
	margin-left: 0.25em;

	&.mobile {
		width: 36px;
		margin-left: 0;
	}
}
</style>
