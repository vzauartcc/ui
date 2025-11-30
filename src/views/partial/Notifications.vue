<template>
	<div class="notif_container">
		<div class="loading_container" v-if="!notifications">
			<Spinner />
		</div>
		<span class="no_notif" v-else-if="notifications.length === 0"
			>You have no new notifications</span
		>
		<div v-else>
			<div
				class="notif"
				v-for="notification in notifications"
				:key="notification._id"
				@click="redirectTo(notification.link, notification._id)"
			>
				<div class="notif_unread" v-if="notification.read === false"></div>
				<div :class="`notif_title ${notification.read ? '' : 'unread'}`">
					{{ notification.title }}
					<i class="material-icons notif_link" v-if="notification.link">launch</i>
				</div>
				<div class="notif_text" v-html="notification.content"></div>
			</div>
			<span class="load_more" v-if="amount > page * limit" @click="getMoreNotifications"
				>Load More</span
			>
		</div>
	</div>
	<div class="controls">
		<button class="left btn-flat waves-effect" @click="deleteAll" :disabled="spinners.length > 0">
			<span v-if="spinners.some((s) => s === 'delete')"> <SmallSpinner /> </span>Delete All
		</button>
		<button class="right btn-flat waves-effect" @click="readAll" :disabled="spinners.length > 0">
			<span v-if="spinners.some((s) => s === 'read')"> <SmallSpinner /> </span>Mark All as Read
		</button>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'Notifications',
	data() {
		return {
			spinners: [],
			notifications: null,
			unread: 0,
			amount: 0,
			page: 1,
			limit: 10,
		};
	},
	async mounted() {
		await this.getNotifications();
	},
	methods: {
		async getNotifications() {
			try {
				const { data } = await zauApi.get(`/user/notifications`, {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});
				this.unread = data.unread;
				this.amount = data.amount;
				this.notifications = data.notif;

				if (this.unread > 0) {
					this.$parent.unread = true;
				}
			} catch (e) {
				console.error('error getting notifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getMoreNotifications() {
			this.page += 1;

			try {
				const { data } = await zauApi.get(`/user/notifications`, {
					params: {
						page: this.page,
						limit: this.limit,
					},
				});

				this.notifications = this.notifications.concat(data.notif);
			} catch (e) {
				console.error('error getting more notifications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async redirectTo(link, id) {
			try {
				await zauApi.put(`/user/notifications/read/${id}`);
				if (link && link !== '') {
					this.$router.push(link);
				}
				const c = this.notifications.find((x) => x._id === id);
				if (c) {
					c.read = true;
				}
			} catch (e) {
				console.log('error redirecting', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async readAll() {
			try {
				this.spinners.push('read');
				await zauApi.put(`/user/notifications/read/all`);
				this.notifications.forEach((notif) => {
					if (notif.read === false) {
						notif.read = true;
					}
				});
				this.$parent.unread = false;
			} catch (e) {
				console.error('error reading all', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'read');
			}
		},
		async deleteAll() {
			try {
				this.spinners.push('delete');
				if (this.notifications.length > 0) {
					await zauApi.delete(`/user/notifications`);
					this.notifications = [];
					this.$parent.unread = false;
					this.toastSuccess('Deleted all notifications successfully');
				} else {
					this.toastInfo('You have no notifications');
				}
			} catch (e) {
				console.error('error deleting all', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.spinners = this.spinners.filter((s) => s !== 'delete');
			}
		},
	},
};
</script>

<style scoped lang="scss">
.notif_container {
	min-width: 230px;
	font-size: 1rem;
	max-width: 300px;
	max-height: 330px;
	overflow: auto;
	display: flex;
	flex-direction: column;

	.no_notif {
		font-style: italic;
		padding: 0 1em 1em 0;
	}

	&::-webkit-scrollbar {
		width: 10px;
	}

	&::-webkit-scrollbar-thumb {
		background: $primary-color-light;
		border-radius: 5px;
		border: 4px solid rgba(0, 0, 0, 0);
		-webkit-box-shadow:
			inset -1px -1px 0px rgba(0, 0, 0, 0.05),
			inset 1px 1px 0px rgba(0, 0, 0, 0.05);
		background-clip: padding-box;
	}

	.load_more {
		padding: 0.8em 0 0.8em 0;
		text-align: center;
		cursor: pointer;

		&:hover {
			color: $primary-color-light;
		}
	}

	.notif {
		padding: 0.8em 0 0.8em 0;
		border-bottom: 1px solid #eeeeee;
		position: relative;
		cursor: pointer;

		&:first-child {
			padding-top: 0;
		}

		&:last-child {
			border-bottom: none;
		}

		.notif_title {
			font-size: 1rem;
			padding-left: 1.1em;

			&.unread {
				font-weight: 600;
			}
		}

		.notif_text {
			font-size: 0.95rem;
			margin-top: 0.5em;
			font-weight: 400;
			padding-left: 1.1em;
			padding-right: 0.25em;
		}

		.notif_link {
			font-size: x-small;
			display: inline-block;
			margin-left: 0.1rem;
			line-height: unset;
			height: min-content;
		}

		.notif_unread {
			height: 7px;
			width: 7px;
			background-color: $primary-color-light;
			border-radius: 50%;
			display: inline-block;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
		}
	}
}

.controls {
	border-top: 1px solid #eeeeee;
	padding-top: 0.5em;
	font-size: 0.8rem;

	button {
		font-size: 12px;
		height: 2em;
		line-height: 2;
		padding: 0 0.5em;
		margin-left: -0.5em;
		margin-right: -0.5em;
	}
}
</style>
