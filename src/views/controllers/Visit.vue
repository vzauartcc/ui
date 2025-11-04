<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Become a Visitor</span>
			<p v-if="!user.isLoggedIn">
				Thank you for your interest in visiting the Chicago ARTCC. To apply for visiting status,
				click the button below to login and continue.<br />
			</p>
			<p>
				<b class="red-text">Important: </b>Please ensure that you meet all requirements to become a
				visitor, as outlined in
				<a
					href="https://vatusa-storage.nyc3.cdn.digitaloceanspaces.com/docs/general-division-policy.pdf"
					><b>VATUSA DP001, Chapter 14</b></a
				>. Any application that does not meet the requirements will be rejected.
			</p>
			<div v-if="!user.isLoggedIn">
				<button class="btn btn-waves login_button" @click="login">Login with VATSIM</button>
			</div>
			<div v-else-if="pendingApplication">
				<p>
					<br />We have received your visiting application successfully! Our staff team will review
					your application as soon as possible. In the meantime, if you have any questions or
					concerns, please don't hesitate to
					<a class="mailto_link" href="mailto:datm@zauartcc.org">let the DATM know.</a>
				</p>
			</div>
			<div v-else-if="!checks.visiting">
				<br /><br />
				<p>
					You do not meet VATUSA's requirements to become a visiting controller. Once you have met
					the requirements, please come back to complete your visiting application.
				</p>
				<br />
				<p>Requirements not met: {{ this.whyNot.join(', ') }}.</p>
				<br />
			</div>
			<div v-else>
				<br />
				<div v-if="!user.data.isMem">
					<div class="row row_no_margin" v-if="user.data">
						<div class="input-field col s12 m6">
							<input id="fname" type="text" :value="user.data.fname" disabled required />
							<label for="fname" class="active">First Name</label>
						</div>
						<div class="input-field col s12 m6">
							<input id="lname" type="text" :value="user.data.lname" disabled required />
							<label for="lname" class="active">Last Name</label>
						</div>
						<div class="input-field col s12 m6">
							<input id="cid" type="text" :value="user.data.cid" disabled required />
							<label for="cid" class="active">Controller ID</label>
						</div>
						<div class="input-field col s12 m6">
							<input id="rating" type="text" :value="user.data.ratingLong" disabled required />
							<label for="rating" class="active">Rating</label>
						</div>
						<div class="input-field col s12 m6">
							<input
								id="email"
								type="email"
								:value="user.data.email"
								ref="email"
								class="validate"
								required
							/>
							<label for="email" class="active">Email</label>
						</div>
						<div class="input-field col s12 m6">
							<input id="home" type="text" v-model="form.facility" class="validate" required />
							<label for="home">Home ARTCC/FIR</label>
						</div>
						<div class="input-field col s12">
							<label for="reason">Why would you like to visit ZAU?</label>
							<textarea
								id="reason"
								class="materialize-textarea validate"
								v-model="form.reason"
								required
							></textarea>
						</div>
						<div class="input-field col s12">
							<button
								type="submit"
								class="btn right"
								@click.prevent="submitApplication"
								ref="submitButton"
								:disabled="spinners.length > 0"
							>
								<span v-if="spinners.some((s) => s === 'submit')"> <SmallSpinner /> </span>
								Submit
							</button>
						</div>
					</div>
				</div>
				<div v-else>
					<p>You cannot apply to become a visitor since you're already a member of ZAU.</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';
import { vatsimAuthRedirectUrl } from '@/helpers/uriHelper.js';
import { mapState } from 'vuex';
export default {
	name: 'VisitorApply',
	title: 'Become A Visitor',
	data() {
		return {
			spinners: [],
			pendingApplication: false,
			checks: {},
			whyNot: ['calculating, , , '],
			form: {
				facility: null,
				reason: null,
			},
		};
	},
	async mounted() {
		await this.checkOpenApplications();
	},
	methods: {
		async login() {
			localStorage.setItem('redirect', this.$route.path);
			window.location.href = vatsimAuthRedirectUrl;
		},
		async checkOpenApplications() {
			try {
				const { data: statusData } = await zauApi.get('/controller/visit/status');
				this.pendingApplication = !!statusData.count;
				this.checks = statusData.status;

				this.whyNot = [];
				if (!this.checks.hasHome) {
					this.whyNot.push('no home facility');
				}
				if (!this.checks.needsBasic) {
					this.whyNot.push('need basic training');
				}
				if (!this.checks.hasRating) {
					this.whyNot.push('rating less than S3');
				}
				if (!this.checks.promo) {
					this.whyNot.push(`recently promoted (${this.checks.promoDays || 'Unknown'} days ago)`);
				}
				if (!this.checks.ratingConsolidation) {
					this.whyNot.push(
						`rating hours less than 50 (${this.checks.ratingHours || 'Unknown'} hours)`,
					);
				}
				if (!this.checks.recentlyRostered) {
					this.whyNot.push(
						`added to a roster in the past 60 days (${this.checks.visitingDays || 'Unknown'} days ago)`,
					);
				}
			} catch (e) {
				console.error('error checking applications', e);
				this.toastError('Something went wrong, please try again later');

				this.checks = {
					visiting: false,
				};
				this.whyNot = [];
				this.whyNot.push('an error occurred');
			}
		},
		async submitApplication() {
			try {
				this.spinners.push('submit');
				await zauApi.post('/controller/visit', {
					...this.form,
					email: this.$refs.email.value,
				});

				this.toastSuccess('Visitor application submitted');
				this.$router.push('/');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error submitting application', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'submit');
			}
		},
	},
	computed: {
		...mapState('user', ['user']),
	},
};
</script>

<style scoped lang="scss">
.login_button {
	margin: 1em auto;
	display: block;
	width: 200px;
}

.mailto_link {
	font-weight: 600;
}
</style>
