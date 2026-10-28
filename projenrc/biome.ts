import type { BiomeOptions } from 'projen/lib/javascript';
import { IndentStyle, JsTrailingCommas, QuoteStyle, VcsClientKind } from 'projen/lib/javascript/biome/biome-config';

export const biomeOptions: BiomeOptions = {
  mergeArraysInConfiguration: false,
  biomeConfig: {
    vcs: {
      enabled: true,
      clientKind: VcsClientKind.GIT,
      useIgnoreFile: true,
    },
    files: {
      ignoreUnknown: true,
    },
    formatter: {
      enabled: true,
      indentStyle: IndentStyle.SPACE,
      lineWidth: 120,
    },
    assist: {
      enabled: true,
      actions: {
        source: {
          organizeImports: {
            level: 'on',
            options: {
              groups: [':NODE:', ':BLANK_LINE:', ':PACKAGE:', ':BLANK_LINE:', '@/**', ':BLANK_LINE:', ':PATH:'],
            },
          },
        },
      },
    },
    linter: {
      rules: {
        style: {
          noParameterAssign: 'error',
          useAsConstAssertion: 'error',
          useDefaultParameterLast: 'error',
          useEnumInitializers: 'error',
          useSelfClosingElements: 'error',
          useSingleVarDeclarator: 'error',
          noUnusedTemplateLiteral: 'error',
          useNumberNamespace: 'error',
          noInferrableTypes: 'error',
          noUselessElse: 'error',
        },
      },
    },
    javascript: {
      parser: {
        unsafeParameterDecoratorsEnabled: true,
      },
      formatter: {
        quoteStyle: QuoteStyle.SINGLE,
        trailingCommas: JsTrailingCommas.ES5,
        bracketSpacing: true,
        lineWidth: 120,
      },
    },
  },
};
