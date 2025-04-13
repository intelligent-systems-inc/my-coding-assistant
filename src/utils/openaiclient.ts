import { OpenAI } from "openai";

import { window } from 'vscode';

export class OpenAIClient {
    private client: OpenAI | null = null;
    private static instance: OpenAIClient;

    constructor() {}

    public static getInstance(): OpenAIClient {
        if (!OpenAIClient.instance) {
            OpenAIClient.instance = new OpenAIClient();
        }
        return OpenAIClient.instance;
    }

    public async setupClient() {
        const userOpenAISecretKey = await window.showInputBox({
            placeHolder: 'Input OpenAI API Key',
        });
        // console.log(userOpenAISecretKey);
        this.client = new OpenAI({
          apiKey: userOpenAISecretKey,
        });
    }
}