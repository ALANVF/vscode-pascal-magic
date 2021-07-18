//import * as textmate from "vscode-textmate";
import * as path from "path";
import "./util";

//type Grammar = typeof import("../syntaxes/pascal.json");
export interface Grammar {
	repository: Repository;
	scopeName: string;
	patterns: Rule[];
	injections?: {
		[expression: string]: Rule;
	};
	injectionSelector?: string;
	fileTypes?: string[];
	name?: string;
	firstLineMatch?: string;
}
export interface Repository {
	[name: string]: Rule;
}
export interface Rule {
	id?: number;
	include?: string;
	name?: string;
	contentName?: string;
	match?: string;
	captures?: Captures;
	begin?: string;
	beginCaptures?: Captures;
	end?: string;
	endCaptures?: Captures;
	while?: string;
	whileCaptures?: Captures;
	patterns?: Rule[];
	repository?: Repository;
	applyEndPatternLast?: boolean;
}
export type Captures = Record<string | number, Rule> | Rule[];


const grammar: Grammar = require(path.resolve(path.join(__dirname, "../syntaxes/pascal.json")));

//const grammar2: Grammar = require(path.resolve(path.join(__dirname, "../syntaxes/pascal.json")));

//import * as grammar from "../syntaxes/pascal.json";
//import * as grammar2 from "../syntaxes/pascal.json";

export const pascalGrammar = grammar;

