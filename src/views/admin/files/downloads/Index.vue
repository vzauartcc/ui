<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Downloads</span></div>
				<div class="col s4"><router-link to="/admin/files/downloads/new"><span class="btn waves-effect waves-light new_event_button right">New</span></router-link></div>
			</div>
		</div>
		<div class="loading_container" v-if="downloads === null">
			<Spinner />
		</div>
		<div class="no_downloads" v-else-if="downloads && downloads.length == 0">There are no downloads</div>
		<div class="table_wrapper" v-else>
			<table class="controller_list striped">
				<thead class="controller_list_head">
					<tr>
						<th>Name</th>
						<th>Category</th>
						<th>Last updated</th>
						<th class="options">Options</th>
					</tr>
				</thead>
				<tbody class="controller_list_row">
          <tr v-for="(file, i) in downloads" :key="file.id">
            <td class="name">{{ file.name }}</td>
            <td>{{ convertCategory(file.category) }}</td>
            <td>{{ dtLong(file.updatedAt) }}</td>
            <td class="options">
              <router-link data-position="top" data-tooltip="Edit Download" class="tooltipped" :to="`/admin/files/downloads/${file._id}`">
                <i class="material-icons">edit</i>
              </router-link>
              <a href="#" data-position="top" data-tooltip="Delete Download" class="tooltipped modal-trigger" @click.prevent="openModal(i)">
                <i class="material-icons red-text text-darken-2">delete</i>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
		<teleport to="body">
      <div v-for="(file, i) in downloads" :key="`modal_${i}`">
        <div :id="`modal_delete_${i}`" class="modal modal_delete">
          <div class="modal-content">
            <h4>Delete download?</h4>
            <p>This will delete <b>{{ file.name }}</b> from the downloads section completely.</p>
          </div>
          <div class="modal-footer">
            <a href="#" class="waves-effect waves-light btn" @click.prevent="deleteDownload(file._id, i)">Delete</a>
            <a href="#" class="modal-close waves-effect waves-light btn-flat" @click.prevent>Cancel</a>
          </div>
        </div>
      </div>
    </teleport>
	</div>
</template>

<script>
import {zabApi} from '@/helpers/axios.js';

export default {
	name: 'Downloads',
	title: 'Downloads',
	data() {
		return {
			downloads: null
		};
	},
	async mounted() {
		await this.getDownloads();
		this.$nextTick(() => {
      M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
    });
	},
	updated() {
    this.$nextTick(() => {
      this.initModals();
    });
  },
	methods: {
		async getDownloads() {
			const {data} = await  zabApi.get('/file/downloads');
			this.downloads = data.data;
		},
		openModal(index) {
      const modal = document.getElementById(`modal_delete_${index}`);
      if (modal) {
        M.Modal.getInstance(modal).open();
      }
    },
    initModals() {
      this.$nextTick(() => {
        this.modals = document.querySelectorAll(".modal");
        M.Modal.init(this.modals, {
          preventScrolling: false,
        });
      });
    },
		async deleteDownload(id, modalId) {
  		if (!id) {
    		console.error("❌ Error: ID is undefined!");
    		return this.toastError("Error: Download ID is missing.");
  		}

  		try {
    		const deletePromise = zabApi.delete(`/file/downloads/${id}`);

    		setTimeout(() => {
      		const modal = document.getElementById(modalId);
      		if (modal) {
        		M.Modal.getInstance(modal).close();
      		}
    		}, 500);

    		const { data } = await deletePromise;

    		if (data.ret_det.code === 200) {
      		this.toastSuccess("Download deleted");
      		await this.getDownloads();
    		} else {
      		this.toastError(data.ret_det.message);
    		}
  		} catch (e) {
    		console.log(e);
  		}
		},
		convertCategory(cat) {
			if(cat == "sectorFiles") return "Facility Files";
			else if(cat == "training") return "References";
			else if(cat == "mfr") return "SOP/LOA";
            else if(cat == "ins") return "Instructor";
			else return "Miscellaneous";
		}
	},
};
</script>

<style scoped lang="scss">
.controller_list {
	padding: 10px;
}

.table_wrapper {
	width: 100%;
	overflow: auto;
}

.controller_list_head {
	position: relative;
	font-weight: 700;
	border-bottom: 1px solid #666;
}

.controller_list_row {
	tr {
		transition: background-color .3s ease;
		&:hover {
			background: #eaeaea;
		}
	}

	div {
		padding: 0.5rem 1rem;
	}

	.name {
		font-weight: 700;
	}
}

.no_downloads {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.modal_delete {
	min-width: 400px;
	width: 30%;
}
</style>