<template>
  <div>
    <RequestingTraining />
    <InTraining />
    <!--<InCooldown />-->
    <!--<NotTraining />-->
  </div>
</template>

<script>
import RequestingTraining from './cards/requestingTraining.vue';
import InTraining from './cards/inTraining.vue';
import InCooldown from './cards/inCooldown.vue';
import NotTraining from './cards/notTraining.vue';
import { mapState, mapActions } from 'vuex';

//IDK if I need this.
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
const endDate = document.getElementById('end_date');

export default {
  name: 'Trainees',
	title: 'Trainees',
  components: {
    RequestingTraining,
    InTraining,
    InCooldown,
    NotTraining
  },
  computed: {
		...mapState('user', [
			'user'
		]),
  },
  methods: {
    ...mapActions('trainee', [
      'fetchTrainingProgress',
      'fetchActiveControllers', // Add this line to map the action
      'fetchTrainingModules',
    ]),
  },
  created() {
    // Dispatch the action to fetch training progress when the component is created
    this.fetchTrainingProgress();
    this.fetchActiveControllers();
    this.fetchTrainingModules();
  }
};
</script>

<style scoped lang="scss">
.table_wrapper {
	width: 100%;
	overflow: auto;
}

.input-field {
	margin-top: 0;
}

.name {
	color: $primary-color;

	font-weight: 700;
}
.rating {
	font-weight: 400;
}

table tbody {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

.type_trainer {
	vertical-align: top;
	margin-top: .4em;
}
</style>
