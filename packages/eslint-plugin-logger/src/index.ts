import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'
import { Reference } from 'eslint-scope'
import { CallExpression } from 'typescript'

import { getVariableByName } from './utils'

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/shapeshift/lib/tree/main/packages/eslint-plugin-logger',
)

function isMemberAccess(reference: Reference) {
  const node = reference.identifier as TSESTree.Node
  const parent = node.parent

  return parent?.type === 'MemberExpression' && parent.object === node
}

function isConsole(reference: Reference) {
  const id = reference.identifier

  return id && id.name === 'console'
}

const rule = createRule({
  name: 'no-native-console',
  defaultOptions: [],
  meta: {
    fixable: 'code',
    type: 'problem',
    messages: {
      noNativeConsole: 'No native console.* methods allowed, use moduleLogger.* instead',
    },
    docs: {
      description: '',
      recommended: 'error',
    },
    schema: [],
  },
  create(context) {
    function report(reference: Reference) {
      const node = reference.identifier as TSESTree.Node
      // @ts-ignore FIXME
      const consoleCallNode = node.parent.parent as CallExpression

      context.report({
        node: consoleCallNode as unknown as TSESTree.Node,
        loc: node.loc,
        messageId: 'noNativeConsole',
      })
    }

    return {
      Program() {
        const scope = context.getScope()
        // @ts-ignore FIXME
        const consoleVar = getVariableByName(scope, 'console')
        const shadowed = consoleVar && consoleVar.defs.length > 0

        /*
         * 'scope.through' includes all references to undefined
         * variables. If the variable 'console' is not defined, it uses
         * 'scope.through'.
         */
        const references = consoleVar
          ? consoleVar.references
          : // @ts-ignore FIXME
            scope.through.filter(isConsole)

        if (!shadowed) {
          references
            // @ts-ignore FIXME
            .filter(isMemberAccess)
            // @ts-ignore FIXME
            .filter((reference) => {
              const node = reference.identifier
              const consoleMethod = node.parent.property.name

              return consoleMethod !== 'consoleFn' // Exclude moduleLogger itself from being reported
            })
            .forEach(report)
        }
      },
    }
  },
})

export const rules = [rule]
