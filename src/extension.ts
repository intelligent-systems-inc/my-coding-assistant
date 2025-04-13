import * as vscode from "vscode";
import { OpenAI } from "openai";

import { extractUseEffectCalls, UseEffectData } from './utils/hashUseEffect';
import { Collector } from './collector';
import { Collection } from './collection';


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

class UseEffectCodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private useEffectCollection: Collection;

  constructor(useEffectCollection: Collection) {
    this.useEffectCollection = useEffectCollection;
  }

  provideCodeLenses(): vscode.CodeLens[] {
    this.codeLenses = [];
    const useEffectCalls = this.useEffectCollection.get();

    useEffectCalls.forEach(effect => {
      console.log(`useEffect at lines ${effect.startLine}-${effect.endLine} with hash: ${effect.hash}`);
      const position = new vscode.Position(effect.startLine, 0);
      const range = new vscode.Range(position, position);
      this.codeLenses.push(
        new vscode.CodeLens(range, {
          title: "🤍 View Suggestion 🤍",
          command: "react-helper-extension.showSuggestionPanel",
          arguments: [effect.startLine, effect.hash]
        })
      );
    });

    return this.codeLenses;
  }
}

class UseEffectSuggestionProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _useEffectCalls: UseEffectData[] = [];

  constructor(private readonly context: vscode.ExtensionContext, useEffectCollection: Collection) {
    this._useEffectCalls = useEffectCollection.get();
  }

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext): void {
    console.log("Webview view resolved");
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();
  }

  updateSuggestions() {
    console.log("Updating suggestions in webview");

    if (this._view) {
      this._view.webview.html = this.getHtml();
    }
  }

  private getHtml(): string {
    console.log("Generating HTML for webview, with list ", this._useEffectCalls);
    const cardsHtml = this._useEffectCalls
      .map(call => {
        // console.log("-----", call);
        return `
          <div style="border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 5px;">
            <h3>useEffect at Line ${call.startLine + 1}</h3>
            <ul>
              ${call.suggestions.map((s: string) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        `;
      })
      .join('');

    return `
      <html>
        <body style="font-family: sans-serif; padding: 1em;">
          <h2>🔍 useEffect Suggestions</h2>
          ${cardsHtml || "<p>No useEffect suggestions available.</p>"}
        </body>
      </html>
    `;
  }
}

export function activate(context: vscode.ExtensionContext) {

  console.log('extension loaded');

  const useEffectCollection = Collection.getInstance();
  const useEffectCollector = Collector.getInstance();
  useEffectCollector.run();
  // setInterval(() => useEffectCollector.run(), 10000);

  const provider = new UseEffectCodeLensProvider(useEffectCollection);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
      provider
    )
  );

const suggestionProvider = new UseEffectSuggestionProvider(context, useEffectCollection);

context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    "react-helper-extension.useEffectSuggestionsView",
    suggestionProvider
  )
);

context.subscriptions.push(
  vscode.commands.registerCommand("react-helper-extension.showSuggestionPanel", async () => {
    suggestionProvider.updateSuggestions();
    await vscode.commands.executeCommand('workbench.view.extension.reactHelperSidebar');
  })
);


context.subscriptions.push(
  vscode.workspace.onDidChangeTextDocument(async (event) => {
    useEffectCollector.run();
  })
);

}


export function deactivate() {}



