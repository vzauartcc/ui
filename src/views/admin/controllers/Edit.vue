<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Controller {{controller !== null ? ` - ${controller.fname}
				${controller.lname}` : ''}}</span>
			<div class="loading_container" v-if="controller === null">
				<Spinner />
			</div>
			<form id="update_controller" @submit.prevent=updateController v-else>
				<div class="row row_no_margin">
					<div class="input-field col s6">
						<input id="first_name" type="text" v-model="form.fname" required>
						<label for="first_name" class="active">First Name</label>
					</div>
					<div class="input-field col s6">
						<input id="last_name" type="text" v-model="form.lname" required>
						<label for="last_name" class="active">Last Name</label>
					</div>
					<div class="input-field col s6">
						<input id="cid" type="text" :value="controller.cid" disabled>
						<label for="cid" class="active">Controller ID</label>
					</div>
					<div class="input-field col s6">
						<input id="rating" type="text" :value="controller.ratingLong" disabled>
						<label for="rating" class="active">Rating</label>
					</div>
					<div class="input-field col s6">
						<input id="email" type="email" v-model="form.email">
						<label for="email" class="active">Email</label>
					</div>
					<div class="input-field col s6 input_oi">
						<input id="oi" type="text" v-model="form.oi" @input="checkOi($event)" maxlength="2" required>
						<label for="oi" class="active">Operating Initials</label>
						<div class="oi_check right">
							<i v-if="oiAvail == true" class="material-icons green-text">check_circle</i>
							<i v-else class="material-icons red-text text-darken-1">remove_circle</i>
						</div>
					</div>
					<div class="input-field col s12">
						<div id="certs_container">
							<label for="minor_certs_container" class="active">Non-Tier Certifications:</label>
							<div id="minor_certs_container" class="cert_container">
								<span id="gnd" :class="{active: form.certs.gnd}" class="cert cert_minor"
									@click="toggleCert">GND/DEL</span>
								<span id="twr" :class="{active: form.certs.twr}" class="cert cert_minor"
									@click="toggleCert">TWR</span>
								<span id="app" :class="{active: form.certs.app}" class="cert cert_minor"
									@click="toggleCert">APP</span>
							</div>
							<label for="chicago_certs_container" class="active">Tier 2 Endorsements:</label>
							<div id="chicago_certs_container" class="cert_container">
								<span id="mdwgnd" :class="{active: form.certs.mdwgnd}" class="cert cert_tier-2"
									@click="toggleCert">MDW_GND/DEL</span>
								<span id="mdwtwr" :class="{active: form.certs.mdwtwr}" class="cert cert_tier-2"
									@click="toggleCert">MDW_TWR</span>
								<span id="zaut2" :class="{active: form.certs.zaut2}" class="cert cert_tier-2"
									@click="toggleCert">CHI_CTR</span>
							</div>
							<label for="chicago_certs_container" class="active">Tier 1 Endorsements:</label>
							<div id="chicago_certs_container" class="cert_container">
								<span id="ordgnd" :class="{active: form.certs.ordgnd}" class="cert cert_tier-1"
									@click="toggleCert">ORD_GND/DEL</span>
								<span id="ordtwr" :class="{active: form.certs.ordtwr}" class="cert cert_tier-1"
									@click="toggleCert">ORD_TWR</span>
								<span id="ordapp" :class="{active: form.certs.ordapp}" class="cert cert_tier-1"
									@click="toggleCert">C90_APP</span>
								<span id="zau" :class="{active: form.certs.zau}" class="cert cert_center"
									@click="toggleCert">CHI_CTR</span>
							</div>
							<label for="solo_certs_container" class="active">Solo Certifications:</label>
							<div id="solo_certs_container" class="cert_container">
								<span id="apps" :class="{active: form.certs.apps}" class="cert cert_solon"
									@click="toggleCert">APP</span>
								<span id="ordgnds" :class="{active: form.certs.ordgnds}" class="cert cert_solom"
									@click="toggleCert">ORD_GND</span>
								<span id="ordtwrs" :class="{active: form.certs.ordtwrs}" class="cert cert_solom"
									@click="toggleCert">ORD_TWR</span>
								<span id="ordapps" :class="{active: form.certs.ordapps}" class="cert cert_solom"
									@click="toggleCert">C90_APP</span>
								<span id="zaus" :class="{active: form.certs.zaus}" class="cert cert_solom"
									@click="toggleCert">CHI_CTR</span>
							</div>
						</div>
					</div>
					<div class="input-field col s12">
						<label for="roles" class="active">Roles</label>
						<div id="roles_container">
							<span id="atm" class="cert cert_senior" :class="{active: form.roles.atm}"
								@click="toggleRole">ATM</span>
							<span id="datm" class="cert cert_senior" :class="{active: form.roles.datm}"
								@click="toggleRole">DATM</span>
							<span id="ta" class="cert cert_senior" :class="{active: form.roles.ta}"
								@click="toggleRole">TA</span>
							<span id="ec" class="cert cert_junior" :class="{active: form.roles.ec}"
								@click="toggleRole">EC</span>
							<span id="fe" class="cert cert_junior" :class="{active: form.roles.fe}"
								@click="toggleRole">FE</span>
							<span id="wm" class="cert cert_junior" :class="{active: form.roles.wm}"
								@click="toggleRole">WM</span>
							<span id="ins" class="cert cert_training" :class="{active: form.roles.ins}"
								@click="toggleRole">INS</span>
              <span id="ia" class="cert cert_training" :class="{active: form.roles.ia}"
                @click="toggleRole">IA</span>
							<span id="mtr" class="cert cert_training" :class="{active: form.roles.mtr}"
								@click="toggleRole">MTR</span>
							<span id="vis" class="cert cert_vis" :class="{active: form.vis}"
								@click="toggleVis">VIS</span>
						</div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right">Update</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import {zabApi} from '@/helpers/axios.js';

