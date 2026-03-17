<template>
	<div class="card">
		<div class="s12 center white-text" style="background-color: red" v-show="dirty">
			UNSAVED CHANGES
		</div>
		<div class="card-content">
			<div class="card-title">Discord Bot Management</div>
		</div>
		<div class="card-content" style="padding-bottom: 3rem">
			<Spinner v-if="!guilds" />
			<div v-else class="row">
				<div class="input-field col s6">
					<select id="role" name="role" class="materialize-select" v-model="guildID" required>
						<option value="" disabled selected>Select a server</option>
						<option v-for="server in guilds" :value="server.id" :key="server.id">
							{{ server.name }}
						</option>
					</select>
					<label for="role" class="active">Select Server to Manage</label>
				</div>
			</div>

			<div v-if="guildID" class="row">
				<Spinner v-if="guildID && (!config || !textChannels || !roles)" />
				<div v-else>
					<a href="#" class="btn blue" @click.prevent="startSendMessage">Post Message</a>
					<ul class="collapsible">
						<li>
							<div class="collapsible-header">
								<i class="material-icons">group_add</i>Managed Roles ({{
									config.managedRoles.length
								}})
							</div>
							<div class="collapsible-body">
								<p style="margin-bottom: 2rem">
									These roles will be managed by the bot when the user runs
									<span style="font-family: monospace; background-color: lightgray">/getroles</span>
									and via the automated role management task. <br />The key should match a role or
									rating assigned to users.
								</p>
								<a href="#" @click.prevent="addManagedRoleModal" class="btn right s3">Add Role</a>
								<table>
									<thead>
										<tr>
											<th>Key</th>
											<th>Role</th>
											<th class="options">Options</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="role in config.managedRoles" :key="role.key">
											<td>{{ role.key }}</td>
											<td>
												<b>{{ getRoleName(role.roleId) }}</b> ({{ role.roleId }})
											</td>
											<td class="options">
												<a
													href="#"
													class="modal-trigger"
													@click.prevent="editManagedRoleModal(role.key, role.roleId)"
												>
													<i class="material-icons">edit</i>
												</a>
												<a
													href="#"
													class="modal-trigger red-text"
													@click.prevent="deleteManagedRole(role.key, role.roleId)"
												>
													<i class="material-icons">delete</i>
												</a>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</li>
					</ul>
					<ul class="collapsible">
						<li>
							<div class="collapsible-header">
								<i class="material-icons">newspaper</i>Re-post Channels ({{
									Object.keys(config.repostChannels).length
								}})
							</div>
							<div class="collapsible-body">
								<p style="margin-bottom: 2rem">
									Messages posted in these channels will be deleted and re-posted by the bot as an
									embed.
								</p>
								<a href="#" @click.prevent="addReportChannelModal" class="btn right s3"
									>Add Channel</a
								>
								<table>
									<thead>
										<tr>
											<th>Channel</th>
											<th>Embed Title</th>
											<th>Options</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="(topic, channelId) in config.repostChannels" :key="channelId">
											<td>{{ getChannelName(channelId) }}</td>
											<td>{{ topic }}</td>
											<td class="options">
												<a
													href="#"
													class="modal-trigger"
													@click.prevent="editRepostChannelModal(channelId, topic)"
												>
													<i class="material-icons">edit</i>
												</a>
												<a
													href="#"
													class="modal-trigger red-text"
													@click.prevent="deleteRepostChannel(channelId)"
												>
													<i class="material-icons">delete</i>
												</a>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</li>
					</ul>
					<ul class="collapsible">
						<li>
							<div class="collapsible-header">
								<i class="material-icons">delete_sweep</i>Cleanup Channels ({{
									Object.keys(config.cleanupChannels).length
								}})
							</div>
							<div class="collapsible-body">
								<p style="margin-bottom: 2rem">
									These channels will be cleaned up nightly, removing all messages except the
									designated message to keep.
								</p>
								<a href="#" @click.prevent="addCleanupChannelModal" class="btn right s3"
									>Add Cleanup Channel</a
								>
								<table>
									<thead>
										<tr>
											<th>Channel</th>
											<th>Message</th>
											<th class="options">Options</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="(messageId, channelId) in config.cleanupChannels" :key="channelId">
											<td>{{ getChannelName(channelId) }}</td>
											<td
												v-if="messages[channelId].length > 27"
												:data-tooltip="messages[channelId]"
												data-position="bottom"
												class="tooltipped"
											>
												{{ trimMessage(messages[channelId]) }}
											</td>
											<td v-else>{{ messages[channelId] }}</td>
											<td class="options">
												<a
													href="#"
													class="modal-trigger"
													@click.prevent="editCleanupChannelModal(channelId, messageId)"
												>
													<i class="material-icons">edit</i>
												</a>
												<a
													href="#"
													class="modal-trigger red-text"
													@click.prevent="deleteCleanupChannel(channelId)"
												>
													<i class="material-icons">delete</i>
												</a>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</li>
					</ul>

					<a
						href="#"
						@click.prevent="saveConfig"
						class="btn right blue col s12"
						:class="{ disabled: !dirty }"
						>Save</a
					>

					<teleport to="body">
						<div id="modal_role" class="modal modal_role">
							<div class="modal-content">
								<p class="modal_title">{{ editRole.key == '' ? 'Create' : 'Edit' }} Managed Role</p>
								<div class="row row_no_margin">
									<div class="input-field col s6">
										<input id="edit_role_key" name="edit_role_key" v-model="editRole.key" />
										<label for="edit_role_key" class="active"
											>Lookup Key<i
												class="material-icons tooltipped"
												data-position="right"
												data-tooltip="Examples: S1, atm, vis"
												>help</i
											></label
										>
									</div>
									<div class="input-field col s6">
										<select
											id="role"
											name="role"
											class="materialize-select"
											v-model="editRole.roleId"
											required
										>
											<option value="" disabled selected>Select a role</option>
											<option v-for="role in roles" :value="role.id" :key="role.id">
												{{ role.name }}
											</option>
										</select>
										<label for="role" class="active">Managed Role</label>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
								<a href="#" class="btn-flat right" @click.prevent="saveRole">Save</a>
							</div>
						</div>

						<div id="modal_repost" class="modal modal_repost">
							<div class="modal-content">
								<p class="modal_title">
									{{ repostChannel.id == '' ? 'Create' : 'Edit' }} Re-post Channel
								</p>
								<div class="row row_no_margin">
									<div class="input-field col s6">
										<select
											id="repost_channel"
											name="repost_channel"
											class="materialize-select"
											v-model="repostChannel.id"
											required
											:disabled="repostChannel.edit"
										>
											<option value="" disabled selected>Select a channel</option>
											<option v-for="channel in textChannels" :value="channel.id" :key="channel.id">
												{{ getChannelName(channel.id) }}
											</option>
										</select>
										<label for="repost_channel" class=""
											>Re-post Channel<i
												v-if="repostChannel.id != ''"
												class="material-icons tooltipped"
												data-position="right"
												data-tooltip="Channel cannot be modified, delete instead."
												>help</i
											></label
										>
									</div>
									<div class="input-field col s6">
										<input id="repost_topic" name="repost_topic" v-model="repostChannel.topic" />
										<label for="repost_topic" class="active"
											>Embed Title<i
												class="material-icons tooltipped"
												data-position="right"
												data-tooltip="Title used for each embed"
												>help</i
											></label
										>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
								<a href="#" class="btn-flat right" @click.prevent="saveRepost">Save</a>
							</div>
						</div>

						<div id="modal_cleanup" class="modal modal_cleanup">
							<div class="modal-content">
								<p class="modal_title">
									{{ editRole.key == '' ? 'Create' : 'Edit' }} Cleanup Channel
								</p>
								<div class="row row_no_margin">
									<div class="input-field col s6">
										<select
											id="cleanup_channel"
											name="cleanup_channel"
											class="materialize-select"
											v-model="cleanupChannel.channelId"
											required
											:disabled="cleanupChannel.edit"
										>
											<option value="" disabled selected>Select a channel</option>
											<option v-for="channel in textChannels" :value="channel.id" :key="channel.id">
												{{ getChannelName(channel.id) }}
											</option>
										</select>
										<label for="cleanup_channel" class=""
											>Cleanup Channel<i
												v-if="cleanupChannel.channelId != ''"
												class="material-icons tooltipped"
												data-position="right"
												data-tooltip="Channel cannot be modified, delete instead."
												>help</i
											></label
										>
									</div>
									<div class="input-field col s6">
										<select
											id="role"
											name="role"
											class="materialize-select"
											v-model="cleanupChannel.messageId"
											required
											:disabled="fetchedMessages.length === 0"
										>
											<option value="" disabled selected>Select a message</option>
											<option
												v-for="message in fetchedMessages"
												:value="message.id"
												:key="message.id"
											>
												{{ message.content }}
											</option>
										</select>
										<label for="role" class="active">Message to Save</label>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
								<a href="#" class="btn-flat right" @click.prevent="saveCleanup">Save</a>
							</div>
						</div>

						<div id="modal_send_message" class="modal modal_send_message">
							<div class="modal-content">
								<p class="modal_title">Send Message as Bot</p>
								<div class="row row_no_margin">
									<p>
										Sends a message as the WATSN bot in the specified channel. Embed, attachments,
										and files are not supported.
									</p>
									<p>Use Discord formatting.</p>
								</div>
								<div class="row row_no_margin">
									<div class="input-field col s6">
										<select
											id="sendMessage_channel"
											name="sendMessage_channel"
											class="materialize-select"
											v-model="sendMessage.channelId"
											required
										>
											<option value="" disabled selected>Select a channel</option>
											<option v-for="channel in textChannels" :value="channel.id" :key="channel.id">
												{{ getChannelName(channel.id) }}
											</option>
										</select>
										<label for="sendMessage_channel" class="">Target Channel</label>
									</div>
									<div class="input-field col s6">
										<textarea
											id="msgText"
											class="materialize-textarea"
											data-length="2000"
											v-model="sendMessage.content"
											maxlength="2000"
										></textarea>
										<label for="msgText" class="active"
											>Message Content
											<i
												class="material-icons tooltipped"
												data-position="right"
												data-tooltip="Format text as you would in Discord"
												>help</i
											></label
										>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<a href="#!" class="btn-flat modal-close right" @click.prevent>Cancel</a>
								<a href="#" class="btn-flat right" @click.prevent="sendDiscordMessage">Save</a>
							</div>
						</div>
					</teleport>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { zauApi } from '@/helpers/axios.js';

