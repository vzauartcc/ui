<template>
	<div>
		<div class="card home_intro">
			<div class="card-content">
				<span class="card-title">Welcome to Chicago ARTCC</span>
				<p>
					Virtual Chicago ARTCC provides air traffic control services for the Chicago Metro area,
					Northwestern Indiana, Central Illinois, Eastern Iowa, Southern Wisconsin, and Southwestern
					Michgan. Our goal is to provide the most realistic experience to our pilots, while
					maintaining professionalism and courtesy. Chicago offers a wealth of difference for new
					controllers, and will proivde a good challenge for any aspiring controllers. Join our
					family today!
				</p>
				<div class="visit" v-if="!user.isLoggedIn || (!user.data.vis && !user.data.isMember)">
					<p>If you would like to become a visitor, please click the button below.</p>
					<router-link to="/controllers/visit" class="btn btn-waves">Become a Visitor</router-link>
				</div>
			</div>
		</div>
		<EventSummary />
		<NewsSummary />
		<WeatherInfo />
	</div>
</template>

<script>
import { mapState } from 'vuex';
import EventSummary from '../partial/EventSummary.vue';
import NewsSummary from '../partial/NewsSummary.vue';
import WeatherInfo from '../partial/WeatherInfo.vue';

export default {
	name: 'Home',
	title: 'Home',
	components: {
		NewsSummary,
		WeatherInfo,
		EventSummary,
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.visit {
	margin-top: 1em;
	text-align: center;

	p {
		text-align: left;
	}

	.btn {
		margin-top: 1em;
	}
}
</style>
