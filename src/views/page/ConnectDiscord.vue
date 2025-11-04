<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Linking Discord...</span>
			<div>
				<Spinner />
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { mapState } from 'vuex';

export default {
	name: 'ConnectDiscord',
	title: 'Linking Discord...',
	async mounted() {
		try {
			await zauApi.post('/discord/info', {
				cid: this.user.data.cid,
				code: this.$route.query.code,
			});

			this.toastSuccess('Discord account linked');

			if (this.user.data.isMem) {
				this.$router.push('/dash');
			} else {
				this.$router.push('/');
			}
		} catch (e) {
			if (e.response) {
				this.toastError(e.response.data.message || 'Something went wrong, please try again later');
			} else {
				console.error('error linking discord', e);
				this.toastError('Something went wrong, please try again later');
			}
		}
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.success_message h4 {
	color: $accent-color;
}
</style>
