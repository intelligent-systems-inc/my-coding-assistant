import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as crypto from 'crypto';

export interface UseEffectData {
  code: string;
  startLine: number;
  endLine: number;
  hash: string;
  suggestions: string[];
}

export function extractUseEffectCalls(code: string): UseEffectData[] {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const results: UseEffectData[] = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        callee.type === 'Identifier' &&
        callee.name === 'useEffect' &&
        path.node.arguments.length
      ) {
        const start = path.node.loc?.start.line ?? -1;
        const end = path.node.loc?.end.line ?? -1;

        const rawCode = code.slice(path.node.start!, path.node.end!);
        const normalizedCode = rawCode.replace(/\s+/g, '').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
        const hash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

        results.push({
          code: rawCode,
          startLine: start,
          endLine: end,
          hash,
          suggestions: [],
        });
      }
    },
  });

  return results;
}
