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

    async getSuggestion(code: string): Promise<string> {
        if (!this.client) {
            throw new Error("OpenAI client is not initialized. Refresh IDE and input OpenAI secret key.");
        }
        const response = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: `The following is a useEffect call. Does it follow best practices as per the React documentation and community? If yes, suggest an improvement. If no, say "All good!":\n\n${code}`,
                },
            ],
        });
        const result: string|null = response.choices[0].message.content;
        console.log("OpenAI response: ", result);
        if (result === "All good!" || result === null) {
            return "";
        }
        return result;
    }
}