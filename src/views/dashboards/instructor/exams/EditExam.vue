<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { examService } from '@/services/exam/exam.service';
import type { IExam, IQuestion } from '@/services/exam/exam.types';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import {
  Form,
  FormField,
  type FormInstance,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface IOption {
  _id: string;
  text: string;
  isCorrect: boolean;
}
const defaultOption: IOption = {
  _id: '',
  text: '',
  isCorrect: false,
};

const router = useRouter();
const route = useRoute();
const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;
const loading = ref(true);

const milestones = ref<ICertification[]>([]);

const formRef = useTemplateRef<FormInstance>('formRef');
const initialValues = ref({
  _id: '',
  title: '',
  description: '',
  questions: [] as IQuestion[],
  certCode: '',
  isActive: true,
});

const questionVisible = ref(false);
const questionDialog = ref<Partial<IQuestion> & { id: number }>({
  _id: '',
  text: '',
  isActive: true,
  options: [
    { ...defaultOption },
    { ...defaultOption },
    { ...defaultOption },
    { ...defaultOption },
  ] as IOption[],
  id: -1,
});

onMounted(async () => {
  try {
    const data = await controllerService.getCertifications();

    milestones.value = data;
  } catch (e) {
    console.error('error getting milestones', e);
  }

  if (!id) {
    loading.value = false;
    return;
  }

  try {
    const data = await examService.getExam(id);

    initialValues.value = {
      _id: data._id,
      title: data.title,
      description: data.description,
      questions: data.questions,
      certCode: data.certCode,
      isActive: data.isActive,
    };

    loading.value = false;
  } catch (e) {
    console.error('error getting exam details', e);
  }
});

const resolver = ({
  values,
}: FormResolverOptions & { values: Partial<IExam> }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.title || values.title === undefined) {
    errors.title = [{ message: 'Title is required.' }];
  }

  if (!values.description || values.description === undefined) {
    errors.description = [{ message: 'Description is required.' }];
  }

  if (!values.certCode || values.certCode === undefined) {
    errors.certCode = [{ message: 'Milestone is required.' }];
  }

  if (
    !values.questions ||
    values.questions === undefined ||
    values.questions.length < 1
  ) {
    errors.questions = [{ message: 'At least one question is required.' }];
  }

  return {
    values,
    errors,
  };
};

const removeOption = (index: number) => {
  const tmp: IOption[] = [];
  for (let i = 0; i < questionDialog.value.options!.length; i++) {
    if (i === index) {
      continue;
    }

    tmp.push(questionDialog.value.options![i]!);
  }

  questionDialog.value.options = tmp;
};

const addOption = () => {
  questionDialog.value.options!.push(defaultOption);
};

const setTrueFalse = () => {
  questionDialog.value.options = [
    {
      text: 'True',
      isCorrect: false,
      _id: '',
    },
    {
      text: 'False',
      isCorrect: false,
      _id: '',
    },
  ];
};

const saveQuestion = (doAnother: boolean) => {
  if (!formRef.value) {
    return;
  }

  questionDialog.value.options = questionDialog.value.options!.filter(
    (o) => o.text !== '',
  );

  if (questionDialog.value.id !== -1) {
    formRef.value.states.questions!.value[questionDialog.value.id] =
      questionDialog.value;
  } else {
    questionDialog.value.options = questionDialog.value.options.map(
      ({ _id, ...o }) => ({ _id: '', ...o }),
    );
    formRef.value.states.questions!.value.push({ ...questionDialog.value });
  }

  questionDialog.value = {
    _id: '',
    text: '',
    isActive: true,
    options: [
      { ...defaultOption },
      { ...defaultOption },
      { ...defaultOption },
      { ...defaultOption },
    ],
    id: -1,
  };

  if (!doAnother) {
    closeDialog();
    return;
  }
};

const closeDialog = () => {
  questionDialog.value = {
    _id: '',
    text: '',
    isActive: true,
    options: [
      { ...defaultOption },
      { ...defaultOption },
      { ...defaultOption },
      { ...defaultOption },
    ],
    id: -1,
  };

  questionVisible.value = false;
};

const deleteQuestion = (index: number) => {
  if (!formRef.value) return;

  const currentQuestions = [
    ...((formRef.value.states.questions?.value as IQuestion[]) || []),
  ];

  currentQuestions.splice(index, 1);

  formRef.value.setFieldValue('questions', currentQuestions);
};

const editQuestion = (index: number) => {
  if (!formRef.value) return;

  const data = formRef.value.states.questions!.value[index];
  if (!data) return;

  questionDialog.value = {
    _id: data._id,
    id: index,
    text: data.text,
    options: data.options,
    isActive: data.isActive,
  };

  questionVisible.value = true;
};

