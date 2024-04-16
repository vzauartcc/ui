import { createStore } from 'vuex';

import user from './user';
import visit from './visit';
import trainee from './trainee';

export default createStore({
	modules: {
		user,
		visit,
		trainee
	}
});