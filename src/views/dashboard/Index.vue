<template>
	<div class="card home_intro">
		<div class="card-content">
			<span class="card-title">Controller Dashboard</span>
			<div class="loading_container" v-if="!activityData">
				<Spinner />
			</div>
			<div v-else>
				<div class="hours_info">
					<span v-if="user.data.rating === 1"
						>You have observed for
						<b :class="colorCalc(this.activityData.requirements.observer.seconds)">{{
							hoursCalc
						}}</b>
						and completed
						<b :class="colorSessions(this.activityData.requirements.observer.trainingSessions)">{{
							this.activityData.trainings.length
						}}</b>
						training sessions this {{ this.activityData.period.unit }}.
						<span
							v-if="
								this.calcSeconds >= this.activityData.requirements.observer.seconds ||
								this.activityData.trainings.length >=
									this.activityData.requirements.observer.trainingSessions
							"
							>You have met the observer activity requirements for this
							{{ this.activityData.period.unit }}.</span
						>
						<span v-else
							>You need to observe for <b>{{ calcControlTime }}</b> or complete
							<b>{{
								this.activityData.requirements.observer.trainingSessions -
								this.activityData.trainings.length
							}}</b>
							more training sessions by
							<b>{{ new Date(this.activityData.period.endOfCurrent).toLocaleDateString() }}</b> to
							prevent removal from the roster.</span
						>
					</span>
					<span v-else>
						You have controlled for
						<b :class="colorCalc(this.activityData.requirements.controller.seconds)">{{
							hoursCalc
						}}</b>
						this {{ this.activityData.period.unit }}.
						<span v-if="isActive">
							You are <b>Exempt</b> from hourly activity requirements at this time.
						</span>
						<span v-if="isActive !== true">
							<span v-if="this.calcSeconds >= this.activityData.requirements.controller.seconds"
								>You have met the activity requirements for this
								{{ this.activityData.period.unit }}.
							</span>
							<span v-else>
								You need to control <b>{{ calcControlTime }}</b> by
								<b>{{ new Date(this.activityData.period.endOfCurrent).toLocaleDateString() }}</b> to
								prevent removal from the roster.
							</span>
						</span>
					</span>
				</div>
				<br />
				<span class="section_title"> External Integrations </span>
				<div class="discord_connect">
					<template v-if="discordConnected === false">
						<a href="/login/discord" target="_blank" rel="noreferrer noopener">
							<button class="btn waves-effect waves-light" type="submit" name="action">
								Link Discord
								<i class="material-icons right">discord</i>
							</button>
						</a>
					</template>
					<template v-else>
						<a href="https://vats.im/zau" target="_blank" rel="noreferrer noopener">
							<button
								class="btn waves-effect waves-light"
								type="submit"
								name="action"
								style="background-color: #a55eea"
							>
								Join Discord
								<i class="material-icons right">discord</i>
							</button>
						</a>
						<span style="margin-left: 10px"></span>
						<a target="_blank" rel="noreferrer noopener">
							<button
								class="btn waves-effect waves-light"
								type="submit"
								name="action"
								@click="unlinkDiscord()"
								style="background-color: #e4002b"
								:disabled="spinners.length > 0"
							>
								<span v-if="spinners.some((s) => s === 'unlink')"> <SmallSpinner /> </span>Unlink
								Discord
								<i class="material-icons right">discord</i>
							</button>
						</a>
					</template>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="card-content">
			<span class="card-title">Recent Connections</span>
		</div>
		<div class="loading_container" v-if="!activityData">
			<Spinner />
		</div>
		<p
			v-else-if="activityData && activityData.sessions && activityData.sessions.length === 0"
			class="no_sessions"
		>
			There are no recent connections to display
		</p>
		<div class="table_wrapper" v-else>
			<table class="medium hover striped">
				<thead>
					<tr>
						<th>Position</th>
						<th>Sign On</th>
						<th>Sign Off</th>
						<th>Length</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="session in activityData.sessions" :key="session.timeStart">
						<td>{{ session.position }}</td>
						<td>{{ dtLong(session.timeStart) }}</td>
						<td>{{ dtLong(session.timeEnd) }}</td>
						<td>
							{{
								sec2hms(
									(new Date(session.timeEnd).getTime() - new Date(session.timeStart).getTime()) /
										1000,
								)
							}}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<StaffingRequest />