export default {
	data() {
		return {
			controller: null,
			usedOi: [],
			oi: '',
			oiAvail: true,
			form: {
				fname: '',
				lname: '',
				email: '',
				oi: '',
				vis: false,
				certs: {
					zau: false,
					ordapp: false,
					ordtwr: false,
					ordgnd: false,
					mdwtwr: false,
					mdwgnd: false,
					app: false,
					twr: false,
					gnd: false,
					zaus: false,
					zaut2: false,
					ordapps: false,
					ordtwrs: false,
					ordgnds: false,
					apps: false,
				},
				roles: {
					atm: false,
					datm: false,
					ta: false,
					ec: false,
					fe: false,
					wm: false,
					ins: false,
					mtr: false,
          ia: false,
				},
			}
		};
	},
	async mounted() {
		await this.getController();
		this.setTitle(`Edit ${this.controller.fname + ' ' + this.controller.lname}`);
	},
	methods: {
		async getController() {
			const {data} = await zabApi.get(`/controller/${this.$route.params.cid}`);
			this.controller = data.data;
			this.form = {
				...this.form,
				fname: this.controller.fname,
				lname: this.controller.lname,
				email: this.controller.email,
				oi: this.controller.oi,
				vis: this.controller.vis,
			};

			this.controller.certifications.forEach(cert => this.form.certs[cert.code] = true);
			this.controller.roles.forEach(role => this.form.roles[role.code] = true);
			this.usedOi = (await zabApi.get(`/controller/oi`)).data.data;
		},
		checkOi(e) {
			this.form.oi = e.target.value.toUpperCase();
			this.oiAvail = (this.form.oi !== this.controller.oi && (this.usedOi.includes(this.form.oi) || this.form.oi.length != 2)) ? false : true;
		},
		toggleCert: function(e) {
			e.target.classList.toggle('active');
			this.form.certs[e.target.id] = e.target.classList.contains('active');
		},
		toggleRole: function(e) {
			e.target.classList.toggle('active');
			this.form.roles[e.target.id] = e.target.classList.contains('active');
		},
		toggleVis: function(e) {
			e.target.classList.toggle('active');
			this.form.vis = e.target.classList.contains('active');
		},
		async updateController() {
			try {
				if(!this.oiAvail) {
					this.toastError('Operating initials already in use');
				} else {
					const {data} = await zabApi.put(`/controller/${this.controller.cid}`, {
						form: this.form
					});

					if(data.ret_det.code === 200) {
						this.toastSuccess('Controller updated');
					} else {
						this.toastError(data.ret_det.message);
					}
				}
			} catch(e) {
				console.log(e);
			}
		}
	}
};
</script>

<style scoped lang="scss">
.input_oi input {
	width: calc(100% - 35px);
}

.oi_check {
	margin-top: 20px;
	width: 35px;
	text-align: right;
}

.cert {
	display: inline-block;
	padding: 0.25rem 0.4rem;
	font-size: 0.85rem;
	margin: 2px;
	cursor: pointer;
	transition: background-color .3s ease;
	background: #eaeaea;
	color: $gray_medium;
	user-select: none;

	&.active {
		&.cert_senior {
			background: $cert_senior;
			color: #fff;
		}

		&.cert_junior {
			background: $cert_junior;
			color: #fff;
		}

		&.cert_training {
			background: $cert_training;
			color: #fff;
		}

		&.cert_vis {
			background: $cert_vis;
			color: #fff;
		}

		&.cert_center {
			background-color: $secondary-color-dark;
			color: #fff;
		}

		&.cert_tier-2 {
			background: $primary-color;
			color: #fff;
		}

		&.cert_tier-1 {
			background: $secondary-color;
			color: #fff;
		}

		&.cert_minor {
			background: $secondary-color-light;
			color: #fff;
		}
		&.cert_solom {
			background: #FFE83E;
			color: #2F4F4F;
		}

		&.cert_solon {
			background: #FFA500;
			color: #fff;
		}
	}

}

#certs_container, #roles_container {
	margin-top: 5px;
}

.cert_container {
	margin-bottom: 1.5rem;
}
</style>
