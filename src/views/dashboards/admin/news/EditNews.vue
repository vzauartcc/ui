<script setup lang="ts">
import RichEditor from '@/components/RichEditor.vue';
import { newsService } from '@/services/news/news.service';
import type { INewsArticle } from '@/services/news/news.types';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug;

const router = useRouter();

const initialValues = ref({
  title: '',
  content: '',
});
const article = ref<INewsArticle | null>(null);

onMounted(async () => {
  if (!slug) return;

  if (slug === 'new') {
    useTitle('Create Article');
    article.value = {} as INewsArticle;
    return;
  }

  try {
    useTitle('Edit Article');
    const data = await newsService.getArticle(slug);

    article.value = data;
    initialValues.value = {
      title: data.title,
      content: data.content,
    };
  } catch (e) {
    console.error('error getting news article', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.title) {
    errors.title = [{ message: 'Title is required' }];
  }

  if (!values.content) {
    errors.content = [{ message: 'Content is required' }];
  }

  return {
    values,
    errors,
  };
};

const onSubmit = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  try {
    if (article.value?.uriSlug) {
      await newsService.editArticle(
        article.value.uriSlug,
        values.title,
        values.content,
      );
    } else {
      await newsService.createArticle(values.title, values.content);
    }

    toastSuccess('Article Saved!', 'Article was successfuly saved.');
    router.push('/admin/news');
  } catch (e) {
    console.error('error saving article', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!article" />
  <Card v-else>
    <template #title
      >{{ article.uriSlug ? 'Edit' : 'Create' }} News Article</template
    >
    <template #content>
      <Form v-slot="$form" :initialValues :resolver @submit="onSubmit">
        <div class="grid grid-cols-1 gap-5">
          <FormField v-slot="$field" name="title">
            <FloatLabel variant="on">
              <InputText id="title" class="w-full" />
              <label for="title" class="required-field">Title</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField v-slot="$field" name="content">
            <RichEditor
              :content="$field.value"
              @updateEditor="$form.content!.value = $event" />
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <div class="flex justify-end">
            <Button
              type="submit"
              :label="`${article.uriSlug ? 'Save!' : 'Post!'}`"
              :disabled="
                !$form?.valid ||
                !$form?.content?.valid ||
                !$form?.title?.valid ||
                ($form?.title?.pristine && $form?.content?.pristine)
              " />
          </div>
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
