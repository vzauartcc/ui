<template>
	<div :id="cat" class="col s12">
		<div v-if="!ins || !certs"><Spinner /></div>
		<div class="document" v-else v-for="k in Object.keys(docs)" :key="k">
			<div class="card-title">
				<div v-if="ins.find((x) => x.cid === +k)">
					Students for {{ ins.find((x) => x.cid === +k).fname }}
					{{ ins.find((x) => x.cid === +k).lname }} ({{ docs[k].length }})
				</div>
				<div v-else-if="certs.find((c) => c.code === k)">
					Students for {{ certs.find((c) => c.code === k).name }} ({{ docs[k].length }})
				</div>
				<div v-else>Students on Waitlist ({{ docs[k].length }})</div>
			</div>

			<table>
				<thead>
					<tr>
						<td>Student</td>
						<td>Student Rating</td>
						<td>Instructor</td>
						<td>Milestone</td>
						<td>
							<span v-if="cat === 'all'">Waitlist Date</span><span v-else>Assigned Date</span>
						</td>
						<td class="options" v-if="user.data.isSeniorStaff">Options</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="value in docs[k]" :key="value._id">
						<td>{{ value.student.fname }} {{ value.student.lname }}</td>
						<td>{{ getShortRating(+value.student.rating) }}</td>
						<td>
							<span v-if="+value.instructorCid === -1">Unassigned</span
							><span v-else>{{ value.instructor.fname }} {{ value.instructor.lname }}</span>
						</td>
						<td>{{ value.certification.name }}</td>
						<td>
							<span v-if="cat === 'all'">{{ dShort(value.createdAt) }}</span
							><span v-else-if="value.assignedDate">{{ dShort(value.assignedDate) }}</span>
							<span v-else>On Waitlist</span>
						</td>
						<td class="options" v-if="user.data.isSeniorStaff">
							<a
								href="#"
								@click.prevent="openEdit(value._id)"
								data-position="top"
								data-tooltip="Edit Waitlist Entry"
								class="tooltipped"
								><i class="material-icons">edit</i></a
							>
							<a
								href="#"
								@click.prevent="openDelete(value._id)"
								data-position="top"
								data-tooltip="Delete Waitlist Entry"
								class="tooltipped"
								><i class="material-icons red-text text-darken-2">delete</i></a
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="card-content" v-if="docs && docs.all && docs.all.length > 0">
			<p>
				{{ assignedPercentage }}% assigned
				<i v-if="assignedPercentage === '100'" class="material-icons green-text">celebration</i>
			</p>
			<p>Average Wait: {{ averageWaitTime }} days</p>
			<p v-if="oldest && user.data.isInstructor">
				Longest Wait: {{ oldest.student.fname }} {{ oldest.student.lname }} ({{
					((Date.now() - new Date(oldest.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(0)
				}}
				days)
			</p>
			<p v-if="user.data.isInstructor">
				Average Instructor Load: {{ averageInstructorLoad }} students
			</p>
			<p v-if="busiestInstructor && user.data.isInstructor">
				Busiest Instructor: {{ ins.find((i) => i.cid === busiestInstructor)?.fname || 'A former' }}
				{{ ins.find((i) => i.cid === busiestInstructor)?.lname || 'Instructor' }} ({{
					docs.all.filter((x) => x.instructorCid === busiestInstructor).length
				}}
				students)
			</p>
			<p v-if="busiestCertCode">
				Busiest milestone: {{ certs.find((c) => c.code === busiestCertCode).name }} ({{
					docs.all.filter((x) => x.certCode === busiestCertCode).length
				}}
				students)
			</p>
		</div>
	</div>
</template>

<script>
import { getRatingShort } from '@/helpers/rating.js';
import { mapState } from 'vuex';

export default {
	data() {
		return {};
	},
	async mounted() {
		M.FormSelect.init(document.querySelectorAll('select'), {});
	},
	methods: {
		openDelete(id) {
			this.$emit('deleteModal', id);
		},
		openEdit(id) {
			this.$emit('editModal', id);
		},
		getShortRating(idx) {
			return getRatingShort(idx);
		},
	},
	computed: {
		...mapState('user', ['user']),
		unassigned() {
			if (!this.docs) return [];

			return this.docs
				.filter((w) => w.instructorCid === -1)
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		},
		assignedPercentage() {
			if (!this.docs || this.docs.all.length === 0) {
				return 0;
			}

			const assignedCount = this.docs.all.filter((w) => w.instructorCid !== -1).length;

			return ((assignedCount / this.docs.all.length) * 100).toFixed(0);
		},
		oldest() {
			if (!this.docs) return {};

			return this.docs.all
				.filter((w) => w.instructorCid === -1)
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
		},
		busiestCertCode() {
			const allDocs = this.docs.all;
			if (!allDocs || allDocs.length === 0) {
				return null;
			}

			const certCodeCounts = allDocs.reduce((acc, doc) => {
				const code = doc.certCode;
				acc[code] = (acc[code] || 0) + 1;
				return acc;
			}, {});

			let maxCount = -1;
			let mostFrequentCode = null;

			for (const code in certCodeCounts) {
				if (certCodeCounts[code] > maxCount) {
					maxCount = certCodeCounts[code];
					mostFrequentCode = code;
				}
			}

			return mostFrequentCode;
		},
		busiestInstructor() {
			const allDocs = this.docs.all;
			if (!allDocs || allDocs.length === 0) {
				return null;
			}

			const assignedDocs = allDocs.filter((doc) => doc.instructorCid !== -1);

			if (assignedDocs.length === 0) {
				return null;
			}

			const instructorCounts = assignedDocs.reduce((acc, doc) => {
				const id = doc.instructorCid;
				acc[id] = (acc[id] || 0) + 1;
				return acc;
			}, {});

			let maxCount = -1;
			let busiestId = null;

			for (const idString in instructorCounts) {
				const count = instructorCounts[idString];
				if (count > maxCount) {
					maxCount = count;
					busiestId = Number(idString); // Convert key back to number
				}
			}
			return busiestId;
		},
		averageInstructorLoad() {
			const allDocs = this.docs.all;
			if (!allDocs || allDocs.length === 0) {
				return 0;
			}

			const assignedDocs = allDocs.filter((doc) => doc.instructorCid !== -1);
			const totalAssignedDocuments = assignedDocs.length;

			if (totalAssignedDocuments === 0) {
				return 0;
			}

			const uniqueInstructorCids = new Set();
			assignedDocs.forEach((doc) => {
				uniqueInstructorCids.add(doc.instructorCid);
			});

			const numberOfUniqueInstructors = uniqueInstructorCids.size;

			if (numberOfUniqueInstructors === 0) {
				return 0;
			}

			const averageLoad = totalAssignedDocuments / numberOfUniqueInstructors;

			return Number(averageLoad.toFixed(1));
		},
		averageWaitTime() {
			const allDocs = this.docs.all;
			if (!allDocs || allDocs.length === 0) {
				return 0;
			}

			const assignedDocs = allDocs.filter((d) => d.instructorCid !== -1 && d.assignedDate);

			if (assignedDocs.length === 0) {
				return 0;
			}

			const totalWait = assignedDocs.reduce((sum, entry) => {
				const created = new Date(entry.createdAt).getTime();
				const assigned = new Date(entry.assignedDate).getTime();
				return sum + (assigned - created);
			}, 0);

			const avgMs = totalWait / assignedDocs.length;

			const avgDays = avgMs / (1000 * 60 * 60 * 24);

			return avgDays.toFixed(1);
		},
	},
	props: ['cat', 'docs', 'certs', 'ins'],
};
</script>

<style lang="scss" scoped>
.document {
	padding: 1em 1em 5em 1em;
	transition: background-color 0.3s ease;

	&:nth-of-type(odd) {
		background: hsla(0, 0%, 94.9%, 0.5);
	}

	&:hover {
		background: #eaeaea;
	}
}

.no_files {
	padding: 1.5em 1em;
	font-style: italic;
}
</style>
