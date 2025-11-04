import { zauApi } from '@/helpers/axios.js';

export default {
	namespaced: true,
	state: {
		userQueryComplete: false,
		user: {
			data: null,
			isLoggedIn: false,
		},
	},
	actions: {
		getUser: async ({ commit, state }) => {
			if (!state.user.isLoggedIn) {
				try {
					const { data: user } = await zauApi.get('/user');
					if (user.ret_det.code === 200) {
						commit('setUser', user.data);
						commit('setLoggedIn', true);
					}
					if (user.ret_det.code === 403) {
						console.error(user.ret_det.message);
					}
				} catch (e) {
					console.error('[store] error getting user', e);
				}
			}
			commit('setQuery', true);
		},
		logout: async ({ commit }) => {
			zauApi
				.get('/user/logout')
				.then(() => {
					commit('setUser', null);
					commit('setLoggedIn', false);
				})
				.catch((e) => {
					console.error('[store] error logging out', e);
				});
		},
	},
	mutations: {
		setUser(state, user) {
			state.user.data = user;
		},
		setQuery(state, query) {
			state.userQueryComplete = query;
		},
		setLoggedIn(state, loggedIn) {
			state.user.isLoggedIn = loggedIn;
		},
	},
	getters: {
		hasQueryCompleted: (state) => state.userQueryComplete,
		getUserData: (state) => state.user.data,
		getUserId: (state) => state.user.data._id,
	},
};
