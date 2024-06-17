<template>
	<div class="ta_sidebar card">
		<div class="collection">
			<router-link to="/ta/dashboard" class="collection-item">
				TA Dashboard
				<div class="secondary-content"><i class="material-icons">dashboard</i></div>
			</router-link>
			<router-link to="/ta/trainees" class="collection-item">
				Manage Trainees
				<div class="secondary-content"><i class="material-icons">school</i></div>
			</router-link>
			<router-link to="/ta/trainers" class="collection-item">
				Manage Trainers
				<div class="secondary-content"><i class="material-icons">people</i></div>
			</router-link>
			<router-link to="/ta/training-assignments" class="collection-item">
				Training Assignments
				<div class="secondary-content"><i class="material-icons">assignment_ind</i></div>
			</router-link>
			<router-link to="/ta/module-management" class="collection-item">
				Module Management
				<div class="secondary-content"><i class="material-icons">library_books</i></div>
			</router-link>
			<router-link to="/ta/exam-management" class="collection-item">
				Exam Management
				<div class="secondary-content"><i class="material-icons">edit</i></div>
			</router-link>
			<router-link to="/ta/reports" class="collection-item">
				Training Reports
				<div class="secondary-content"><i class="material-icons">bar_chart</i></div>
			</router-link>
			<router-link to="/ta/feedback" class="collection-item">
				Training Feedback
				<div class="secondary-content"><i class="material-icons">feedback</i></div>
			</router-link>
			<router-link to="/ta/training-settings" class="collection-item">
				Training Settings
				<div class="secondary-content"><i class="material-icons">settings</i></div>
			</router-link>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
	methods: {
		requiresAuth(roles) {
			const havePermissions = roles.some(r => this.user.data.roleCodes.includes(r));
			if(havePermissions) {
				return true;
			} else {
				return false;
			}
		}
	},
	computed: {
		...mapState('user', [
			'user'
		])
	}
};
</script>

<style scoped lang="scss">
.card.ta_sidebar {
	// position: absolute;
	// top: 0;
	// left: 0;
	// width: 350px;
	// height: 100%;
	// background: $primary-color;
	// color: #fff;
	padding: 0;
}

.collection {
	border: none;
	margin: 0;
	border-radius: 0;

	.collection-header {
		padding: 10px 20px;
		margin: 0;
		font-weight: 700;
		border-bottom: 1px solid #e0e0e0;
		color: $primary-color;
	}

	.collection-item {
		color: $primary-color;

		.secondary-content {
			color: $primary-color;
		}

		i {
			margin-right: 10px;
		}

		&:not(.active):hover {
			background-color: $primary-color;
			color: #fff;

			.secondary-content {
				color: #fff;
			}
		}
	}
}
</style>