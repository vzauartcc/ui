export interface IServerList {
  id: string;
  name: string;
}

export interface IBotConfig {
  _id: string;
  id: string; // Guild ID
  type: 'discord';
  repostChannels: Record<string, string>;
  managedRoles: IManagedRole[];
  ironMic: IChannelMessagePair;
  onlineControllers: IChannelMessagePair;
  cleanupChannels: Record<string, string>;
  reminderChannels: Record<string, string>;
}

export interface IManagedRole {
  key: string;
  roleId: string;
}

export interface IChannelMessagePair {
  channelId: string;
  messageId: string;
}

export interface IDiscordChannel {
  id: string;
  name: string;
  parent: string;
  topic: string;
  parentName: string;
  lastMessage: string;
}

export interface IDiscordRole {
  id: string;
  name: string;
}

export interface IDiscordMessage {
  id: string;
  content: string;
}
