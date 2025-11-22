<template>
	<div class="card">
		<div class="card-content">
			<span class="card-title">Action Log</span>
		</div>
		<div class="actions_wrapper" v-if="log">
			<div class="col s6">
				<select class="materialize-select" name="actionType" id="actionType" v-model="selectedType">
					<option v-for="(action, id) in actionTypes" :key="id" :value="id">
						{{ action }}
					</option>
				</select>
				<label for="actionType"></label>
			</div>
			<table class="striped highlight">
				<thead>
					<tr>
						<th class="date">Date</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in log" :key="item._id">
						<td class="date">{{ dtStandard(item.createdAt) }}z</td>
						<td v-html="populateLog(item)"></td>
					</tr>
				</tbody>
			</table>
			<div v-if="log && logAmount !== 0">
				<Pagination
					:amount="logAmount"
					:page="page"
					:limit="limit"
					:amountOfPages="amountOfPages"
				/>
			</div>
		</div>
		<div class="loading_container" v-else>
			<Spinner />
		</div>
	</div>
</template>

<script>
import Pagination from '@/components/Pagination.vue';
import { zauApi } from '@/helpers/axios.js';

export default {
	title: 'Action Log',
	data() {
		return {
			log: null,
			logAmount: 0,
			page: 1,
			limit: 20,
			amountOfPages: 0,
			actionTypes: [],
			selectedType: 0,
		};
	},
	components: {
		Pagination,
	},
	async mounted() {
		await this.getLogTypes();
		await this.getLog();

		M.FormSelect.init(document.querySelectorAll('select'), {});
	},
	methods: {
		async getLogTypes() {
			try {
				const { data } = await zauApi.get('/controller/log/types');

				this.actionTypes = data;
			} catch (e) {
				console.error('error getting log types', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		async getLog() {
			try {
				const { data: dossierData } = await zauApi.get('/controller/log', {
					params: {
						page: this.page,
						limit: this.limit,
						action: this.selectedType,
					},
				});
				this.log = dossierData.dossier;
				this.logAmount = dossierData.amount;
				this.amountOfPages = Math.ceil(this.logAmount / this.limit);
			} catch (e) {
				console.error('error getting log', e);
				this.toastError('Something went wrong, please try again later');
			}
		},
		populateLog(log) {
			let action = log.action;
			if (action.match(/%b/)) {
				action = action.replace(/%b/, `<strong>${log.userBy.fname} ${log.userBy.lname}</strong>`);
			}
			if (action.match(/%a/)) {
				action = action.replace(
					/%a/,
					`<strong>${log.userAffected.fname} ${log.userAffected.lname}</strong>`,
				);
			}
			if (action.match(/\*([^*]+)\*/g)) {
				action = action.replace(/\*([^*]+)\*/g, `<strong>$1</strong>`);
			}
			return action;
		},
	},
	watch: {
		page: async function () {
			await this.getLog();
		},
		selectedType: async function () {
			this.page = 1;
			await this.getLog();
		},
	},
};
</script>

<style scoped lang="scss">
th {
	padding: 0.75em 1em;
}

.date {
	width: 170px;
}
</style>
