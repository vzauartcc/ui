import { zauApi } from '@/helpers/axios.js';
import router from '@/router/index.js';

export default {
	namespaced: true,
	state: {
		visitQueryComplete: false,
		visit: {
			data: null,
			isLoggedIn: false,
		},
	},
	actions: {
		getVisit: async ({ commit, state }) => {
			if (!state.visit.isLoggedIn) {
				// we have a token already set
				zauApi
					.get('/user/visit')
					.then(({ data }) => {
						if (data) {
							commit('setVisit', data);
							commit('setVisitLoggedIn', true);
						}
					})
					.catch((e) => {
						console.error('[store] error getting visitor', e);
						return router.push('/');
					});
			}
			commit('setVisitQuery', true);
		},
		logout: async ({ commit }) => {
			zauApi
				.get('/user/visit/logout')
				.then(() => {
					commit('setVisit', null);
					commit('setVisitLoggedIn', false);
				})
				.catch((e) => {
					console.error('[store] error logging out visitor', e);
				});
		},
	},
	mutations: {
		setVisit(state, visit) {
			state.visit.data = visit;
		},
		setVisitQuery(state, query) {
			state.visitQueryComplete = query;
		},
		setVisitLoggedIn(state, loggedIn) {
			state.visit.isLoggedIn = loggedIn;
		},
	},
	getters: {
		hasQueryCompleted: (state) => state.visitQueryComplete,
	},
};
