//!CONFIG baseEditorMods-js (tag) true

//! CODE_EDITOR
///////////////////////////////////////////
// PLUGINS INCLUDE THE FILENAME AS A TAG //
///////////////////////////////////////////
function parseOrNull(json) {
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
}
function fieldsFromPluginCode(code) {
	const regex = /\/\/!CONFIG\s+([\w-]+)\s+\(([\w-]+)\)\s*(.*)/g;
	const fields = Array.from(code.matchAll(regex)).map(([, key, type, json]) => ({ key, type, data: parseOrNull(json)}));
	return fields;
}
ui.actions.get('create-event-plugin-file').detatch();
ui.action('create-event-plugin-file', async () => {
	const [file] = await maker.pickFiles('application/javascript');
	if (!file) return;

	const js = await maker.textFromFile(file);
	const fields = [
		{ key: file.name, type: 'tag', data: true },
		{ key: 'is-plugin', type: 'tag', data: true },
		{ key: 'plugin-order', type: 'json', data: 0 },
		{ key: 'plugin', type: 'javascript', data: js },
		...fieldsFromPluginCode(js),
	];

	EDITOR.createEvent(fields);

	// Run EDITOR code for the new plugin
	const editorCode = getRunnableJavascriptForOnePlugin({ fields: fields }, [ 'EDITOR' ]);
	new Function(editorCode)();
});


//////////////////////////////////////////////////////
// NEW FIELDS DEFAULT TO 'TAG' TYPE (NOT TEXT TYPE) //
//////////////////////////////////////////////////////
EventEditor.prototype.addField = async function() {
	this.editor.stateManager.makeChange(async (data) => {
		const { event } = this.getSelections(data);
		event.fields.push({ key: 'new field', type: 'tag', data: true });
		this.setSelectedIndex(event.fields.length - 1);
	});
}