const saveExam = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  values.questions = values.questions.map((q: IQuestion) => {
    if (q._id === '') {
      const { _id, ...rest } = q;
      return rest;
    }
    return q;
  });

  try {
    if (values._id !== '') {
      await examService.editExam(values._id, values as IExam);

      toastSuccess('Exam Saved!', 'Changes to the exam have been saved.');
    } else {
      await examService.createExam(values as IExam);

      toastSuccess('Exam Created!', 'The exam has been created.');
    }

    router.push('/ins/exams');
  } catch (e) {
    console.error('error saving exam', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="loading" />
  <Card v-else>
    <template #title>
      <span v-if="id">Edit Exam - {{ initialValues.title }}</span>
      <span v-else>Create Exam</span>
    </template>
    <template #content>
      <Form
        ref="formRef"
        v-slot="$form"
        :resolver
        :initialValues="initialValues"
        @submit="saveExam">
        <div class="grid grid-cols-1 gap-5">
          <!-- Hidden field to load _id into the form. -->
          <FormField name="_id" class="hidden">
            <InputText id="_id" disabled />
          </FormField>
          <FormField v-slot="$field" name="title">
            <FloatLabel variant="on">
              <InputText id="title" class="w-1/2" maxlength="100" />
              <label for="title" class="required-field">Exam Name</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FormField v-slot="$field" name="description">
            <FloatLabel variant="on">
              <Textarea id="title" :maxlength="1000" class="w-full" />
              <label for="title" class="required-field">Exam Description</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FormField v-slot="$field" name="certCode">
            <FloatLabel variant="on">
              <Select
                :options="milestones"
                filter
                optionLabel="name"
                optionValue="code"
                class="w-1/3" />
              <label for="title" class="required-field">Milestone</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField v-slot="$field" name="isActive" class="flex flex-1 gap-3">
            <Checkbox binary id="isActive" />
            <span class="required-field">Active?</span>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FormField v-slot="$field" name="questions">
            <DataTable :value="$field.value || []" size="small" stripedRows>
              <template #header>
                <Button label="Add Question" @click="questionVisible = true" />
              </template>
              <Column field="text" header="Question" />
              <Column field="isActive" header="Active">
                <template #body="{ data }">
                  {{ data.isActive ? 'Active' : 'Inactive' }}
                </template>
              </Column>
              <Column
                field="options"
                header="Options"
                bodyClass="text-right"
                headerClass="text-right">
                <template #body="{ data, index }">
                  <span
                    v-tooltip.top="'Edit Question'"
                    @click="editQuestion(index)">
                    <Icon icon="heroicons:pencil" />
                  </span>
                  <span
                    v-if="data._id === ''"
                    class="text-red-500"
                    v-tooltip.top="'Delete Question'"
                    @click="deleteQuestion(index)">
                    <Icon icon="heroicons:trash" />
                  </span>
                </template>
              </Column>
              <template #footer>
                <p>
                  <strong class="text-red-500">Note:</strong> Question order is
                  shuffled upon assignment. Do not create questions that
                  reference other questions.
                </p>
              </template>
            </DataTable>
          </FormField>

          <Button
            type="submit"
            severity="success"
            :disabled="!$form?.valid || initialValues.questions.length < 1">
            <span v-if="id">Save!</span>
            <span v-else>Create!</span>
          </Button>
        </div>
      </Form>
    </template>
  </Card>
  <Dialog
    modal
    v-model:visible="questionVisible"
    class="md:w-1/2"
    @hide="closeDialog"
    :header="questionDialog._id !== '' ? 'Edit Question' : 'Create Question'">
    <div class="grid grid-cols-1 gap-3">
      <FloatLabel variant="on" class="mt-2">
        <Textarea
          class="w-full"
          v-model="questionDialog.text"
          name="text"
          maxlength="400" />
        <label for="text" class="required-field">Question</label>
      </FloatLabel>

      <div class="flex flex-1 gap-3">
        <Checkbox binary v-model="questionDialog.isActive" name="isActive" />
        <span class="required-field">Active?</span>
      </div>

      <div class="grid grid-cols-2 w-1/2 gap-3">
        <Button label="Add Option" @click="addOption" />
        <Button label="True/False" @click="setTrueFalse" severity="danger" />
      </div>
      <Message severity="warn" size="small"
        >Option order is shuffled upon exam assignment. Do not create options
        that reference other options. Ex:
        <span class="font-bold">"All answers are correct"</span> instead of "All
        above answers are correct".
      </Message>
      <div class="grid grid-cols-1 gap-3">
        <span class="w-1/8">Correct Answer</span>
        <div
          v-for="(option, idx) of questionDialog.options"
          :key="idx"
          class="flex items-center gap-3">
          <Checkbox v-model="option.isCorrect" binary class="w-1/8" />
          <Textarea v-model="option.text" class="w-full" maxlength="400" />
          <span
            class="text-red-500"
            v-tooltip.top="'Delete Option'"
            @click="removeOption(idx)">
            <Icon icon="heroicons:trash" />
          </span>
        </div>
      </div>
      <Message
        v-if="!questionDialog.options!.some((o) => o.isCorrect === true)"
        severity="error"
        size="small"
        variant="simple"
        >At least one answer is required to be marked as correct.</Message
      >

      <div class="flex justify-between w-full mt-5">
        <Button
          label="Save + Create Another"
          @click="saveQuestion(true)"
          :disabled="
            !questionDialog.options!.some((o) => o.isCorrect === true)
          " />
        <div class="flex gap-3">
          <Button
            label="Save"
            severity="success"
            @click="saveQuestion(false)"
            :disabled="
              !questionDialog.options!.some((o) => o.isCorrect === true)
            " />
          <Button outlined @click="closeDialog" label="Close" />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style lang="css" scoped></style>
