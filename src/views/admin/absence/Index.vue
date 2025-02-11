<template>
	<div class="card home_intro">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Leave of Absence</span></div>
				<div class="col s4"><router-link to="/admin/absence/new"><span class="btn right">New</span></router-link></div>
			</div>
		</div>
		<div class="loading_container" v-if="absences === null">
			<Spinner />
		</div>
		<p class="no_absence" v-else-if="absences && absences.length === 0">There are no controllers on Leave of Absence</p>
		<div class="loa_wrapper" v-else>
			<table class="loa_list striped">
				<thead class="feedback_list_head">
					<tr>
						<th>Controller</th>
						<th>Expiration Date</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="event_list_row">
					<tr v-for="(absence, i) in absences" :key="absence._id">
						<td>{{absence.user.fname}} {{absence.user.lname}}</td>
						<td>{{dLong(absence.expirationDate)}}</td>
						<td class="options">
							<a href="#" data-position="top" data-tooltip="View Details" class="tooltipped modal-trigger" @click.prevent="openModal(i, 'absence')">
								<i class="material-icons">search</i>
							</a>
							<a href="#" data-position="top" data-tooltip="Delete LOA" class="tooltipped modal-trigger" @click.prevent="openModal(i, 'delete')">
								<i class="material-icons red-text text-darken-2">delete</i>
							</a>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<teleport to="body">
  		<div v-for="(absence, i) in absences" :key="`modal_${i}`">
    		<!-- Absence Details Modal -->
    		<div :id="`modal_absence_${i}`" class="modal modal_absence">
      		<div class="modal-content">
        		<div class="modal_title">Leave of Absence for {{ absence.user.fname }} {{ absence.user.lname }}</div>
        		<div class="absence">
          		<div class="row row_no_margin" id="absence">
            		<div class="input-field col s6">
              		<p id="first_name">{{ absence.user.fname }} {{ absence.user.lname }}</p>
              		<label for="first_name" class="active">Controller</label>
            		</div>
            		<div class="input-field col s6">
              		<p id="cid">{{ dLong(absence.expirationDate) }}</p>
              		<label for="cid" class="active">Expiration Date</label>
            		</div>
            		<div class="input-field col s12">
              		<div id="comments">{{ absence.reason }}</div>
              		<label for="comments" class="active">Reason</label>
            		</div>
          		</div>
        		</div>
      		</div>
      		<div class="modal-footer">
        		<a href="#!" class="waves-effect btn-flat modal-close" @click.prevent>Close</a>
      		</div>
    		</div>

    		<!-- Delete Absence Modal -->
    		<div :id="`modal_delete_${i}`" class="modal modal_delete">
      		<div class="modal-content">
        		<h4>Delete Leave of Absence?</h4>
        		<p>
          		This will delete the Leave of Absence granted to
          		<strong>{{ absence.user.fname }} {{ absence.user.lname }}</strong> until
          		<strong>{{ dLong(absence.expirationDate) }}</strong>
        		</p>
      		</div>
      		<div class="modal-footer">
        		<a href="#!" @click.prevent="deleteLoa(absence._id)" class="btn waves-effect">Delete</a>
        		<a href="#!" class="btn-flat waves-effect modal-close" @click.prevent>Cancel</a>
      		</div>
    		</div>
  		</div>
		</teleport>
	</div>
</template>

<script>
import {zabApi} from '@/helpers/axios.js';

export default {
	name: 'Absence',
	title: 'Leave of Absence',
	data() {
		return {
			absences: null
		};
	},
	async mounted() {
		await this.getAbsences();
		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false
		});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0
		});
	},
	methods: {
		async getAbsences() {
    	const { data } = await zabApi.get("/controller/absence");
    	this.absences = data.data;
    	this.$nextTick(() => {
      	this.initModals();
    	});
  	},
  	openModal(index, type) {
    	const modal = document.getElementById(`modal_${type}_${index}`);
    	if (modal) {
      	M.Modal.getInstance(modal).open();
    	}
  	},
  	initModals() {
    	this.$nextTick(() => {
      	const modals = document.querySelectorAll(".modal");
      	M.Modal.init(modals, {
        	preventScrolling: false,
      	});
    	});
  	},
		async deleteLoa(id) {
			try {
				const {data} = await zabApi.delete(`/controller/absence/${id}`);
				if(data.ret_det.code === 200) {
					this.toastSuccess('Controller removed from LOA successfully');

					setTimeout(() => M.Modal.getInstance(document.querySelector('.modal_delete')).close(), 500);
					await this.getAbsences();
				} else {
					this.toastError(data.ret_det.message);
				}
			} catch(e) {
				console.log(e);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.modal_title {
	font-size: 1.8em;
	margin-bottom: .5em;
}

.no_absence {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.absence {
	#comments {
		font-family: inherit;
		white-space: pre-wrap;
		overflow: hidden;
		width: 100%;
	}

	.row {
		.input-field p {
			white-space: pre-wrap;
			margin: 0;
		}
	}
}
</style>