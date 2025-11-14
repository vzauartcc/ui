<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Edit Controller Profile</span>
			<form class="row row_no_margin user_info" @submit.prevent="updateProfile">
				<div class="input-field col s12">
					<textarea
						id="bio"
						class="materialize-textarea"
						data-length="2000"
						v-model="form.bio"
					></textarea>
					<label for="bio" class="active">Biography</label>
				</div>
				<div class="input-field col s12">
					<button type="submit" class="btn right" :disabled="spinners.length > 0">
						<span v-if="spinners.some((s) => s !== 'update')"> <SmallSpinner /> </span>Update
					</button>
				</div>
			</form>
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
			form: {
				bio: '',
			},
		};
	},
	async mounted() {
		this.form.bio = this.user.data.bio || '';
		this.$nextTick(() => {
			M.textareaAutoResize(document.querySelector('textarea'));
			M.CharacterCounter.init(document.querySelector('textarea'));
			M.updateTextFields();
		});
	},
	methods: {
		async updateProfile() {
			try {
				this.spinners.push('update');
				await zauApi.patch('/user/profile', this.form);

				this.toastSuccess('Profile successfully updated');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error updating profile', e);
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
.user_info {
	margin-top: 1em;
}
</style>
