import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { PascalSemanticTokensProvider, legend } from "./semantic";
import {pascalGrammar, pascalAbcGrammar} from "./grammar";
import * as onig from "vscode-oniguruma";

export function activate(context: vscode.ExtensionContext) {
	onig.loadWASM(fs.readFileSync(path.join(__dirname, "../node_modules/vscode-oniguruma/release/onig.wasm")).buffer).then(() => {
		context.subscriptions.push(
			/*vscode.languages.registerDocumentSemanticTokensProvider(
				[{language: "pascal", scheme: "file"}],
				new PascalSemanticTokensProvider([pascalGrammar, pascalAbcGrammar]),
				legend
			)*/
			vscode.languages.registerDocumentSemanticTokensProvider(
				[{language: "pascal", scheme: "file"}],
				new PascalSemanticTokensProvider(pascalGrammar),
				legend
			),
			vscode.languages.registerDocumentSemanticTokensProvider(
				[{language: "pascal", scheme: "file"}],
				new PascalSemanticTokensProvider(pascalAbcGrammar),
				{...legend}
			),
		);
	});
}

export function deactivate() {}