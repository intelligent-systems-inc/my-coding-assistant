import { UseEffectData } from "./interface";

export class Collection {
    private useEffectCalls: Map<string, UseEffectData>;
    private fileMapping: Map<string, UseEffectData[]>;
    
    private static instance: Collection;

    private constructor() {
        this.useEffectCalls = new Map();
        this.fileMapping = new Map();
    }

    public static getInstance(): Collection {
        if (!Collection.instance) {
            Collection.instance = new Collection();
        }
        return Collection.instance;
    }

    fileMappingUpdate(file: string, useEffectCalls: UseEffectData[]) {
        this.fileMapping.set(file, useEffectCalls);
    }
    
    callsTableUpsert(useEffectCalls: UseEffectData[]) {
        var count = 0;
        useEffectCalls.forEach((call) => {
            if (!this.useEffectCalls.has(call.hash)) {
                count++;
                this.useEffectCalls.set(call.hash, call);
            }
        });
        console.log(`Upserted ${count} useEffect calls`);
    }

    get(opts: any): UseEffectData[] {
        // If a file is specified, return useEffect calls for that file
        if (opts['file']) {
            return this.fileMapping.get(opts['file']) || [];
        }
        // If no file is specified, return all useEffect calls
        var result: UseEffectData[] = [];
        this.useEffectCalls.forEach((value) => {
            result.push(value);
        });
        return result;
    }
}