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
     // console.log(`useEffect at lines ${effect.startLine}-${effect.endLine} with hash: ${effect.hash}`);
      const position = new vscode.Position(effect.startLine, 0);
      const range = new vscode.Range(position, position);
      this.codeLenses.push(
        new vscode.CodeLens(range, {
          title: "🤍 View Suggestion 🤍",
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
    console.log("Webview view resolved");
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    if (this._resolveWebViewType === UseEffectSuggestionProvider.ALL_SUGGESTIONS_VIEW) {
      webviewView.webview.html = this.getHtml(this.allCardsHtml());
    }
    
    webviewView.onDidChangeVisibility(() => {
      console.log("Webview visibility changed");
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
      // console.log("Generating HTML for webview, with list ", this._useEffectCalls);
      const useEffectCall = this._useEffectCollection.getOne(codelensHash);
      if (!useEffectCall) {
        return `<p>error.</p>`;
      }
      return `
        <div style="border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 5px;">
          <h3>useEffect at Line ${useEffectCall.startLine + 1}</h3>
          <ul>
            ${useEffectCall.suggestions.map((s: string) => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      `;
    }

  private allCardsHtml(): string {
    // console.log("Generating HTML for webview, with list ", this._useEffectCalls);
    return this._useEffectCollection.get({}) // Get all useEffect calls
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
  }

  private getHtml(suggestionsHtml: string): string {
    return `
      <html>
        <body style="font-family: sans-serif; padding: 1em;">
          <h2>🔍 useEffect Suggestions</h2>
          ${suggestionsHtml || "<p>No useEffect suggestions available.</p>"}
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
    console.log("Annotation clicked:", annotationDetails);
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
