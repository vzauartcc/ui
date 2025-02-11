<template>
	<div class="card">
		<div class="card-content">
			<div class="row row_no_margin">
				<div class="card-title col s8"><span class="card-title">Documents</span></div>
				<div class="col s4"><router-link to="/admin/files/documents/new"><span class="btn waves-effect wabes-light new_event_button right">New</span></router-link></div>
			</div>
		</div>
		<div class="loading_container" v-if="documents === null">
			<Spinner />
		</div>
		<div class="no_documents" v-else-if="documents && documents.length === 0">There are no documents</div>
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
          <tr v-for="(doc, i) in documents" :key="doc.id">
            <td class="name">
              <router-link :to="`/files/documents/${doc.slug}`">{{ doc.name }}</router-link>
            </td>
            <td>{{ convertCategory(doc.category) }}</td>
            <td>{{ dtLong(doc.updatedAt) }}</td>
            <td class="options">
              <router-link data-position="top" data-tooltip="Edit Document" class="tooltipped" :to="`/admin/files/documents/${doc.slug}`">
                <i class="material-icons">edit</i>
              </router-link>
              <a href="#" data-position="top" data-tooltip="Delete Document" class="tooltipped modal-trigger" @click.prevent="openModal(i)">
                <i class="material-icons red-text text-darken-2">delete</i>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
		<teleport to="body">
      <div v-for="(doc, i) in documents" :key="`modal_${i}`">
        <div :id="`modal_delete_${i}`" class="modal modal_delete">
          <div class="modal-content">
            <h4>Delete document?</h4>
            <p>This will delete <b>{{ doc.name }}</b> from the documents section completely.</p>
          </div>
          <div class="modal-footer">
            <a href="#" class="waves-effect waves-light btn" @click.prevent="deleteDownload(doc._id, i)">Delete</a>
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
	name: 'Documents',
	title: 'Documents',
	data() {
		return {
			documents: null
		};
	},
	async mounted() {
		await this.getDocuments();
		this.$nextTick(() => {
			M.Tooltip.init(document.querySelectorAll('.tooltipped'), {});
		});
	},
	updated() {
    this.$nextTick(() => {
      this.initModals();
    });
  },
	methods: {
		async getDocuments() {
			const {data} = await zabApi.get('/file/documents');
			this.documents = data.data;
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
  		try {
    		console.log("🛠️ deleteDownload called with:", { id, modalId });

    		// 🔥 Start API deletion request immediately
    		const deletePromise = zabApi.delete(`/file/documents/${id}`);

    		// 🕒 **Wait 500ms before closing the modal**
    		setTimeout(() => {
      		const modal = document.getElementById(modalId);
      		if (modal) {
        		M.Modal.getInstance(modal).close();
        		console.log("✅ Modal closed after 500ms delay");
      		}
    		}, 500);

    		// 🚀 Await API response after starting the delete request
    		const { data } = await deletePromise;

    		if (data.ret_det.code === 200) {
      		this.toastSuccess("Document successfully deleted");
      		await this.getDocuments(); // ✅ Refresh the document list
    		} else {
      		this.toastError(data.ret_det.message);
    		}
  		} catch (e) {
    		console.log(e);
  		}
		},
		convertCategory(cat) {
			if(cat == "loa") return "Agreements";
			else if(cat == "sop") return "Procedures";
			else if(cat == "policy") return "Policies";
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

.no_documents {
	padding: 0 1em 1em 1em;
	margin-top: -1em;
	font-style: italic;
}

.modal_delete {
	min-width: 400px;
	width: 30%;
}
</style>