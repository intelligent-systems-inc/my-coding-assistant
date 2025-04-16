import { OpenAIClient } from "./utils/openaiclient";
import { UseEffectData } from "./interface";

export class Collection {
    private useEffectCalls: Map<string, UseEffectData>;
    private fileMapping: Map<string, string[]>;
    private llmclient: OpenAIClient;
    
    private static instance: Collection;

    private constructor() {
        this.useEffectCalls = new Map();
        this.fileMapping = new Map();
        this.llmclient = OpenAIClient.getInstance();
        setInterval(() => {
            this.iterate();
        }, 10000);
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
        useEffectCalls.forEach((call) => {
            if (this.useEffectCalls.has(call.hash)) {
                const existingCall = this.useEffectCalls.get(call.hash);
                if (!existingCall) {
                    return;
                }
                // if startLine has changed, then update the call
                if (existingCall.startLine !== call.startLine) {
                    existingCall.startLine = call.startLine;
                }
                return;
            }
            this.useEffectCalls.set(call.hash, call);
            this.llmclient.getSuggestion(call.code).then(result => {
                if (!result) {
                    return;
                }
                this.useEffectCalls.get(call.hash)?.suggestions.push(result);
              }).catch(error => {
                console.error('Error getting suggestion:');//, error);
              });
        });
    }

    // in the background, iterate over the useEffectCalls map
    // check if suggestions are populated
    // if not, call the OpenAI client to get suggestions
    // and update the map
    iterate() {
        this.useEffectCalls.forEach((call) => {
            if (call.suggestions.length === 0) {
                this.llmclient.getSuggestion(call.code).then(result => {
                    if (!result) {
                        return;
                    }
                    call.suggestions.push(result);
                }).catch(error => {
                    console.error('Error getting suggestion:', error);
                });
            }
        });
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

    getFileMapping(): Map<string, string[]> {
        return this.fileMapping;
    }
}