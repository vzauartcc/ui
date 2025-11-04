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
			const { data } = await zauApi.post('/discord/info', {
				cid: this.user.data.cid,
				code: this.$route.query.code,
			});

			if (data.ret_det.code === 200) {
				this.toastSuccess('Discord account linked');
			} else {
				this.toastError(data.ret_det.message);
			}

			if (this.user.data.isMem) {
				this.$router.push('/dash');
			} else {
				this.$router.push('/');
			}
		} catch (e) {
			console.error('error linking discord', e);
			this.toastError('Something went wrong, please try again later');
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
