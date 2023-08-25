import { awesome_line_wrapping_plugin } from './editorSubmodules/awesome-line-wrapping'
import { customLanguageExtension, parseGrammerString } from './editorSubmodules/customLanguageExtension'
import { history, historyKeymap, redo, indentWithTab } from '@codemirror/commands'
import { bracketMatching, indentUnit } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { dropCursor, EditorView, highlightActiveLine, highlightSpecialChars, keymap, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'

const grammer = parseGrammerString(codeMirror.getGrammer()) ?? {start:[]};
const languageExtension = customLanguageExtension(grammer);

const extensions = [
	EditorView.updateListener.of(v => {
		if (v.docChanged) {
			codeMirror.onTextChanged();
		}
	}),
	lineNumbers(),
	highlightSpecialChars(),
	history(),
	dropCursor(),
	bracketMatching(),
	highlightActiveLine(),
	highlightSelectionMatches(),
	indentUnit.of("	"),
	EditorView.lineWrapping,
	awesome_line_wrapping_plugin,
	languageExtension,
	keymap.of([
		historyKeymap,
		indentWithTab,
		...searchKeymap,
		{ key: 'Ctrl-Shift-z', run: redo },
	]),
];

codeMirror.editor = new EditorView({
  parent: codeMirror.getEditorContainer(),
  state: EditorState.create({ doc: "abcABC123!@#", extensions })
})

codeMirror.getDoc = function() {
	return codeMirror.editor.state.doc.toString();
};

codeMirror.setDoc = function(text) {
	codeMirror.editor.setState(EditorState.create({ doc: text, extensions }));
};
