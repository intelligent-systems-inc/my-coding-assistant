import { UseEffectData } from "./utils/hashUseEffect";

export class Collection {
    private useEffectCalls: UseEffectData[] = [];
    private static instance: Collection;

    private constructor() {}

    public static getInstance(): Collection {
        if (!Collection.instance) {
            Collection.instance = new Collection();
        }
        return Collection.instance;
    }

    put(useEffectCalls: UseEffectData[]) {
        this.useEffectCalls = useEffectCalls;
    }

    get(): UseEffectData[] {
        return this.useEffectCalls;
    }

}