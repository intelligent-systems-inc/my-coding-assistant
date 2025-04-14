import * as vscode from "vscode";
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as crypto from 'crypto';

import { Collection } from "./collection";
import { UseEffectData } from "./interface";


export class Collector {
    private static instance: Collector;
    private data: any[] = [];
    private collection: Collection;

    private constructor() {
        this.collection = Collection.getInstance();
    }

    public static getInstance(): Collector {
        if (!Collector.instance) {
            Collector.instance = new Collector();
        }
        return Collector.instance;
    }

    public run() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        var data = this.parseFile(editor);
        if (!data) {
            console.error('Error parsing file; not updating codelenses');
            return;
        }

        this.collection.fileMappingUpdate(editor.document.fileName, data);
        this.collection.callsTableUpsert(data);
    }

    private parseFile(editor: vscode.TextEditor): UseEffectData[]|undefined {
        const document = editor.document;
        const code = document.getText();
        var useEffectList: UseEffectData[] = [];
        try {
           useEffectList = this.extractUseEffectCalls(code);
        } catch (error) {
          console.error('Error while parsing code into AST: ');//, error);
          return undefined;
        }

        return useEffectList.map(effect => ({
            fileNmae: document.fileName,
            code: effect.code,
            startLine: effect.startLine,
            endLine: effect.endLine,
            hash: effect.hash,
            suggestions: []
        }));
    }

    private extractUseEffectCalls(code: string): UseEffectData[] {
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
                  fileNmae: "",
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
      
}