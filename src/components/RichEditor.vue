<script setup lang="ts">
import { Icon } from '@iconify/vue';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { watch } from 'vue';

const props = defineProps<{ content: string }>();

const emit = defineEmits(['updateEditor']);

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: {
        openOnClick: false,
        defaultProtocol: 'https',
      },
    }),
  ],
  content: props.content || '',
  onUpdate: (props) => {
    emit('updateEditor', props.editor.getHTML());
  },
});

watch(
  () => props.content,
  (newVal) => {
    if (editor.value?.getHTML() === newVal) return;

    editor.value?.commands.setContent(newVal);
  },
);

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) {
    return;
  }

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run();
};
</script>

<template>
  <div class="control-group bg-sec-gray-600 border">
    <div class="button-group flex flex-wrap gap-x-3 items-center">
      <span v-tooltip.top="'Bold'">
        <Icon
          @click="editor?.chain().focus().toggleBold().run()"
          :disabled="!editor?.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor?.isActive('bold') }"
          icon="heroicons:bold" />
      </span>
      <span v-tooltip.top="'Italic'">
        <Icon
          @click="editor?.chain().focus().toggleItalic().run()"
          :disabled="!editor?.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor?.isActive('italic') }"
          icon="heroicons:italic" />
      </span>
      <span v-tooltip.top="'Strike-through'">
        <Icon
          @click="editor?.chain().focus().toggleStrike().run()"
          :disabled="!editor?.can().chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor?.isActive('strike') }"
          icon="heroicons:strikethrough" />
      </span>
      <span v-tooltip.top="'Underline'">
        <Icon
          @click="editor?.chain().focus().toggleUnderline().run()"
          :disabled="!editor?.can().chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor?.isActive('underline') }"
          icon="heroicons:underline" />
      </span>
      <span v-tooltip.top="'Inline Code'">
        <Icon
          @click="editor?.chain().focus().toggleCode().run()"
          :disabled="!editor?.can().chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor?.isActive('code') }"
          icon="heroicons:code-bracket" />
      </span>
      <span v-tooltip.top="'Heading 1'">
        <Icon
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
          icon="heroicons:h1" />
      </span>
      <span v-tooltip.top="'Heading 2'">
        <Icon
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
          icon="heroicons:h2" />
      </span>
      <span v-tooltip.top="'Heading 3'">
        <Icon
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
          icon="heroicons:h3" />
      </span>
      <span v-tooltip.top="'Unordered List'">
        <Icon
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor?.isActive('bulletList') }"
          icon="heroicons:list-bullet" />
      </span>
      <span v-tooltip.top="'Ordered List'">
        <Icon
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor?.isActive('orderedList') }"
          icon="heroicons:numbered-list" />
      </span>
      <span v-tooltip.top="'Code Block'">
        <Icon
          @click="editor?.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor?.isActive('codeBlock') }"
          icon="heroicons:code-bracket-square" />
      </span>
      <span v-tooltip.top="'Link'">
        <Icon
          @click="setLink"
          :disabled="!editor?.can().chain().focus().toggleLink().run()"
          :class="{ 'is-active': editor?.isActive('link') }"
          icon="heroicons:link" />
      </span>
      <span
        v-tooltip.top="'Horizontal Line'"
        @click="editor?.chain().focus().setHorizontalRule().run()"
        class="cursor-pointer"
        >HR</span
      >
      <span>|</span>
      <span v-tooltip.top="'Undo'">
        <Icon
          @click="editor?.chain().focus().undo().run()"
          :disabled="!editor?.can().chain().focus().undo().run()"
          icon="heroicons:arrow-uturn-left" />
      </span>
      <span v-tooltip.top="'Redo'">
        <Icon
          @click="editor?.chain().focus().redo().run()"
          :disabled="!editor?.can().chain().focus().redo().run()"
          icon="heroicons:arrow-uturn-right" />
      </span>
    </div>
  </div>
  <editor-content
    :editor="editor"
    class="editor prose dark:prose-invert max-w-none w-full border p-1" />
</template>

<style lang="css" scoped>
.editor {
  border-radius: 0px 0px var(--radius-xl) var(--radius-xl);
  border-top: none !important;
}

.control-group {
  border-bottom: 1px solid black !important;
  border-radius: var(--radius-xl) var(--radius-xl) 0px 0px;
}
.is-active {
  border: 1px solid black;
  border-radius: 2px;
}

.tiptap {
  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: var(--purple-light);
    border-radius: 0.4rem;
    color: var(--black);
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: var(--black);
    border-radius: 0.5rem;
    color: var(--white);
    font-family: 'JetBrainsMono', monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;

    code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }
  }

  blockquote {
    border-left: 3px solid var(--gray-3);
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid var(--gray-2);
    margin: 2rem 0;
  }
}
</style>
