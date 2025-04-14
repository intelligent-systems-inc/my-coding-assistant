import { UseEffectData } from "./interface";

export class Collection {
    private useEffectCalls: Map<string, UseEffectData>;
    private fileMapping: Map<string, string[]>;
    
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
        this.fileMapping.set(file, useEffectCalls.map((call) => call.hash));
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

    // should never be undefined
    getOne(hash: string): UseEffectData | undefined {
        return this.useEffectCalls.get(hash);
    }

    get(opts: any = {}): UseEffectData[] {
        // If a file is specified, return useEffect calls for that file
        if (opts['file']) {
            const hashes = this.fileMapping.get(opts['file']) || [];
            const result: UseEffectData[] = [];
            hashes.forEach((hash) => {
                const call = this.useEffectCalls.get(hash);
                if (call) {
                    result.push(call);
                }
            });
            return result;
        }

        // If no file is specified, return all useEffect calls
        const result: UseEffectData[] = [];
        this.fileMapping.forEach((hashes, file) => {
            hashes.forEach((hash) => {
                const call = this.useEffectCalls.get(hash);
                if (call) {
                    result.push(call);
                }
            });
        });
        return result;
    }
}