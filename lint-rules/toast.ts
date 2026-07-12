import { Rule } from 'eslint';
import { CallExpression } from 'estree';

export const toastPunctuationRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce punctuation at the end of the second argument in toast calls.',
      recommended: false,
    },
    schema: [], // No options needed for this rule
    messages: {
      missingPunctuation:
        'Arguments of toast calls must end with a punctuation mark (., !, or ?).',
    },
  },

  create(context: Rule.RuleContext) {
    // Valid punctuation characters
    const allowedPunctuation = ['.', '!', '?'];

    return {
      CallExpression(node: CallExpression) {
        // 1. Check if the function being called is 'toast...'
        // This handles both standalone calls: toast...()
        // and property calls: this.toast...() or obj.toast...()
        const isToastCall =
          (node.callee.type === 'Identifier' &&
            node.callee.name === 'toastError') ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.property.type === 'Identifier' &&
            (node.callee.property.name === 'toastError' ||
              node.callee.property.name === 'toastSuccess' ||
              node.callee.property.name === 'toastInfo' ||
              node.callee.property.name === 'toastWarning'));

        if (!isToastCall) {
          return;
        }

        // 2. Ensure there is a second argument
        const firstArg = node.arguments[0];
        const secondArg = node.arguments[1];
        if (!firstArg || !secondArg) {
          return;
        }

        // 3. Handle standard String Literals (e.g., "An error occurred")
        if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
          const str = firstArg.value.trim();
          const lastChar = str.charAt(str.length - 1);

          if (!allowedPunctuation.includes(lastChar)) {
            context.report({
              node: firstArg,
              messageId: 'missingPunctuation',
            });
          }
        }

        if (
          secondArg.type === 'Literal' &&
          typeof secondArg.value === 'string'
        ) {
          const str = secondArg.value.trim();
          const lastChar = str.charAt(str.length - 1);

          if (!allowedPunctuation.includes(lastChar)) {
            context.report({
              node: secondArg,
              messageId: 'missingPunctuation',
            });
          }
        }

        // 4. Handle Template Literals (e.g., `Failed to load ${data}`)
        // Note: This only reliably checks if the template ends in static text, not a variable.
        if (firstArg.type === 'TemplateLiteral') {
          const lastQuasis = firstArg.quasis[firstArg.quasis.length - 1];
          if (lastQuasis && lastQuasis.value.cooked) {
            const str = lastQuasis.value.cooked.trim();
            // Only check if it actually ends with text, not a variable expression like `${err}`
            if (str.length > 0) {
              const lastChar = str.charAt(str.length - 1);
              if (!allowedPunctuation.includes(lastChar)) {
                context.report({
                  node: secondArg,
                  messageId: 'missingPunctuation',
                });
              }
            }
          }
        }

        if (secondArg.type === 'TemplateLiteral') {
          const lastQuasis = secondArg.quasis[secondArg.quasis.length - 1];
          if (lastQuasis && lastQuasis.value.cooked) {
            const str = lastQuasis.value.cooked.trim();
            // Only check if it actually ends with text, not a variable expression like `${err}`
            if (str.length > 0) {
              const lastChar = str.charAt(str.length - 1);
              if (!allowedPunctuation.includes(lastChar)) {
                context.report({
                  node: secondArg,
                  messageId: 'missingPunctuation',
                });
              }
            }
          }
        }
      },
    };
  },
};
