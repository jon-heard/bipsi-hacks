import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { HighlightStyle, LanguageSupport } from "@codemirror/language";
import { StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

export let customLanguageExtension = function customLanguageExtension(grammer) {
	const grammerRuleNames = Object.values(grammer).flatMap(state => state.map(rule => rule.token));
	const simpleModeObj = simpleMode(grammer);
	simpleModeObj.tokenTable = {};
	grammerRuleNames.forEach(name => {
		simpleModeObj.tokenTable[name] = Tag.define();
	});
	const StreamLanguageObj = StreamLanguage.define(simpleModeObj);
	const highlights = [];
	grammerRuleNames.filter(name => !name?.startsWith('skip')).forEach(name => {
		highlights.push({ tag: simpleModeObj.tokenTable[name], class: name });
	});
	const highlighterObj = syntaxHighlighting(HighlightStyle.define(highlights));
	return new LanguageSupport(StreamLanguageObj, [highlighterObj]);
};

export let parseGrammerString = function parseGrammerString(grammerString) {
	let focusString = grammerString;
	try {
		let grammer = JSON.parse(grammerString);
		for (const key in grammer) {
			for (let i = 0; i < grammer[key].length; i++) {
				focusString = grammer[key][i].regex;
				grammer[key][i].regex = new RegExp(grammer[key][i].regex);
			}
		}
		return grammer;
	} catch (e) {
		console.error(`Invalid grammer string:\n${e}:\n${focusString}`);
		return null;
	}
}
