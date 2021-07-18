import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as textmate from "vscode-textmate";
//import * as onig from "../node_modules/vscode-oniguruma/release/main.js";//"vscode-oniguruma";
import * as onig from "vscode-oniguruma";
//import * as onig from "onigasm";
import {Grammar, Rule, pascalGrammar} from "./grammar";


function gather() {
	const tokens: Set<string> = new Set();

	function dig({
		beginCaptures,
		endCaptures,
		whileCaptures,
		captures,
		name,
		patterns
	}: Rule) {
		for(const capture of [beginCaptures, endCaptures, whileCaptures, captures]) {
			if(capture !== undefined) {
				Object.values(capture).forEach(dig);
			}
		}

		name !== undefined && tokens.add(name);

		patterns && Object.values(patterns).forEach(dig);
	}

	for(const pattern of pascalGrammar.patterns.concat(Object.values(pascalGrammar.repository))) {
		dig(pattern);
	}

	return tokens;
}


const tokenMappings = {
	"entity.name.type": "type",
	"entity.name.type.parameter": "typeParameter",
	"variable.parameter": "parameter",
	"variable.property": "property",
	"entity.name.function": "function",
	"variable.label": "label",
	"constant.numeric": "number",
	"keyword.operator": "keyword-operator",
	"constant.language": "constant",
	//"invalid.illegal": "invalid"
};

function mapToken(token: string) {
	token = token.replace(".pascal", "");

	return tokenMappings[token] ?? token;
}

const allTokenTypes = [...gather()].map(mapToken);

export const tokenTypesLegend = allTokenTypes;

export const tokenModifiersLegend = [
	//"overload"
];

export const legend = new vscode.SemanticTokensLegend(
	tokenTypesLegend,
	tokenModifiersLegend
);

/*{
	createOnigScanner(patterns) {
		const scanner = new onig.OnigScanner(patterns);

		return {
			findNextMatchSync(string: string | textmate.OnigString, startPosition: number): textmate.IOnigMatch {
				const str = typeof string === "string"
					? new onig.OnigString(string)
					: (function(this: onig.OnigString) {
						if(string.dispose !== undefined) this.dispose = string.dispose;
						return this;
					}).call(new onig.OnigString(string.content));
				const result = scanner.findNextMatchSync(str, startPosition);
				if(result) return result;
				else throw `Match error! ${startPosition}`;
			},
			dispose() {
				scanner.dispose();
			}
		};
	},
	createOnigString(s) {
		return new onig.OnigString(s);
	}
};*/

export class PascalSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	registry: textmate.Registry;
	vscodeOnigLib: {
		createOnigScanner(patterns: string[]): onig.OnigScanner;
		createOnigString(s: string): onig.OnigString;
	};
	//allGrammars: Grammar[];
	grammar: Grammar;

	constructor(/*allGrammars: Grammar[]*/ grammar: Grammar) {
		//onig.loadWASM(fs.readFileSync(path.join(__dirname, "../node_modules/onigasm/lib/onigasm.wasm")).buffer).then(() => {
		//onig.loadWASM(fs.readFileSync(path.join(__dirname, "../node_modules/vscode-oniguruma/release/onig.wasm")).buffer).then(() => {
			/*const vscodeOnigLib = {
				createOnigScanner(patterns: string[]) {
					for(const pattern of patterns) {
						console.log("RX: ", pattern);
						new onig.OnigRegExp(pattern).testSync("no banana");
					}

					return new onig.OnigScanner(patterns);
				},
				createOnigString(s: string) {
					return new onig.OnigString(s);
				}
			};*/

			//this.allGrammars = allGrammars;
			//this.grammar = allGrammars[0];
			this.grammar = grammar;

			this.registry = new textmate.Registry({
				onigLib: Promise.resolve(<textmate.IOnigLib>onig),
				async loadGrammar(scopeName: string) {
					//return <textmate.IRawGrammar|undefined>allGrammars.find(g => g.scopeName === scopeName);
					if(scopeName === grammar.scopeName) {
						return <textmate.IRawGrammar>grammar;
					} else {
						return null;
					}
				}
			});
		//});
	}

	async provideDocumentSemanticTokens(document: vscode.TextDocument, _token: vscode.CancellationToken) {
		/*let results: {grammar: Grammar, furthest: {bad: number, first: number, begin: number, end: number}, result: vscode.SemanticTokens}[] = [];

		for(const grammar of this.allGrammars) {
			//await (async () => {this.grammar = grammar});
			this.grammar = grammar;

			const {furthest, result} = await this.buildTokens(document);

			if(furthest === null) {
				return result;
			} else {
				results.push({grammar, furthest, result});
			}
		}

		const best = results.reduce((a, b) => {
			const {bad: ca, first: fa, begin: ba, end: ea} = a.furthest;
			const {bad: cb, first: fb, begin: bb, end: eb} = b.furthest;
			
			const cs = Math.sign(ca - cb);
			const fs = Math.sign(fa - fb);
			const bs = Math.sign(ba - bb);
			const es = Math.sign(ea - eb);

			//if(cs === -1 && fs === -1 && bs === -1 && es === -1)

			//console.log(a.grammar.name, b.grammar.name);
			console.log(`${cs} ${fs} ${bs} ${es}`);

			if(cs === -1) {
				return a;
			} else if(cs === 1) {
				return b;
			}

			const la = a.result.data.length;
			const lb = b.result.data.length;
			switch(true) {
				case la > lb: return a;
				case la < lb: return b;
				default: {
					console.log("How did this even happen?", `${cs} ${fs} ${bs} ${es}`, a.grammar == b.grammar, `${ca} ${fa} ${ba} ${ea} | ${cb} ${fb} ${bb} ${eb}`);
					return a;
				}
			}
		});

		//this.grammar = best.grammar;

		return best.result;*/

		const {furthest, result} = await this.buildTokens(document);
		return result;
	}

	async buildTokens(document: vscode.TextDocument): Promise<{furthest: {bad: number, first: number, begin: number, end: number}|null, result: vscode.SemanticTokens}> {
		const builder = new vscode.SemanticTokensBuilder(legend);
		
		return this.registry.loadGrammar(this.grammar.scopeName).then(grammar => {
			if(!grammar) throw "error!";

			let ruleStack = textmate.INITIAL;
			let furthest: {bad: number, first: number, begin: number, end: number}|null = null;

			for(let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				const lineText = line.text;
				const lineTokens = grammar.tokenizeLine(lineText, ruleStack);
				
				for(let j = 0; j < lineTokens.tokens.length; j++) {
					const token = lineTokens.tokens[j];
					const scope = token.scopes.at(-1);
					
					if(scope !== "invalid.illegal.pascal") {
						builder.push(
							new vscode.Range(
								i,
								token.startIndex,
								i,
								token.endIndex
							),
							mapToken(scope)
						);
					} else if(lineText.slice(token.startIndex, token.endIndex).trimLeft() === "") {
						
					} else {
						const beginIndex = document.offsetAt(new vscode.Position(i, token.startIndex));
						const endIndex = document.offsetAt(new vscode.Position(i, token.endIndex));
						
						if(furthest === null) {
							furthest = {bad: 1, first: beginIndex, begin: beginIndex, end: endIndex};
						} else /*if(i !== document.lineCount - 1)*/ {
							furthest.bad++;
							furthest.begin = beginIndex;
							furthest.end = endIndex;
						}
					};
				}

				ruleStack = lineTokens.ruleStack;
			}

			//console.log(furthest);

			return {furthest, result: builder.build()};
		});
	}
}