</template>
<script>
import { zauApi } from '@/helpers/axios.js';
import { mapActions, mapState } from 'vuex';
import StaffingRequest from './StaffingRequest.vue';
export default {
	name: 'UserDash',
	title: 'Dashboard',
	data() {
		return {
			spinners: [],
			token: '',
			discordConnected: false,
			activityData: null,
		};
	},
	components: {
		StaffingRequest,
	},
	async mounted() {
		this.token = this.user.data.idsToken || 'None Set';
		await this.getDiscordStatus();
		await this.getControllingSessions();
	},
	methods: {
		async generateToken() {
			try {
				this.spinners.push('generate');
				const { data: tokenRet } = await zauApi.post('/user/idsToken');

				this.toastSuccess('Token successfully generated');
				this.token = tokenRet;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error generating token', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'generate');
			}
		},
		async getDiscordStatus() {
			try {
				const { data: discordData } = await zauApi.get('/discord/user');
				this.discordConnected = discordData;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}
				console.error('error getting discord status', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getControllingSessions() {
			try {
				const { data: sessionData } = await zauApi.get('/user/sessions');
				this.activityData = sessionData;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting sessions', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		showToken() {
			document.getElementById('token_wrap').classList.remove('hidden');
			document.getElementById('click_to_see').classList.add('hidden');
		},
		hideToken() {
			document.getElementById('token_wrap').classList.add('hidden');
			document.getElementById('click_to_see').classList.remove('hidden');
		},
		linkDiscord() {
			this.$router.push('/login/discord');
		},
		async unlinkDiscord() {
			try {
				this.spinners.push('unlink');
				await zauApi.delete('/discord/user');

				this.toastSuccess('Discord unlinked.');
				setTimeout(() => {
					this.getDiscordStatus();
				}, 500);
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
				} else {
					console.error('error unlinking discord', e);
					this.toastError('Something went wrong, please try again later');
				}
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'unlink');
			}
		},
		sec2hms(secs) {
			const days = Math.floor(secs / 86400);
			const remainderSeconds = secs % 86400;
			const hms = new Date(remainderSeconds * 1000).toISOString().substring(11, 19);
			return hms.replace(/^(\d+)/, (h) => `${+h + days * 24}`.padStart(2, '0'));
		},
		formatDate(value) {
			const d = new Date(value);
			return d.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC',
			});
		},
		colorCalc(secs) {
			if (this.calcSeconds >= secs) {
				return 'hours-green';
			}

			return 'hours-red';
		},
		colorSessions(sessions) {
			if (this.activityData.trainings.length >= sessions) {
				return 'hours-green';
			}

			return 'hours-red';
		},
		...mapActions('user', ['getUser']),
	},
	computed: {
		...mapState('user', ['user']),
		calcControlTime() {
			const requirement =
				this.user.data.rating === 1
					? this.activityData.requirements.observer.seconds
					: this.activityData.requirements.controller.seconds;
			return this.sec2hms(requirement - this.calcSeconds);
		},
		calcSeconds() {
			let seconds = 0;
			for (const session of this.activityData.sessions) {
				const newSeconds = (new Date(session.timeEnd) - new Date(session.timeStart)) / 1000;
				seconds += newSeconds;
			}
			return seconds;
		},
		hoursCalc() {
			return this.sec2hms(this.calcSeconds);
		},
		isActive() {
			const today = new Date();
			let isActive = false;

			for (const absence of this.user.data.absence) {
				const expirationDate = new Date(absence.expirationDate);
				const isDeleted = absence.deleted !== false;

				if (!isDeleted && expirationDate >= today) {
					isActive = true;
					break;
				}
			}
			return isActive;
		},
	},
};
</script>

<style scoped lang="scss">
#token_wrap {
	background: $gray_light;
	padding: 0.25em 0.5em 0.35em 0.5em;
	border-radius: 2px;
	height: 32px;
	width: 100%;
	max-width: 400px;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

	&.hidden {
		code,
		.generate {
			display: none;

			i {
				display: none;
			}
		}
	}
	code {
		display: inline-block;
		border-radius: 0;
		padding-top: 0.1em;
		white-space: nowrap;
		overflow: auto;
		width: 90%;
	}

	.generate {
		border-radius: 0;
		width: 10%;
		text-align: right;

		i {
			font-size: 18px;
			margin-left: 0.25em;
			margin-top: 0.2em;
			vertical-align: top;
			user-select: none;
			cursor: pointer;
		}
	}
}

.section_title {
	user-select: none;
	color: #9e9e9e;
	font-size: 0.9rem;
	display: inline-block;

	& ~ .section_title {
		margin-top: 2em;
	}
}

#click_to_see {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	text-align: center;
	cursor: pointer;
	user-select: none;
	display: flex;
	align-items: center;
	justify-content: center;

	&.hidden {
		display: none;
	}
}

.discord_title {
	font-size: 0.85rem;

	&.connect {
		color: $accent-color;
	}
}

.discord_connect {
	.btn {
		padding-left: 2.5em;
	}

	.discord_logo {
		position: absolute;
		left: 0;
		margin-left: 6px;
		margin-top: 7px;
	}
}

.table_wrapper {
	overflow: auto;

	table {
		min-width: 100%;
	}
}

.no_sessions {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.hours-red {
	color: red;
}
.hours-green {
	color: green;
}
</style>
