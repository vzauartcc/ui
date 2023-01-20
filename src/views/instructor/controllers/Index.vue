<template>
	<div>
		<div class="card">
			<div class="card-content">
				<div class="row row_no_margin">
					<span class="card-title col s12 m8">Controllers</span>
					<div class="input-field col s12 m4">
						<input autocomplete="off" @keyup=filterControllers v-model=filter type="text" placeholder="Search for a controller">
						<span class="helper-text right">Search by CID, name, or operating initials</span>
					</div>
				</div>
			</div>
			<div class="loading_container" v-if="!controllers">
				<Spinner />
			</div>
			<div class="table_wrapper" v-else>
				<table class="striped compact">
					<thead class="controller_list_head">
						<tr>
							<th>Controller</th>
							<th>CID</th>
							<th class="options">Options</th>
						</tr>
					</thead>
					<tbody class="controller_list_row">
						<tr v-for="controller in controllersFiltered" :key="controller.cid">
							<td>
								<i class="material-icons right type_controller">{{controller.vis?'work':'home'}}</i>
								<div class="name">
									<router-link :to="`/controllers/${controller.cid}`">{{controller.fname}} {{controller.lname}} ({{controller.oi}})</router-link>
								</div>
								<div class="rating">
									{{controller.ratingLong}}
								</div>
							</td>
							<td>
								<div class="cid">
									{{controller.cid}}
								</div>
							</td>
							<td class="options">
								<router-link data-position="top" data-tooltip="View Training Sessions" class="tooltipped" :to="`/ins/training/sessions/${controller.cid}`"><i class="material-icons">assignment</i></router-link>
								<router-link data-position="top" data-tooltip="Edit Controller" class="tooltipped" :to="`/ins/controllers/${controller.cid}`"><i class="material-icons">edit</i></router-link>
                                  <template v-if="requiresAuth(['atm', 'datm', 'ta', 'ins', 'wm'])">
                                <template v-if="controller.ratingShort !== 'C3' && controller.ratingShort !== 'SUP' && controller.ratingShort !== 'ADM' && controller.ratingShort !== 'I1' && controller.ratingShort !== 'I3' && controller.ratingShort !== 'C1'  && controller.vis === false">
                             <a :href="`#modal_promote_${controller.cid}`" data-position="top" data-tooltip="Promote Controller" class="tooltipped modal-trigger"><i class="material-icons green-text text-darken-2">arrow_upward</i></a>
                            </template>
                        </template>
                        </td>
              <div :id="`modal_promote_${controller.cid}`" class="modal modal_promote" @focus="getNewRating(controller.rating)">
                <div class="modal-content">
                  <h4>Promote <b>{{controller.fname}} {{controller.lname}}</b></h4>
                  <p>This will promote <b>{{controller.fname}} {{controller.lname}}</b> to the next rating. You must state a new rating, date of OTS, callsign of the positon the user was on, and your CID for the promotion below.</p>
                  <div class="row">
                    <div class="input-field col s12 m6">
                      <p>New Rating</p>
                      <textarea class="materialize-textarea col s12 m10" style="margin-right: 20px; padding-top: 5px" placeholder="New Rating ex. S1" :value="newRating"  disabled></textarea>
                    </div>
                    <div class="input-field col s12 m6">
                      <p>Your CID</p>
                      <textarea class="materialize-textarea col s12 m10" style="margin-bottom: 20px; padding-top: 5px" placeholder="Your CID" :value="examinerCid" disabled></textarea>
                    </div>
                    <div class="input-field col s12 m6">
                      <p>OTS Position</p>
                      <textarea class="materialize-textarea col s12 m10" style="margin-bottom: 20px; padding-top: 5px" placeholder="CHI_35_CTR" v-model="position" required></textarea>
                    </div>
                    <div class="input-field col s12 m6">
                      <p>Date of OTS</p>
                      <flat-pickr class="input-field col s12 m10" placeholder="OTS Date" v-model="otsDate" required></flat-pickr>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <a href="#!" @click="promoteController(controller)" class="btn waves-effect">Promote</a>
                  <a href="#!" class="btn-flat waves-effect modal-close">Cancel</a>
                </div>
              </div>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
