<template>
	<div>
		<div class="card" v-if="!user.isLoggedIn">
			<div class="card-content">
				<span class="card-title">Controller Roster</span>
				<span>
					Due to privacy concerns, the roster has been hidden for non-VATSIM members.  If you are a member of VATSIM, click the login button below to view the roster.<br /><br />
				</span>
				<div class="center-align">
					<button class="btn btn-waves login_button" @click="login">Login via VATSIM</button>
				</div>
			</div>
		</div>
		<div v-else>
			<!--<div class="card">
				<div class="card-content">
					<span>Note: For ZMO certs, please follow <a href="https://docs.google.com/spreadsheets/d/1-4IZNAukEu7I24OcracEZzRe6XkgDVukUFSteZHzUhU/edit?usp=sharing" target="_blank">this link to the Miami-Nassau Mutual Roster</a>.</span>
				</div>
			</div>-->
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
									{{controller.fname}} {{controller.lname}} ({{controller.oi}})
									<span v-if="controller.absence && controller.absence.length > 0" class="controller_loa hide-on-med-and-down">LOA</span>
								</router-link><br />
								<div class="rating">
									{{controller.ratingLong}}
								</div>
								<span v-if="controller.absence && controller.absence.length > 0" class="controller_loa hide-on-large-only mobile">LOA</span>
							</td>
							<td class="certs">
								<span v-for="role in controller.roles" :class="`tooltipped cert cert_${role.class}`" :key="role.id" :data-tooltip="role.name" data-position="top">
									{{role.code.toUpperCase()}}
								</span>
								<span v-for="cert in reduceControllerCerts(controller.certifications)" :class="`cert cert_${cert.class}`" :key="cert.id">
									{{cert.name}}
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
									{{controller.fname}} {{controller.lname}} ({{controller.oi}})
									<span v-if="controller.absence && controller.absence.length > 0" class="controller_loa hide-on-med-and-down">LOA</span>
								</router-link><br />
								<div class="rating">
									{{controller.ratingLong}}
								</div>
								<span v-if="controller.absence && controller.absence.length > 0" class="controller_loa hide-on-large-only mobile">LOA</span>
							</td>
							<td class="certs">
								<span v-for="role in controller.roles" :class="`tooltipped cert cert_${role.class}`" :key="role.id" :data-tooltip="role.name" data-position="top">
									{{role.code.toUpperCase()}}
								</span>
								<span v-for="cert in reduceControllerCerts(controller.certifications)" :class="`cert cert_${cert.class}`" :key="cert.id">
									{{cert.name}}
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
import { mapState } from "vuex";
import { zabApi } from "@/helpers/axios.js";
import { vatsimAuthRedirectUrl } from "@/helpers/uriHelper.js";

export default {
  name: "Controller Roster",
  title: "Controller Roster",
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
    M.Tooltip.init(document.querySelectorAll(".tooltipped"), {
      margin: 0,
    });
  },
  methods: {
    async getControllers() {
      const { data } = await zabApi.get("/controller");
      this.controllers = data.data;
      this.controllers.home = this.controllers.home.filter((c) => c.member);
      this.controllers.visiting = this.controllers.visiting.filter(
        (c) => c.member
      );
    },
    async login() {
      localStorage.setItem("redirect", this.$route.path);
      window.location.href = vatsimAuthRedirectUrl;
    },
    reduceControllerCerts(certs) {
  		if (!certs) return [];

  		// Define priority orders
  		const tierPriority = { 'tier-1': 1, 'tier-2': 2, 'solom': 3, 'solon': 4, 'non-tier': 5 };
  		const facilityPriority = { 'ctr': 1, 'app': 2, 'twr': 3, 'gnd': 4 };

  		// Group certs by facility
  		const facilityGroups = certs.reduce((acc, cert) => {
    		if (!acc[cert.facility]) acc[cert.facility] = [];
    		acc[cert.facility].push(cert);
    		return acc;
  		}, {});

  		// Filter and sort certifications within each facility group
  		let sortedCerts = [];
  		Object.keys(facilityGroups).forEach(facility => {
    		// Sort certs by tier within the facility
    		facilityGroups[facility].sort((a, b) => (tierPriority[a.class] || 6) - (tierPriority[b.class] || 6));

    		let hasTier1or2 = facilityGroups[facility].some(cert => cert.class === 'tier-1' || cert.class === 'tier-2');
    		facilityGroups[facility].forEach(cert => {
      		if (cert.class === 'tier-1' || cert.class === 'tier-2') {
        		sortedCerts.push(cert);
      		} else if (cert.class.includes('solo')) {
        		sortedCerts.push(cert);
      		} else if (cert.class === 'non-tier' && !hasTier1or2) {
        		sortedCerts.push(cert);
      		}
    		});
  		});

  		// Finally, sort all selected certs by facility priority
  		return sortedCerts.sort((a, b) => (facilityPriority[a.facility] || 5) - (facilityPriority[b.facility] || 5));
		},
  },
  computed: {
    ...mapState("user", ["user"]),
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
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}

	div {
		padding: 0.5rem 1rem;
	}
}

tr th {
	text-align: left!important;
}

td {
	padding: .25em 1em!important;
}

.name {
	min-width: 150px;
}

.name a {
	font-weight: 700;
	-webkit-user-select: none; /* Safari 3.1+ */ -moz-user-select: none; /* Firefox 2+ */ -ms-user-select: none; /* IE 10+ */ user-select: none; /* Standard syntax */ user-drag: none; -webkit-user-drag: none;
}

.name .rating {
	font-weight: 400;
	margin: -10px 0 0 -15px;
	padding-bottom: 0!important;
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
		background: #FFA500;
	}
	&.cert_solom {
		background: #FFE83E;
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
	font-size: .9rem;
	margin-left: .25em;

	&.mobile {
		width: 36px;
		margin-left: 0;
	}
}
</style>
