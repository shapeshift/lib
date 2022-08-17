import { JSXMemberExpression } from '@typescript-eslint/types/dist/generated/ast-spec'
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'
import { Reference } from 'eslint-scope'
import path from 'path'
import { CallExpression } from 'typescript'

import { getVariableByName } from './utils'

const createRule = ESLintUtils.RuleCreator(() => 'github.com/shapeshift/lib')

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
      noNativeConsole: 'No native console.* allowed, use moduleLogger.* instead',
    },
    docs: {
      description: '',
      recommended: 'error',
    },
    schema: [],
  },
  create(context) {
    function report(reference: Reference) {
      const sourceCode = context.getSourceCode()
      const node = reference.identifier as TSESTree.Node
      const consoleMethod = (node.parent as JSXMemberExpression).property.name
      // @ts-ignore FIXME
      const consoleCallNode = node.parent.parent as CallExpression

      // Get logger as a module-level variable i.e import - if already defined, we shouldn't re-import it
      const isLoggerDefined = getVariableByName(
        // @ts-ignore FIXME
        sourceCode.scopeManager.globalScope.childScopes[0],
        'logger',
      )

      context.report({
        node: consoleCallNode as unknown as TSESTree.Node,
        loc: node.loc,
        messageId: 'noNativeConsole',
        fix(fixer) {
          const filePath = context.getFilename()
          const fileName = path.parse(filePath).name
          switch (consoleMethod) {
            case 'error':
            case 'warn': {
              const argv = consoleCallNode.arguments
              const [firstArg, secondArg, ...restArgs] = argv
              const [errorOrWarning, errorTextOrWarningText] =
                // Handle both (errorTextOrWarningText, errorOrWarning) / (errorOrWarning) arities
                argv.length === 1
                  ? [firstArg as TSESTree.StringLiteral | unknown as TSESTree.Identifier]
                  : [
                      secondArg as TSESTree.StringLiteral | unknown as TSESTree.Identifier,
                      firstArg as TSESTree.StringLiteral | unknown as TSESTree.Identifier,
                    ]
              const parsedErrorOrWarning =
                (errorOrWarning as unknown as TSESTree.StringLiteral).raw ??
                (errorOrWarning as unknown as TSESTree.Identifier).name
              const parsedErrorTextOrWarningText =
                (errorTextOrWarningText as unknown as TSESTree.StringLiteral)?.raw ??
                (errorTextOrWarningText as unknown as TSESTree.Identifier)?.name ??
                null
              const parsedrestArgs = (restArgs || [])
                .map(
                  // @ts-ignore FIXME
                  (restArgsArg: TSESTree.StringLiteral | TSESTree.Identifier) =>
                    (restArgsArg as TSESTree.StringLiteral).raw ??
                    (restArgsArg as TSESTree.Identifier).name ??
                    null,
                )
                .filter(Boolean)
              const parsedArgv = [
                parsedErrorOrWarning,
                parsedErrorTextOrWarningText,
                ...parsedrestArgs,
              ]
                .filter(Boolean)
                .join(',')

              const maybeInsertLoggerImport = isLoggerDefined
                ? []
                : [
                    // Insert moduleLogger import and moduleLogger at first source line, both will be auto-sorted
                    fixer.insertTextBefore(
                      sourceCode.ast,
                      `
                  import { logger } from 'lib/logger';
                  const moduleLogger = logger.child({ namespace: ['${fileName}'] })
                  `,
                    ),
                  ]
              return [
                ...maybeInsertLoggerImport,
                fixer.replaceText(
                  consoleCallNode as unknown as TSESTree.Node,
                  `moduleLogger.${consoleMethod}(${parsedArgv})`,
                ), // Raw litteral, or var name
              ]
            }
            case 'info': {
              const argv = consoleCallNode.arguments
              // @ts-ignore FIXME
              const makeCookedTemplateLitteral = (arg) =>
                arg.quasis?.[0]?.value?.cooked ? `\`${arg.quasis?.[0]?.value?.cooked}\`` : null

              const maybeInsertLoggerImport = isLoggerDefined
                ? []
                : [
                    // Insert moduleLogger import and moduleLogger at first source line, both will be auto-sorted
                    fixer.insertTextBefore(
                      sourceCode.ast,
                      `
                  import { logger } from 'lib/logger';
                  const moduleLogger = logger.child({ namespace: ['${fileName}'] })
                  `,
                    ),
                  ]
              return [
                ...maybeInsertLoggerImport,
                fixer.replaceText(
                  consoleCallNode as unknown as TSESTree.Node,
                  `moduleLogger.info(${argv
                    .map(
                      (arg) =>
                        makeCookedTemplateLitteral(arg) ??
                        (arg as unknown as TSESTree.StringLiteral).raw ??
                        (arg as unknown as TSESTree.Identifier).name,
                    )
                    .join(',')})`,
                ), // Cooked litteral, raw litteral or var name
              ]
            }
            default:
              return null
          }
        },
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