export default {
	name: 'DiscordBot',
	title: 'Discord Bot',
	data() {
		return {
			guilds: null,
			guildID: '',
			config: null,
			textChannels: null,
			roles: null,
			messages: {},
			editRole: {
				key: '',
				roleId: '',
			},
			repostChannel: {
				edit: false,
				id: '',
				topic: '',
			},
			cleanupChannel: {
				edit: false,
				channelId: '',
				messageId: '',
			},
			dirty: false,
			fetchedMessages: [],
			sendMessage: {
				channelId: '',
				content: '',
			},
		};
	},
	async mounted() {
		await this.getGuilds();

		this.doMaterialize();
	},
	methods: {
		doMaterialize() {
			this.$nextTick(() => {
				M.Collapsible.init(document.querySelectorAll('.collapsible'), null);
				M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
					margin: 0,
				});
				M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});

				const dynamicModals = document.querySelectorAll('.modal');
				dynamicModals.forEach((modal) => {
					if (!M.Modal.getInstance(modal)) {
						M.Modal.init(modal, { preventScrolling: false });
					}
				});
			});
		},
		async getGuilds() {
			try {
				const { data } = await zauApi.get('/discord/bot/all-guilds');
				this.guilds = data;
				if (this.guilds.length === 1) {
					await this.getConfig(this.guilds[0].id);
				}
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getConfig(id) {
			try {
				const { data } = await zauApi.get(`/discord/bot/config/${id}`);
				this.config = data;

				Object.keys(this.config.cleanupChannels).forEach(async (channelId) => {
					const message = await this.getMessageContent(
						channelId,
						this.config.cleanupChannels[channelId],
					);
					this.messages[channelId] = message.content;
				});

				await this.getRoles(data.id);
				await this.getTextChannels(data.id);
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getTextChannels(guildId) {
			try {
				const { data } = await zauApi.get(`/discord/bot/all-channels?guildId=${guildId}`);
				this.textChannels = data.sort((a, b) => a.name.localeCompare(b.name));
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getRoles(guildId) {
			try {
				const { data } = await zauApi.get(`/discord/bot/all-roles?guildId=${guildId}`);
				this.roles = data;
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getMessageContent(channelId, messageId) {
			try {
				const { data } = await zauApi.get(
					`/discord/bot/message-content?channelId=${channelId}&messageId=${messageId}`,
				);
				return data;
			} catch (e) {
				console.error('error getting message content', e);
				return {
					author: {
						globalName: 'N/A',
						content: `Unable to retrieve message content (${messageId})`,
					},
				};
			}
		},
		async getAllMessages(channelId) {
			try {
				const { data } = await zauApi.get(`/discord/bot/all-messages?channelId=${channelId}`);
				return data;
			} catch (e) {
				console.error('error getting channel messages', e);
				return [];
			}
		},
		async saveConfig() {
			try {
				await zauApi.put(`/discord/bot/config/${this.guildID}`, this.config);
				this.dirty = false;
				this.toastSuccess('Configuration saved');
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error getting applications', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		getChannelName(channelId) {
			return `#${this.textChannels.find((channel) => channel.id === channelId)?.name}`;
		},
		getRoleName(roleId) {
			return this.roles.find((role) => role.id === roleId)?.name;
		},
		trimMessage(str) {
			if (!str) return '';

			if (str.length <= 30) {
				return str;
			}
			return str.slice(0, 30) + '...';
		},
		addManagedRoleModal() {
			this.editRole = {
				key: '',
				roleId: '',
			};

			this.showModal('modal_role');
		},
		editManagedRoleModal(key, roleId) {
			this.editRole = {
				key,
				roleId,
			};

			this.showModal('modal_role');
		},
		addReportChannelModal() {
			this.repostChannel = {
				edit: false,
				id: '',
				topic: '',
			};

			this.showModal('modal_repost');
		},
		editRepostChannelModal(channelId, topic) {
			this.repostChannel = {
				edit: true,
				id: channelId,
				topic: topic,
			};

			this.showModal('modal_repost');
		},
		addCleanupChannelModal() {
			this.cleanupChannel = {
				edit: false,
				channelId: '',
				messageId: '',
			};

			this.showModal('modal_cleanup');
		},
		editCleanupChannelModal(channelId, messageId) {
			this.cleanupChannel = {
				edit: true,
				channelId: channelId,
				messageId: messageId,
			};

			this.showModal('modal_cleanup');
		},
		showModal(id) {
			this.$nextTick(() => {
				M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
				M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
					margin: 0,
				});
				M.CharacterCounter.init(document.querySelectorAll('textarea'), {});

				const modal = document.getElementById(id);
				if (modal) {
					M.Modal.getInstance(modal).open();
				}
			});
		},
		saveRole() {
			this.config.managedRoles.push(this.editRole);

			this.dirty = true;

			M.Modal.getInstance(document.querySelector('.modal_role')).close();
		},
		deleteManagedRole(key, roleId) {
			const roles = [];
			this.config.managedRoles.forEach((role) => {
				if (role.key !== key && role.roleId !== roleId) {
					roles.push(role);
				}
			});
			this.config.managedRoles = roles;

			this.dirty = true;
		},
		saveRepost() {
			this.config.repostChannels[this.repostChannel.id] = this.repostChannel.topic;

			this.dirty = true;

			M.Modal.getInstance(document.querySelector('.modal_repost')).close();
		},
		deleteRepostChannel(channelId) {
			delete this.config.repostChannels[channelId];

			this.dirty = true;
		},
		saveCleanup() {
			this.config.cleanupChannels[this.cleanupChannel.channelId] = this.cleanupChannel.messageId;

			this.messages[this.cleanupChannel.channelId] = this.fetchedMessages.find(
				(message) => message.id === this.cleanupChannel.messageId,
			).content;

			this.dirty = true;

			M.Modal.getInstance(document.querySelector('.modal_cleanup')).close();
		},
		deleteCleanupChannel(channelId) {
			delete this.config.cleanupChannels[channelId];

			this.dirty = true;
		},
		startSendMessage() {
			this.sendMessage = {
				channelId: '',
				content: '',
			};

			this.showModal('modal_send_message');
		},
		async sendDiscordMessage() {
			try {
				await zauApi.post(`/discord/bot/send-message`, this.sendMessage);
				this.toastSuccess('Message sent successfully!');

				M.Modal.getInstance(document.querySelector('.modal_send_message')).close();
			} catch (e) {
				if (e.response) {
					this.toastError(
						e.response.data.message || 'Something went wrong, please try again later',
					);
					return;
				}

				console.error('error sending message', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
	},
	computed: {},
	watch: {
		'cleanupChannel.channelId': async function () {
			if (this.cleanupChannel.channelId) {
				this.fetchedMessages = await this.getAllMessages(this.cleanupChannel.channelId);
				this.$nextTick(() => {
					M.FormSelect.init(document.querySelectorAll('.materialize-select'), {});
				});
			}
		},
		guildID: async function () {
			this.textChannels = null;
			this.roles = null;
			this.config = null;
			this.fetchedMessages = [];
			this.messages = {};
			this.dirty = false;

			await this.getConfig(this.guildID);

			this.doMaterialize();

			this.$nextTick(() => {
				M.Modal.getInstance(document.querySelector('.modal')).close();
			});
		},
	},
};
</script>

<style lang="scss" scoped>
label {
	.material-icons {
		font-size: 17px;
		display: inline-flex;
		vertical-align: top;
		margin-top: 0.25em;
		user-select: none;
		cursor: pointer;
	}
}

.modal {
	min-height: 50vh;
}

.modal_title {
	font-weight: bold;
	font-size: 1.2rem;
}
</style>