export const pascalAbcGrammar = ((g: Grammar) => {
	//g.name = "PascalABC.NET";
	//g.scopeName = "source.pascalabc";

	const repo = g.repository;

	repo["type.routine"].patterns!.at(-1).patterns![1] = {include: "#type"};


	{
		const rule = repo["routine-params"].patterns![3];
		rule.match = rule.match!.replace("|out", "|out|params");
	}
	
	
	repo["routine-return"].end = "(?=;|:=)";
	repo["routine-return"].patterns![1] = {include: "#type"};

	
	repo["assign-expr"] = {
		begin: ":=",
		beginCaptures: [{name: "keyword.operator.pascal"}],

		end: "(?=;)",

		patterns: [
			{include: "#empty"},
			{include: "#comma"},
			{include: "#colon"},
			{include: "#case-of"},
			{include: "#try-except-finally"},
			{include: "#block"},
			{include: "#keywords"},
			{include: "#exprs"},
			{include: "#invalid"}
		]
	};

	/*{
		const {patterns} = repo["preprocessor"];

		patterns![0].begin = patterns![0].begin!.replace("\\$\\w+", "\\$(?!(?i)mode\\b)\\w+");
	}*/

	{
		const procPreModifiers = `(?:class|static|public|private|protected|internal|override)`;
		const procPostModifers = `(?:
			static|virtual|abstract|dynamic|reintroduce|override
			|alias
			|cdecl|cppdecl
			|default
			|export|external|extensionmethod
			|far|forward
			|inline|interrupt|iocheck
			|local
			|message
			|near|noreturn|nostackframe
			|overload
			|pascal|public
			|register
			|safecall|saveregisters|softfloat|stdcall
			|varargs
			|winapi|where
		)`;

		const patterns = repo["routine"].patterns!;
		const [func, op] = patterns;
		
		patterns.unshift({
			begin: `(?i)(?<=\\b)(?:${procPreModifiers}\\s+)*constructor(?=\\s*(?:[(;]|:=))`,
			beginCaptures: [{name: "keyword.pascal"}],

			end: ";",

			patterns: [
				{include: "#empty"},
				{
					begin: "(?=\\()",
					end: "(?=;)",
					patterns: [
						{include: "#empty"},
						{include: "#routine-params"},
						{include: "#assign-expr"},
						{include: "#routine-return"}
					]
				},
				{include: "#assign-expr"},
				//{include: "#routine-return"}
			]
		});

		func.begin = `(?i)(?<=\\b)((?:${procPreModifiers}\\s+)*(?:(?:function|procedure)(?!\\s+operator\\b)|(?:con|de)structor))\\s+(?=&?[a-zA-Z_]\\w*)`;
		func.end = `(?xi);(?!\\s*${procPostModifers}(?=\\b))`;
		(patterns => {
			patterns.end = `(?xi)(?=;(?!\\s*${procPostModifers}\\b))`;
			patterns.patterns!.splice(2, 0, {include: "#assign-expr"});
		})(func.patterns!.at(-2));

		op.begin = op.begin!
			.replace("(?:class\\s+)?", "(?:class\\s+)?(?:(?:function|procedure)\\s+)?")
			.replace(/(?:\\\+|-|\\\*|\/|\\\*\\\*)(?= +\|)/g, "$&=?");
		op.end = `(?xi);(?!\\s*${procPostModifers}(?=\\b))`;
		op.patterns!.push(
			{include: "#assign-expr"},
			op.patterns!.pop()!,
			{include: "#routine.trailing-attrs"}
		);
	}


	/*delete repo["oop.visibility.strict-private"];
	delete repo["oop.visibility.private"];
	delete repo["oop.visibility.strict-private-protected"];
	delete repo["oop.visibility.protected"];
	delete repo["oop.visibility.public"];
	delete repo["oop.visibility.published"];
	delete repo["oop.visibility"];*/
	{
		const prop = repo["oop.property"];

		prop.begin = prop.begin!.replace("(?:class\\s+)?", "(?:(?:static|auto|private|protected|internal|public)\\s+)*");
	}


	{
		const decl = repo["var-decl"];
		const patterns = decl.patterns!;

		decl.end = decl.end!.replace("(?:generic|class)", "class");

		patterns.push(
			{include: "#assign-expr"},
			patterns.pop()!
		);
	}


	{
		const patterns = repo["type-decl"].patterns!;
		
		patterns.splice(patterns.findIndex(({include}) => include === "#object-decl"), 1);
	}

	delete repo["object-decl"];


	{
		const oop = repo["oop.inheritance"];

		oop.begin = oop.begin!.replace("object|class(?:\\s+(?:sealed|abstract))?", "(?:(?:abstract|sealed|auto|static|partial)\\s+)?class");
	}

	{
		const decl = repo["class-decl"];
		
		decl.begin = decl.begin!.replace(
			/\(\?:packed\\s\+\)\?\s+class\s+\(\?:\s+\\s\+\s+\(\?:abstract\|sealed\)\s+\)\?/m,
			"(?:(?:abstract|sealed|auto|static|partial)\\s+)?class"
		);

		decl.patterns!.splice(1, 0, {include: "#where-clause"});
	}
	

	repo["type.sequence"] = {
		begin: "(?i)(?<!(?<!\\.)\\.|\\&)(?<=\\b)sequence(?=\\b)",
		beginCaptures: [{name: "keyword.pascal"}],
		end: "(?i)(?<!(?<!(?<!\\.)\\.|\\&)\\b(?:sequence|of)\\s*)",
		patterns: [
			{include: "#empty"},
			{
				begin: "(?i)(?<!(?<!\\.)\\.|\\&)(?<=\\b)of(?=\\b)",
				beginCaptures: [{name: "keyword.pascal"}],
				end: "(?i)(?<!(?<!(?<!\\.)\\.|\\&)\\b(?:sequence|of)\\s*)",
				patterns: [
					{include: "#empty"},
					{include: "#type-decl"},
					{include: "#type"},
					{include: "#invalid"}
				]
			},
			{include: "#invalid"}
		]
	};

	repo["type"].patterns!.unshift(
		{match: "(?i)\\bobject\\b", name: "keyword.pascal"},
		{include: "#type.sequence"}
	);
	
	{
		const rule = repo["basic-type.user-defined"];
		rule.match = rule.match!.replace("|set|", "|set|sequence|").replace("generic|specialize|", "");
	}


	{
		const args = repo["generic-args"];
		args.begin = args.begin!.replace("\\w", "\\w&?");
	}


	repo["where-clause"] = {
		begin: "(?i)(?<!(?<!\\.)\\.|\\&)(?<=\\b)where(?=\\b)",
		beginCaptures: [{name: "keyword.pascal"}],

		end: "(?=;)",

		patterns: [
			{include: "#empty"},
			{
				begin: "(?:&|\\b)[a-zA-Z_]\\w*",
				beginCaptures: [{name: "entity.name.type.parameter.pascal"}],

				end: "(?=;)",

				patterns: [
					{include: "#empty"},
					{
						begin: ",",
						beginCaptures: [{name: "punctuation.separator.comma.pascal"}],

						end: "(?:&|\\b)[a-zA-Z_]\\w*",
						endCaptures: [{name: "entity.name.type.parameter.pascal"}],

						patterns: [
							{include: "#empty"},
							{include: "#invalid"}
						]
					},
					{
						begin: ":",
						beginCaptures: [{name: "keyword.operator.pascal"}],
		
						end: "(?=;)",
		
						patterns: [
							{include: "#empty"},
							{include: "#comma"},
							{
								match: "(?i)(?<!(?<!\\.)\\.|\\&)(?<=\\b)(?:record|class|interface|constructor)(?=\\b)",
								name: "keyword.pascal"
							},
							{include: "#type"},
							{include: "#invalid"}
						]
					}
				]
			}
		]
	};


	{
		const patterns = repo["routine.trailing-attrs"].patterns!;
		
		patterns[0].match = patterns[0].match!.replace("external", "external|extensionmethod");
		
		patterns.push({include: "#where-clause"});
	}


	repo["exprs"].patterns!.unshift({
		begin: "(?i)((?<=\\b)(?<!&|\\.)new\\s+)(?=&?[a-zA-Z_])",
		beginCaptures: [{name: "keyword.pascal"}],
		
		end: "(?<=\\w)(?!\\s*&?<)|(?<=>)",

		patterns: [
			{include: "#type"},
			{include: "#generic-args"}
		]
	});


	/*
	exprs.call-generic-fn #(
		begin "(?i)((?<=\b)(?<!&)specialize\s+)(&?[a-zA-Z_]\w*(?=<\S))"
		beginCaptures #(
			1 #(name "keyword.pascal")
			2 #(name "entity.name.function.pascal")
		)

		end "(?<=>)"

		patterns [
			#(include #generic-args)
			#(include #invalid)
		]
	)
	*/
	// this doesn't seem to be finished?
	/*{
		const fn = repo["exprs.call-generic-fn"];

		fn.begin = "((?:(?<=\\b)|&)[a-zA-Z_]\\w*)(&)(?=<)";
		fn.beginCaptures = {
			1: {name: "entity.name.function.pascal"},
			2: {name: "keyword.operator.pascal"}
		}
	}*/


	{
		const keywords = repo["keywords"];
		keywords.match = keywords.match!.replace("|with", "|with|yield|foreach|loop|match");
	}


	for(const name of ["types", "vars", "consts", "resourcestrings"]) {
		const section = repo[`${name}-section`];

		section.end = section.end!.replace("(?:generic|class)", "class");
	}


	repo["unit"]
		.patterns!
			.at(-2)
				.patterns!
					.at(-2)
						.patterns!
							.splice(1, 0, {include: "#top-level"});

	return g;
})(JSON.parse(JSON.stringify(grammar)));