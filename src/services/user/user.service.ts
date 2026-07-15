import { zauApi } from '@/utils/api';
import type {
  AllUsersResponse,
  IUser,
  IUserSessionsResponse,
} from './user.types';

export const userService = {
  processLogin(code: string) {
    return zauApi
      .post('user/login', {
        json: { code },
      })
      .json();
  },
  processLogout() {
    return zauApi
      .get('user/logout', {
        context: { silent: true },
      })
      .json();
  },
  getSelf(): Promise<IUser> {
    return zauApi
      .get('user/self', {
        context: {
          silent: true,
        },
      })
      .json();
  },
  getSessions(): Promise<IUserSessionsResponse> {
    return zauApi.get('user/sessions').json();
  },
  unlinkDiscord() {
    return zauApi.delete('discord/user').json();
  },
  getUsers(): Promise<AllUsersResponse> {
    return zauApi.get('user').json();
  },
  deleteUser(cid: number) {
    return zauApi.delete(`user/gdrp/${cid}`).json();
  },
};
