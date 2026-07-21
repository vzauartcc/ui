import { Rule } from 'eslint';

export const useTitleEnforcementRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the use of useTitle in all Vue views.',
      recommended: false,
    },
    schema: [], // No options needed for this rule
    messages: {
      missingUseTitle:
        'Vue views in src/views must contain a call to "useTitle()".',
    },
  },

  create(context: Rule.RuleContext) {
    const filename = context.filename;

    // Only apply rule to .vue files inside src/views
    const isViewFile = /[\\/]src[\\/]views[\\/].*\.vue$/.test(filename);
    if (!isViewFile) {
      return {};
    }

    let hasUseTitleCall = false;

    return {
      CallExpression(node) {
        if (
          (node.callee.type === 'Identifier' &&
            node.callee.name === 'useTitle') ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'useTitle')
        ) {
          hasUseTitleCall = true;
        }
      },
      'Program:exit'(node) {
        if (!hasUseTitleCall) {
          context.report({
            node,
            messageId: 'missingUseTitle',
          });
        }
      },
    };
  },
};
