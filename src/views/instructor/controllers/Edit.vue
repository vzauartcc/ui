<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title"
				>Edit Controller
				{{
					controller !== null
						? ` – ${controller.fname}
				${controller.lname}`
						: ''
				}}</span
			>
			<div class="loading_container" v-if="controller === null">
				<Spinner />
			</div>
			<form id="update_controller" @submit.prevent="updateController" v-else>
				<div class="row row_no_margin">
					<div class="input-field col s6">
						<input id="first_name" type="text" :value="form.fname" disabled />
						<label for="first_name" class="active">First Name</label>
					</div>
					<div class="input-field col s6">
						<input id="last_name" type="text" :value="form.lname" disabled />
						<label for="last_name" class="active">Last Name</label>
					</div>
					<div class="input-field col s6">
						<input id="cid" type="text" :value="controller.cid" disabled />
						<label for="cid" class="active">CID</label>
					</div>
					<div class="input-field col s6">
						<input id="rating" type="text" :value="controller.ratingLong" disabled />
						<label for="rating" class="active">Rating</label>
					</div>
					<div class="input-field col s6">
						<input id="oi" type="text" :value="form.oi" maxlength="2" disabled />
						<label for="oi" class="active">Operating Initials</label>
					</div>
					<div class="input-field col s12">
						<div id="certs_container">
							<label for="minor_certs_container" class="active">Unrestricted Positions:</label>
							<div id="minor_certs_container" class="cert_container">
								<span
									v-for="cert in allCerts.filter((x) => x.class === 'non-tier')"
									:key="cert.code"
									class="cert cert_minor"
									:class="[{ active: form.certs[cert.code] === true }, `cert_${cert.class}`]"
									@click="toggleCert"
									:id="cert.code"
									>{{ cert.name }}
								</span>
							</div>
							<label for="chicago_certs_container" class="active">Tier 2 Endorsements:</label>
							<div id="chicago_certs_container" class="cert_container">
								<span
									v-for="cert in allCerts.filter((x) => x.class === 'tier-2')"
									:key="cert.code"
									class="cert cert_tier-2"
									:class="[{ active: form.certs[cert.code] === true }, `cert_${cert.class}`]"
									@click="toggleCert"
									:id="cert.code"
									>{{ cert.name }}
								</span>
							</div>
							<label for="chicago_certs_container" class="active">Tier 1 Endorsements:</label>
							<div id="chicago_certs_container" class="cert_container">
								<span
									v-for="cert in allCerts.filter((x) => x.class === 'tier-1')"
									:key="cert.code"
									class="cert cert_tier-1"
									:class="[{ active: form.certs[cert.code] === true }, `cert_${cert.class}`]"
									@click="toggleCert"
									:id="cert.code"
									>{{ cert.name }}
								</span>
							</div>
							<label for="event_certs_container" class="active">Event Endorsements:</label>
							<div id="event_certs_container" class="cert_container">
								<span
									v-for="cert in allCerts.filter((x) => x.class.includes('event'))"
									:key="cert.code"
									class="cert"
									:class="[{ active: form.certs[cert.code] === true }, `cert_${cert.class}`]"
									@click="toggleCert"
									:id="cert.code"
									>{{ cert.name }}
								</span>
							</div>
							<hr />
							<label for="solo_certs_container" class="active">Solo Endorsements:</label>
							<div id="solo_certs_container" class="cert_container">
								<span
									v-for="cert in allCerts.filter((x) => x.class.includes('solo'))"
									:key="cert.code"
									class="cert"
									:class="[{ active: form.certs[cert.code] === true }, `cert_${cert.class}`]"
									@click="toggleCert"
									:id="cert.code"
									>{{ cert.name }}
								</span>
							</div>
						</div>
					</div>
					<div class="input-field col s12">
						<button type="submit" class="btn right" :disabled="spinners.length > 0">
							<span v-if="spinners.some((s) => s !== 'submit')"> <SmallSpinner /> </span>Update
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	data() {
		return {
			spinners: [],
			controller: null,
			usedOi: [],
			oi: '',
			oiAvail: true,
			allCerts: [],
			form: {
				fname: '',
				lname: '',
				email: '',
				oi: '',
				vis: false,
				certs: {},
				roles: {
					atm: false,
					datm: false,
					ta: false,
					ec: false,
					fe: false,
					wm: false,
					ins: false,
					mtr: false,
				},
			},
		};
	},
	async mounted() {
		await this.getCertifications();
		await this.getController();
		this.setTitle(`Edit ${this.controller.fname + ' ' + this.controller.lname}`);
	},
	methods: {
		async getCertifications() {
			try {
				const { data } = await zauApi.get('/controller/certifications');
				this.allCerts = data.sort((a, b) => a.order - b.order);
				data.forEach((r) => {
					this.form.roles[r.code] = false;
				});
			} catch (e) {
				console.error('error getting certifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getController() {
			try {
				const { data } = await zauApi.get(`/controller/${this.$route.params.cid}`);
				this.controller = data;
				this.form = {
					...this.form,
					fname: this.controller.fname,
					lname: this.controller.lname,
					email: this.controller.email,
					oi: this.controller.oi,
					vis: this.controller.vis,
				};

				this.controller.certifications.forEach((cert) => (this.form.certs[cert.code] = true));
				this.controller.roles.forEach((role) => (this.form.roles[role.code] = true));
				try {
					const { data: ois } = await zauApi.get('/controller/oi');
					this.usedOi = ois;
				} catch (e) {
					console.error('error getting used operating initials', e);
					this.toastError('Something went wrong, please try again later');
				}
			} catch (e) {
				console.error('error getting controller', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		toggleCert: function (e) {
			e.target.classList.toggle('active');
			this.form.certs[e.target.id] = e.target.classList.contains('active');
		},
		async updateController() {
			try {
				this.spinners.push('update');
				await zauApi.put(`/controller/${this.controller.cid}`, {
					form: this.form,
				});

				this.toastSuccess('Controller updated');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error updating controller', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'update');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.input_oi input {
	width: 85%;
}

.side_oi {
	margin-top: 20px;
	width: 15%;
	text-align: center;
}

.cert {
	display: inline-block;
	padding: 0.25rem 0.4rem;
	font-size: 0.85rem;
	margin: 2px;
	transition: background-color 0.3s ease;
	background: #eaeaea;
	color: $gray_medium;
	user-select: none;
	cursor: pointer;

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

		&.cert_tier-1 {
			background: $secondary-color;
			color: #fff;
		}

		&.cert_tier-2 {
			background: $primary-color;
			color: #fff;
		}

		&.cert_minor {
			background: $secondary-color-light;
			color: #fff;
		}

		&.cert_solom {
			background: #ffe83e;
			color: #2f4f4f;
		}

		&.cert_solon {
			background: #ffa500;
			color: #fff;
		}

		&.cert_evento {
			background-color: $secondary-color-light;
			color: #fff;
		}

		&.cert_eventa {
			background-color: $secondary-color-light;
			color: #fff;
		}

		&.cert_eventc {
			background-color: $secondary-color-light;
			color: #fff;
		}
	}
}

.cert_container {
	margin-bottom: 1.5rem;
}
</style>
