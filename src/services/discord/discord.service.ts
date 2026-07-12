import { zauApi } from '@/utils/api';
import type {
  IBotConfig,
  IDiscordChannel,
  IDiscordMessage,
  IDiscordRole,
  IServerList,
} from './discord.types';

export const discordService = {
  getServers(): Promise<IServerList[]> {
    return zauApi.get('discord/bot/all-guilds').json();
  },
  getConfig(id: string): Promise<IBotConfig> {
    return zauApi.get(`discord/bot/config/${id}`).json();
  },
  getServerChannels(id: string): Promise<IDiscordChannel[]> {
    return zauApi.get(`discord/bot/all-channels?guildId=${id}`, {}).json();
  },
  getServerRoles(id: string): Promise<IDiscordRole[]> {
    return zauApi.get(`discord/bot/all-roles?guildId=${id}`, {}).json();
  },
  getChannelMessages(id: string): Promise<IDiscordMessage[]> {
    return zauApi.get(`discord/bot/all-messages?channelId=${id}`, {}).json();
  },
  getMessageContent(
    channelId: string,
    messageId: string,
  ): Promise<IDiscordMessage> {
    return zauApi
      .get(
        `discord/bot/message-content?channelId=${channelId}&messageId=${messageId}`,
        {},
      )
      .json();
  },
  saveConfig(config: IBotConfig) {
    return zauApi
      .put(`discord/bot/config/${config.id}`, {
        json: config,
      })
      .json();
  },
};
