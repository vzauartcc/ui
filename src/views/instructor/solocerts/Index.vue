<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Solo Endorsements</span></div>
				<div class="col s4">
					<router-link to="/ins/solo/new">
						<span class="btn waves-effect waves-light right">New</span></router-link
					>
				</div>
			</div>
			<div>
				<p class="no_certs" v-if="loading === false && certs.length === 0">
					There are no solo endorsements on record for ZAU with VATUSA.
				</p>
			</div>
		</div>
		<div class="loading_container" v-if="loading">
			<Spinner />
		</div>
		<div class="certs_wrapper" v-if="certs.length > 0">
			<table class="certs_list striped compact">
				<thead class="certs_list_head">
					<tr>
						<th>Controller</th>
						<th>Instructor</th>
						<th>Position</th>
						<th>Expires</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="certs_list_row">
					<tr
						v-for="cert in certs"
						:key="cert.id"
						:class="{ 'flash-date': isDateNextWeek(cert.expires) }"
					>
						<td>
							<router-link :to="`/controllers/${cert.studentCid}`" class="controller_link">{{
								getName(cert.student)
							}}</router-link>
						</td>
						<td>
							<router-link :to="`/controllers/${cert.instructorCid}`" class="controller_link">{{
								getName(cert.instructor)
							}}</router-link>
						</td>
						<td>{{ cert.position }}</td>
						<td :class="{ 'expired-date': isExpired(cert.expires) }">
							{{ new Date(cert.expires).toLocaleDateString() }}
						</td>
						<td class="options">
							<a
								href="#"
								@click.prevent="openModal(cert.cid)"
								data-position="top"
								data-tooltip="Delete Solo Endorsement"
								class="tooltipped"
							>
								<i class="material-icons red-text text-darken-2" @click.prevent>delete</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="certs_wrapper old_certs" v-if="old.length > 0">
			<hr />
			<div class="card-title col s8"><span class="card-title">Expired Solo Endorsements</span></div>
			<table class="certs_list striped compact">
				<thead class="certs_list_head">
					<tr>
						<th>Controller</th>
						<th>Instructor</th>
						<th>Position</th>
						<th>Expires</th>
						<th class="options">
							&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;
							&nbsp;&nbsp;&nbsp;
						</th>
					</tr>
				</thead>
				<tbody class="certs_list_row">
					<tr v-for="cert in old" :key="cert.id">
						<td>
							<router-link :to="`/controllers/${cert.studentCid}`" class="controller_link">{{
								getName(cert.student)
							}}</router-link>
						</td>
						<td>
							<router-link :to="`/controllers/${cert.instructorCid}`" class="controller_link">{{
								getName(cert.instructor)
							}}</router-link>
						</td>
						<td>{{ cert.position }}</td>
						<td>
							{{ new Date(cert.expires).toLocaleDateString() }}
						</td>
						<td class="options"></td>
					</tr>
				</tbody>
			</table>
		</div>
		<teleport to="body">
			<div v-for="cert in certs" :key="`modal_delete_${cert.cid}`">
				<div :id="`modal_delete_${cert.cid}`" class="modal modal_delete">
					<div class="modal-content">
						<h4>Delete Solo Endorsement?</h4>
						<p>This will remove the Solo Endorsement from VATUSA.</p>
					</div>
					<div class="modal-footer">
						<a
							href="#"
							@click.prevent="deleteCert(cert._id)"
							class="btn waves-effect modal-close"
							:class="{ disabled: spinners.length > 0 }"
						>
							<span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>
							Delete</a
						>
						<a href="#" class="btn-flat waves-effect modal-close" @click.prevent>Cancel</a>
					</div>
				</div>
			</div>
		</teleport>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'SoloCerts',
	title: 'Solo Endorsements',
	data() {
		return {
			spinners: [],
			positions: ['ORD', 'CHI', 'MKE', 'MDW', 'FWA', 'RFD', 'MLI'],
			certs: [],
			old: [],
			loading: true,
		};
	},
	async mounted() {
		await this.getSoloCerts();
		this.loading = false;
		this.initModals(); // Initialize modals after data is loaded
	},
	methods: {
		async getSoloCerts() {
			try {
				const { data } = await zauApi.get('/training/solo');
				this.certs =
					data.filter((c) => new Date(c.expires).getTime() >= new Date().setHours(0, 0, 0, 0)) ||
					[];
				this.old =
					data.filter((c) => new Date(c.expires).getTime() < new Date().setHours(0, 0, 0, 0)) || [];
			} catch (e) {
				console.error('error getting solo certs', e);
				this.toastError(`Error fetching solo endorsements: ${e.message ? e.message : e}`);
			}
		},
		async deleteCert(id) {
			try {
				this.spinners.push('delete');

				await zauApi.delete(`/training/solo/${id}`);

				this.certs = [];
				await this.getSoloCerts();

				this.$nextTick(() => {
					M.Modal.getInstance(document.querySelector('.modal_delete')).close();
				});
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error deleting cert', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
		getName(user) {
			if (user && user.fname && user.lname) {
				return `${user.fname} ${user.lname}`;
			} else {
				return 'Unknown';
			}
		},
		isDateNextWeek(date) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const nextWeek = new Date();
			nextWeek.setDate(today.getDate() + 7);

			const itemDate = new Date(date);
			itemDate.setHours(0, 0, 0, 0);

			return itemDate >= today && itemDate <= nextWeek;
		},
		isExpired(date) {
			const itemDate = new Date(date);
			itemDate.setHours(0, 0, 0, 0);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			return itemDate < today;
		},
		openModal(cid) {
			this.$nextTick(() => {
				const modal = document.getElementById(`modal_delete_${cid}`);
				if (modal) {
					M.Modal.init(modal, { preventScrolling: false }).open();
				}
			});
		},
		initModals() {
			this.$nextTick(() => {
				const modals = document.querySelectorAll('.modal');
				M.Modal.init(modals, { preventScrolling: false });
			});
		},
	},
};
</script>

<style scoped lang="scss">
table tbody {
	tr {
		transition: background-color 0.3s ease;

		&:hover {
			background: #eaeaea;
		}
	}
}

.no_certs {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.controller_link {
	font-weight: 700;
	color: $primary-color;

	&:hover {
		color: $primary-color-light;
	}
}

.modal_delete {
	min-width: 400px;
	width: 30%;
}

.old_certs {
	margin-top: 2rem;
}

@keyframes flash {
	0%,
	100% {
		background-color: unset;
	}
	50% {
		background-color: #ffeb3b;
	}
}

.flash-date {
	animation: 2s infinite alternate ease-in-out flash;
	position: relative;
}
.expired-date {
	color: red;
}
</style>
