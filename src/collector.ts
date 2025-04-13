import * as vscode from "vscode";

import { UseEffectData, extractUseEffectCalls } from "./utils/hashUseEffect";
import { Collection } from "./collection";


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
        var data = this.parseFile();
        this.collection.put(data);
    }

    private parseFile(): UseEffectData[] {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return [];

        const document = editor.document;
        const code = document.getText();
        const useEffectList = extractUseEffectCalls(code);

        return useEffectList.map(effect => ({
            code: effect.code,
            startLine: effect.startLine,
            endLine: effect.endLine,
            hash: effect.hash,
            suggestions: []
        }));
    }
}