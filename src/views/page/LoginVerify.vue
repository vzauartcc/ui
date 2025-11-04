<template>
	<div class="card home_intro">
		<div class="card-content">
			<span class="processing_login">Processing Login, Please Wait</span>
			<div class="loading_container">
				<Spinner />
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapActions, mapMutations } from 'vuex';
export default {
	name: 'LoginVerify',
	title: 'Verifying Login...',
	methods: {
		...mapMutations('user', ['setLoggedIn']),
		...mapActions('user', ['getUser']),
	},
	async mounted() {
		try {
			await zauApi.post('/user/login', {
				code: this.$route.query.code,
			});

			this.getUser();
		} catch (e) {
			if (e.response) {
				if (e.response.status === 400 && e.response.data.message.includes('[Authorize Data]')) {
					this.toastError('Unable to process login, please authorize all requested VATSIM data.');
				} else {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				}
			} else {
				console.error('error logging in', e);
				this.toastError('Something went wrong, please try again later');
			}
		}
		this.$router.push(localStorage.getItem('redirect') || '/');
	},
};
</script>

<style scoped>
.card-content {
	text-align: center;
}
.processing_login {
	font-weight: 600;
	font-size: 2rem;
}
.progress {
	max-width: 500px;
	margin: 50px auto;
}
</style>
