import { OpenAI } from "openai";

import { window } from 'vscode';

import { htmlTemplate } from "../prompt/single_card_html_prompt_scaffold";

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
        this.client = new OpenAI({
          apiKey: userOpenAISecretKey,
        });
    }

    private static getPrompt(): string {
        const prompt = `For a given useEffect, you have to populate the HTML template provided below.
        The HTML template contains the following heads: Code Recap, What this does, Potential Issues and Consequences, Suggestions, and Summary. 
        These heads contain dummy text. You have to replace the dummy text with content according to the heading.
        Be brief and to the point. Only provide the filled in HTML template in response.\n`
        return prompt + htmlTemplate;
    }

    async getSuggestion(code: string): Promise<string> {
        if (!this.client) {
            throw new Error("OpenAI client is not initialized. Refresh IDE and input OpenAI secret key.");
        }
        const response = await this.client.chat.completions.create({
            model: "gpt-4.1",

            messages: [
                {
                    role: 'developer',
                    content: OpenAIClient.getPrompt(),
                },
                {
                    role: 'user',
                    content: code,
                },
            ],
        });
        const result: string|null = response.choices[0].message.content;
        if (result === "All good!" || result === null) {
            return "";
        }
        return result;
    }
}