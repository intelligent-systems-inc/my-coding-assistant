import * as vscode from "vscode";

import { Collector } from './collector';
import { Collection } from './collection';
import { OpenAIClient } from './utils/openaiclient';


class UseEffectCodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private useEffectCollection: Collection;

  constructor(useEffectCollection: Collection) {
    this.useEffectCollection = useEffectCollection;
  }

  provideCodeLenses(): vscode.CodeLens[] {
    this.codeLenses = [];
    
    const file = vscode.window.activeTextEditor?.document.fileName;
    if (!file) {
      return [];
    }

    const useEffectCalls = this.useEffectCollection.get({file});

    useEffectCalls.forEach(effect => {
     const position = new vscode.Position(effect.startLine, 0);
      const range = new vscode.Range(position, position);
      this.codeLenses.push(
        new vscode.CodeLens(range, {
          title: "🤍 View Suggestion ",
          command: "react-helper-extension.showSuggestionPanel",
          arguments: [{
            hash: effect.hash}]
        })
      );
    });

    return this.codeLenses;
  }
}

class UseEffectSuggestionProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _useEffectCollection: Collection;
  
  static ALL_SUGGESTIONS_VIEW = 'complete';
  static SPECIFIC_SUGGESTIONS_VIEW = 'specific';
  // can have values: "complete" & "specific"
  private _resolveWebViewType: string = UseEffectSuggestionProvider.ALL_SUGGESTIONS_VIEW;

  constructor(private readonly context: vscode.ExtensionContext, useEffectCollection: Collection) {
    this._useEffectCollection = useEffectCollection;
  }

  setResolveWebViewType(type: string) {
    this._resolveWebViewType = type;
  }

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    if (this._resolveWebViewType === UseEffectSuggestionProvider.ALL_SUGGESTIONS_VIEW) {
      webviewView.webview.html = this.getHtml(this.allCardsHtml());
    }
    
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // if webview type is specific, then updateView should not be called because
        // it is called separately when the user clicks on the annotation
        // also, webview type is changed for future invocations.
        if (this._resolveWebViewType === UseEffectSuggestionProvider.SPECIFIC_SUGGESTIONS_VIEW) {
          this.setResolveWebViewType(UseEffectSuggestionProvider.ALL_SUGGESTIONS_VIEW);
          return;
        }
        this.updateView();
      }
      // webview type is changed for future invocations.
      // webview type is specific only when the user clicks on annotation.
      if (this._resolveWebViewType === UseEffectSuggestionProvider.SPECIFIC_SUGGESTIONS_VIEW) {
        this.setResolveWebViewType(UseEffectSuggestionProvider.ALL_SUGGESTIONS_VIEW);
        return;
      }
    });

    webviewView.onDidDispose(() => {
      console.log("Webview disposed");
    });
  }

  async updateView(opts: any = {}) {
    if (this._view) {
      var suggestionHtml;
      if (opts['codelensHash']) {
        suggestionHtml = this.singleCardHtml(opts['codelensHash']);
      } else {
        suggestionHtml = this.allCardsHtml();
      }
      this._view.webview.html = this.getHtml(suggestionHtml);
    }
  }

  private singleCardHtml(codelensHash: string): string {
      const useEffectCall = this._useEffectCollection.getOne(codelensHash);
      let html = `<h2>🔍 useEffect Analysis</h2>`;
      if (!useEffectCall){
        return html + `<p>❌ No useEffect found.</p>`;
      } 
      html = `<h2>🔍 useEffect Analysis at line ${useEffectCall.startLine}</h2>`;
      if (useEffectCall.suggestions.length === 0) {
        return html + `<p>⏳ Loading...</p>`;
      } 
      return html +  `
        ${useEffectCall.suggestions[0]}
      `;
    }

  private allCardsHtml(): string {
    let html = `<h2>🔍 useEffect Suggestions</h2> <p>Select a <i>useEffect</i> to view suggestions for.</p>`;

    // for (const [fileName, hashes] of this._useEffectCollection.getFileMapping().entries()) {
    //   html += `<ul>${fileName}</ul>\n`;
    //   for (const hash of hashes) {
    //     const code = this._useEffectCollection.getOne(hash)?.code;
    //     if (code) {
    //       html += `<li>${code}</li>\n`;
    //     }
    //   }
    // }

    return html;
  }

  private getHtml(suggestionsHtml: string): string {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>useEffect Analysis</title>
              <style>
                body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 400px; margin: auto; }
                code { background-color: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
                pre { background-color: #f9f9f9; padding: 1rem; border-left: 4px solid #ccc; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
            ${suggestionsHtml || "<p>No useEffect suggestions available.</p>"}
            </body>
            </html>
        `;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const useEffectCollection = Collection.getInstance();
  const useEffectCollector = Collector.getInstance();
  useEffectCollector.run();
  setInterval(() => useEffectCollector.run(), 10000);

  const openAIClient = OpenAIClient.getInstance();
  openAIClient.setupClient();

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
  vscode.commands.registerCommand("react-helper-extension.showSuggestionPanel", async (annotationDetails) => {
    suggestionProvider.setResolveWebViewType(UseEffectSuggestionProvider.SPECIFIC_SUGGESTIONS_VIEW);
    await suggestionProvider.updateView({codelensHash: annotationDetails.hash});
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
