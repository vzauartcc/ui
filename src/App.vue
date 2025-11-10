<template>
	<router-view v-if="hasQueryCompleted" />
	<div v-else id="loading">
		<div id="loading_box" class="z-depth-3">
			<img src="../src/assets/images/Discord_Logo_Two.png" alt="" />
			<h3>Please Wait...</h3>
			<h5>If stuck loading, please reload the page!</h5>
			<Spinner />
		</div>
	</div>
</template>

<script>
import Spinner from '@/components/Spinner.vue';
import { mapGetters } from 'vuex';

export default {
	components: {
		Spinner,
	},
	computed: {
		...mapGetters('user', ['hasQueryCompleted']),
	},
};
</script>

<style scoped lang="scss">
#loading {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
}

#loading_box {
	text-align: center;
	padding: 3em;

	img {
		height: 100px;
	}
}
</style>
