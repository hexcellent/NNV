const HOTKEYS_TIP_DIV = document.createElement('div');
HOTKEYS_TIP_DIV.id = 'hotkeys_tip';
document.body.append(HOTKEYS_TIP_DIV);

const MODAL_DIV = document.createElement('div');
MODAL_DIV.id = 'modal';
MODAL_DIV.classList.add('hidden');
document.body.append(MODAL_DIV);

const PREVIEW_DIV = document.createElement('div');
PREVIEW_DIV.id = 'keypress_preview';
PREVIEW_DIV.classList.add('hidden');
document.body.append(PREVIEW_DIV);

const hotkeys_div = document.createElement('div');
hotkeys_div.id = 'hotkeys';
MODAL_DIV.append(hotkeys_div);

const keyboard_div = document.createElement('div');
keyboard_div.id = 'keyboard';
hotkeys_div.append(keyboard_div);

const KEYDOWN_AUDIO = [
	new Audio('/AUDIO/key_down_0.mp3'),
	new Audio('/AUDIO/key_down_1.mp3'),
	new Audio('/AUDIO/key_down_2.mp3'),
];
const KEYBOARD_KEYS = [
	[
		'esc',
		'f1',
		'f2',
		'f3',
		'f4',
		'f5',
		'f6',
		'f7',
		'f8',
		'f9',
		'f10',
		'f11',
		'f12',
	],
	['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'back'],
	['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
	['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
	['l shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'r shift'],
	['l ctrl', 'cmd', 'l alt', 'space', 'r alt', 'r ctrl'],
];
let keys_dom = {},
	hotkeys = [];

function load_modal() {
	for (const row of KEYBOARD_KEYS) {
		const row_div = document.createElement('div');
		row_div.classList.add('row');
		keyboard_div.append(row_div);
		for (const key of row) {
			const key_div = document.createElement('div');
			key_div.classList.add('key');
			key_div.textContent = key;
			row_div.append(key_div);
			keys_dom[key] = key_div;
			for (const hotkey1 in hotkeys) {
				if (hotkeys[hotkey1].key == key) {
					const pophover_div = document.createElement('div');
					key_div.classList.add('used');
					pophover_div.classList.add('pophover');
					key_div.append(pophover_div);
					pophover_div.textContent = hotkeys[hotkey1].long;
					if (hotkeys[hotkey1].wip) {
						key_div.classList.add('wip');
						const WIP_ICON_DIV = document.createElement('span');
						WIP_ICON_DIV.classList.add('wip_icon');
						WIP_ICON_DIV.innerText = 'WIP 🧪';
						pophover_div.append(WIP_ICON_DIV);
					}
				}
			}
			if (key == ('back' || 'tab' || 'enter' || 'caps' || 'shift' || 'ctrl'))
				key_div.classList.add('large');
			else if (key == 'space') key_div.classList.add('space');
		}
	}
}

//FIX MAKE SURE TO BE ABLE TO DELETE HOTKEYS AND THEY GET DISPLAYED IN REAL TIME

// TODO Live update the modal when hotkeys are added/removed
function hotkey_add(key, short, long, func, wip = false) {
	key = key.toLowerCase();
	if (hotkeys[key]) return console.error(`Hotkey already exists '${key}'`);
	hotkeys[key] = {
		key,
		short,
		long,
		func,
		wip,
	};
	return key;
}
function hotkey_del(key) {
	// TODO : Delete and update modal
	delete hotkeys[key];
}

function play_audio() {
	const audio =
		KEYDOWN_AUDIO[Math.floor(Math.random() * KEYDOWN_AUDIO.length)].cloneNode();
	audio.play();
}

function preview_key(key) {
	PREVIEW_DIV.classList.remove('keypress');
	void PREVIEW_DIV.offsetWidth;
	PREVIEW_DIV.classList.add('keypress');
	const txt = `${key.short}${key.wip ? '🧪' : ''}`;
	PREVIEW_DIV.textContent = txt;
}

function keydown(ev) {
	let key = ev.key.toLowerCase();

	const SHIFT = ev.shiftKey;
	const CTRL = ev.ctrlKey;
	const ALT = ev.altKey;
	const META = ev.metaKey;

	switch (key) {
		case 'control':
			key = `${ev.location == 1 ? 'l' : 'r'} ctrl`;
			break;
		case 'shift':
			key = `${ev.location == 1 ? 'l' : 'r'} shift`;
			break;
		case 'meta':
			key = 'cmd';
			break;
		case ' ':
			key = 'space';
			break;
		case 'capslock':
			key = 'caps';
			break;
		case 'escape':
			key = 'esc';
			break;
		case 'alt':
			key = `${ev.location == 1 ? 'l' : 'r'} alt`;
			break;
		case 'backspace':
			key = 'back';
			break;
	}

	// TODO implement combos / special keys

	if (
		document.activeElement.tagName == 'INPUT' ||
		document.activeElement.tagName == 'TEXTAREA' ||
		document.activeElement.isContentEditable
	)
		return;
	if (!keys_dom[key]) return;
	if (!hotkeys[key]) return;

	ev.preventDefault();
	HOTKEYS_TIP_DIV.classList.add('hidden');
	play_audio();
	preview_key(hotkeys[key]);
	hotkeys[key].func();
}

function toggle_modal(id) {
	MODAL_DIV.classList.toggle('hidden');
	for (const child of MODAL_DIV.children) child.classList.add('hidden');
	if (id) MODAL_DIV.querySelector(`#${id}`).classList.remove('hidden');
}

addEventListener('load', load_modal, { once: true });
addEventListener('keydown', keydown);
addEventListener(
	'paste',
	(ev) => hotkeys['paste'] && hotkeys['paste'].func(ev)
);
MODAL_DIV.addEventListener(
	'click',
	(ev) => ev.target == MODAL_DIV && toggle_modal()
);
hotkey_add('k', 'Toggle Hotkeys', 'Toggle hotkeys modal', () =>
	toggle_modal('hotkeys')
);

export { hotkey_add, hotkey_del };