import {vatusaApiAuth, zabApi} from '@/helpers/axios.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import {ref} from "vue";
const endDate = document.getElementById('end_date');
import { mapState } from 'vuex';

export default {
	computed: {
		...mapState('user', [
			'user'
		])
	},
	name: 'Controllers',
	title: 'Controllers',
	data() {
		return {
			controllers: null,
			controllersFiltered: null,
			filter: '',
              examinerCid: '',
      newRating:  '',
      rating: '',
			reason: null,
      position: null,
      ecid: null,
      otsDate: {
        date: null,
      }
		};
	},
	async mounted() {
		await this.getControllers();
        await this.getControllers();
    this.getExaminerCid().then((examinerCid) => {
      this.examinerCid = examinerCid;
    });
    const today = new Date(new Date().toUTCString());
    flatpickr('#otsDate', {
      date: null,
      dateFormat: 'Y-m-d',
      minDate: today,
    });
		M.Modal.init(document.querySelectorAll('.modal'), {
			preventScrolling: false
		});
		M.Tooltip.init(document.querySelectorAll('.tooltipped'), {
			margin: 0
		});
	},
	methods: {
		requiresAuth(roles) {
			const havePermissions = roles.some(r => this.user.data.roleCodes.includes(r));
			if(havePermissions) {
				return true;
			} else {
				return false;
			}
	},
		async getControllers() {
			const {data} = await zabApi.get('/controller');
			this.controllers = data.data.home.concat(data.data.visiting);
			this.controllers = this.controllers.filter(c => c.member);
			this.controllersFiltered = this.controllers;
		},
        async getNewRating(controller){
      let ratings = {
        '1': 'OBS',
        '2': 'S1',
        '3': 'S2',
        '4': 'S3',
        '5': 'C1',
        '7': 'C3',
        '8': 'I1',
        '10': 'I3',
        '11': 'SUP',
        '12': 'ADM'
      }
      let controllerRating = controller + 1;
      return this.newRating = ratings[controllerRating];
    },
    async promoteController(controller) {
      if((this.position == null || this.position === '') || (this.otsDate.date == null && this.otsDate === 'undefined')) {
        this.toastError('Please fill out all fields');
        return;
      }
      if((/^([A-Z]{2,3})(_([A-Z,0-9]{1,3}))?_(DEL|GND|TWR|APP|DEP|CTR)$/.test(this.position) || this.position.toLowerCase() === "any") === false) {
        return this.toastError('Invalid position');
      }
      if(controller.rating === '11' || controller.rating === '12'){
        this.toastError('Controller is an admin or sup, cannot promote');
      }else if(controller.rating === '10' || controller.rating === '9'){
        this.toastError('Controller is a I1 or I3, cannot promote');
      }else{
        var rating = controller.rating + 1;
      }
      await vatusaApiAuth.post(`/user/${controller.cid}/rating`, {
        rating: rating,
        examDate: this.otsDate,
        position: this.position,
        examiner: this.examinerCid
      })
          .then((response) => {
            if(response === 200) {
              this.toastSuccess( 'Controller promoted successfully!');
            }
          })
          .catch((error) => {
            console.log(error);
            this.toastError('Error promoting controller!');
          });
    },
    async getExaminerCid() {
      try {
        const res = await zabApi.get(`/user`)
        return res.data.data.cid
      } catch (error) {
        console.error(error)
      }
    },
		filterControllers() {
			const search = new RegExp(this.filter, 'ig');
			this.controllersFiltered = this.controllers.filter(controller => {
				if(
					controller.fname.match(search) ||
					controller.lname.match(search) ||
					controller.oi.match(search) ||
					controller.cid.toString().match(search)
				) {
					return true;
				}
			});
		}
	}
};
</script>

<style scoped lang="scss">
.table_wrapper {
	width: 100%;
	overflow: auto;
}

.input-field {
	margin-top: 0;
}

.name {
	color: $primary-color;
	font-weight: 700;
}

.rating {
	font-weight: 400;
}

.type_controller {
	vertical-align: top;
	margin-top: .4em;
}

table tbody {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}
}

.modal_delete {
	min-width: 340px;
	width: 30%;
}
</style>