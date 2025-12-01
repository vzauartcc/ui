<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">General Data Protection Regulation (GDPR)</span>
			<br />
			<span class="card-title">Right to Access</span>
			<div class="loading_container" v-if="!user">
				<Spinner />
			</div>
			<div
				v-else-if="
					submitted ||
					(user.data &&
						user.data.lastGdrpRequest &&
						Date.now() - new Date(user.data.lastGdrpRequest).getTime() < 30 * 24 * 60 * 60 * 1000)
				"
				class="no_request"
			>
				<p>
					You previously submitted a Right to Access request on
					<b>{{ new Date(user.data.lastGdrpRequest).toLocaleDateString() }}</b
					>. You may only submit one request every 30 days.
				</p>
				<br />
				<p>Please check your VATSIM registered email address for your ZAU ARTCC data.</p>
			</div>
			<div v-else class="row row_no_margin">
				<p class="col">
					You may submit a Right to Access request once every 30 days. Please submit your request
					below and we will send you an email with your data within 14 days.
				</p>
				<br />
				<p class="col">
					This Right to Access request will only contain data from the Virtual Chicago ARTCC. Other
					VATSIM affiliated divisions and subdivisions data must be requested from those
					divisions/subdivisions directly.
				</p>
				<br />
				<a
					href="#!"
					class="waves-effect waves-light btn col right submit_btn"
					@click.prevent="requestGdrpData"
					:class="{ disabled: spinners.length > 0 }"
					><span v-if="spinners.some((s) => s === 'update')"> <SmallSpinner /> </span>Submit Right
					to Access Request</a
				>
				<br />
			</div>
			<br />
			<hr />
			<br />
			<span class="card-title">Right to Erasure</span>
			<div class="row row_no_margin">
				<p class="col">
					Right to Erasure requests cannot be submitted to Virtual Chicago ARTCC directly. Please
					refer to the VATSIM Data Protection and Handling Policy for more information on how to
					submit a Right to Erasure request. Once VATSIM has processed your request, they will
					notify us to complete your request.
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	data() {
		return {
			spinners: [],
			submitted: false,
		};
	},
	async mounted() {},
	methods: {
		async requestGdrpData() {
			try {
				this.spinners.push('update');
				await zauApi.post('/user/gdrp/request');

				this.toastSuccess('Request submitted.');
				this.submitted = true;
				this.user.data.lastGdrpRequest = new Date();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error submitting request', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'update');
			}
		},
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.submit_btn {
	margin-right: 1rem;
}
</style>
