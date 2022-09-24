import { panel_new, panel_focused, wall } from './panels.js';
import { Network, SupervisedNetwork, forward, backward } from './NN.js';
import { hotkey_add } from './hotkeys.js';
import './noise.js';

// SECTION NETWORK LOOP

let cycle_timer = new Date();
let cycle_performance;
function epoch_cycle(panel) {
	cycle_performance = new Date();
	while (panel.debug['ticking']) {
		panel.debug['cycle elapsed'] = new Date() - cycle_timer;

		panel.debug['lag'] = new Date() - cycle_performance;
		if (panel.debug['lag'] > 0) return setTimeout(() => epoch_cycle(panel));

		if (panel.debug['cycle elapsed'] > panel.debug['cycle duration']) {
			cycle_timer = new Date();
			panel.debug['cycle status'] = 'RUNNING';
			panel.debug['epoch previous'] = panel.debug['epoch'];
			panel.debug['epoch'] = 0;
			return epoch_cycle(panel);
		}

		if (panel.debug['epoch'] >= panel.debug['epoch max per cycle']) {
			panel.debug['cycle status'] = 'DONE';
			const time_left =
				panel.debug['cycle duration'] - panel.debug['cycle elapsed'];
			return setTimeout(() => epoch_cycle(panel), time_left);
		}

		const outputs = forward(panel.network, panel.supervised.inputs);
		panel.debug['outputs'] = outputs.map((v) => v.toFixed(2));

		const errors = panel.supervised.theorized.map((v, i) => v - outputs[i]);
		panel.debug['errors'] = errors.map((v) => v.toFixed(2));
		backward(panel.network, errors, panel.debug['learning rate']); // FIX only supports 1 error

		panel.debug['epoch total']++;
		panel.debug['epoch']++;
	}
	panel.debug['cycle status'] = 'STOPPED';
}
function epoch_toggle(panel) {
	panel.debug['ticking'] = !panel.debug['ticking'];
	if (panel.debug['ticking']) epoch_cycle(panel);
}

// SECTION DRAW LOOP

let draw_last_time = Date.now(),
	fps = 0;
function frame_update(panel) {
	panel.debug['fps'] = fps;
}
function frame_draw(panel) {
	for (let [l_i, l] of panel.network.layers.entries())
		for (let [n_i, n] of l.neurons.entries())
			for (let [w_i, w] of n.weights.entries())
				panel.network_div_matrix[l_i][n_i][w_i].innerText = w.value.toFixed(2);

	for (const value in panel.debug) {
		const debug_li = panel.debug_div_matrix[value];
		if (debug_li) debug_li.innerText = panel.debug[value];
	}
}
function frame_loop(timeStamp) {
	fps = (1000 / (timeStamp - draw_last_time)).toFixed(0);
	draw_last_time = timeStamp;

	for (const panel of wall.panels) frame_update(panel) || frame_draw(panel);
	requestAnimationFrame(frame_loop);
}

// SECTION DIVS

const choices = {
	'epoch max per cycle': {
		label: 'Max epochs per cycle',
		type: 'range',
		min: 1,
		max: 5000,
		step: 1,
		default: 1000,
	},
	'cycle duration': {
		label: 'cycle duration in ms',
		type: 'range',
		min: 1,
		max: 1000,
		step: 1,
		default: 250,
	},
	'learning rate': {
		label: 'Learning rate',
		type: 'range',
		min: 0.1,
		max: 10,
		step: 0.1,
		default: 1,
	},
	'supervised inputs': {
		label: 'Supervised network inputs values',
		type: 'array',
		min: 1,
		max: 5,
		default: [1, 0, 0, 1, 1],
	},
	'network layers': {
		label: 'Network all layers input to output',
		type: 'array',
		min: 1,
		max: 10,
		default: [5, 2, 4, 3, 2],
	},
	'supervised theorized': {
		label: 'Supervised network theorized output',
		type: 'array',
		min: 1,
		max: 5,
		default: [0, 0],
	},
};

function debug_li_create(panel, key, value = null) {
	panel.debug[key] = value;

	const debug_li = document.createElement('li');
	const debug_label = document.createElement('div');
	const debug_value = document.createElement('div');
	debug_li.classList.add('line');
	debug_label.classList.add('label');
	debug_value.classList.add('value');

	debug_li.append(debug_label, debug_value);
	panel.debug_ul.append(debug_li);

	debug_label.innerText = key;
	panel.debug_div_matrix[key] = debug_value;
}

function panel_network() {
	const panel = panel_new({ resizable: true, reposition_cursor: true });

	panel.debug_ul = document.createElement('ul');
	panel.debug_ul.classList.add('debug');

	panel.debug = [];

	panel.debug_div_matrix = [];
	debug_li_create(panel, 'outputs');
	debug_li_create(panel, 'errors');
	debug_li_create(panel, 'cycle duration');
	debug_li_create(panel, 'cycle elapsed');
	debug_li_create(panel, 'cycle status');
	debug_li_create(panel, 'ticking', false);
	debug_li_create(panel, 'lag', 0);
	debug_li_create(panel, 'epoch', 0);
	debug_li_create(panel, 'epoch previous', 0);
	debug_li_create(panel, 'epoch max per cycle');
	debug_li_create(panel, 'epoch total', 0);
	debug_li_create(panel, 'learning rate');
	debug_li_create(panel, 'fps');

	panel.choices_ul = document.createElement('ul');
	panel.choices_ul.classList.add('choices');
	panel.choice_li = [];

	for (const choice in choices) {
		const choice_li = document.createElement('li');
		const choice_label = document.createElement('div');
		const choice_wrap = document.createElement('div');
		const choice_value = document.createElement('div');
		const choice_input = document.createElement('input');

		choice_li.classList.add('choice');
		choice_label.classList.add('label');
		choice_wrap.classList.add('wrap');
		choice_value.classList.add('value');
		choice_input.classList.add('picker');

		choice_value.contentEditable = true;
		choice_input.type = 'text';

		switch (choices[choice].type) {
			case 'range':
				choice_input.type = choices[choice].type;
				choice_input.min = choices[choice].min;
				choice_input.max = choices[choice].max;
				choice_input.step = choices[choice].step;

				choice_input.addEventListener('input', (ev) => {
					let value_net = choice_set(panel, choice, ev.target.value);
					panel.debug[choice] = value_net;
					choice_value.innerText = value_net;
					choice_input.value = value_net;
				});

				choice_wrap.append(choice_value, choice_input);
				break;
			case 'array':
				choice_wrap.append(choice_value);
				break;
		}

		choice_value.addEventListener('keydown', (ev) => {
			if (ev.key === 'Enter') ev.preventDefault() || choice_value.blur();
		});
		choice_value.addEventListener('input', (ev) => {
			const value_net = choice_set(panel, choice, ev.target.innerText);
			panel.debug[choice] = value_net;
		});
		choice_value.addEventListener('blur', (ev) => {
			const value_net = choice_set(panel, choice, ev.target.innerText);
			panel.debug[choice] = value_net;
			choice_value.innerText = value_net;
			choice_input.value = value_net;
			choice_set(panel, choice, value_net);
		});

		choice_li.append(choice_label, choice_wrap);
		panel.choices_ul.append(choice_li);

		panel.choice_li[choice] = choice_li;

		choice_label.innerText = choices[choice].label;
		let value_net = choice_set(panel, choice, choices[choice].default);
		panel.debug[choice] = value_net;
		choice_value.innerText = value_net;
		choice_input.value = value_net;
	}

	panel.network = new Network(panel.debug['network layers']);
	panel.network_div = document.createElement('div');
	panel.network_div.classList.add('network');
	panel.network_div_matrix = [];
	panel.network.layers.forEach((layer, l_index) => {
		let layer_div = document.createElement('div');
		layer_div.classList.add('layer');
		panel.network_div.appendChild(layer_div);
		panel.network_div_matrix.push([]);
		layer.neurons.forEach((neuron, n_index) => {
			let neuron_div = document.createElement('ul');
			neuron_div.classList.add('neuron');
			layer_div.appendChild(neuron_div);
			panel.network_div_matrix[l_index].push([]);
			neuron.weights.forEach(() => {
				let weight_div = document.createElement('li');
				weight_div.classList.add('weight');
				neuron_div.appendChild(weight_div);
				panel.network_div_matrix[l_index][n_index].push(weight_div);
			});
		});
	});

	panel.supervised = new SupervisedNetwork(
		panel.debug['supervised inputs'],
		panel.network,
		panel.debug['supervised theorized']
	);

	panel.content.append(panel.choices_ul, panel.network_div, panel.debug_ul);

	return panel;
}
function choice_set(panel, choice, gross) {
	const choice_li = panel.choice_li[choice];
	let net = choices[choice].default;
	choice_li.classList.remove('danger', 'error');
	switch (choices[choice].type) {
		case 'range':
			if (isNaN(gross) || gross === '' || gross === null) {
				choice_li.classList.add('error');
				break;
			}
			net = Number(gross);

			if (net < choices[choice].min || net > choices[choice].max) {
				choice_li.classList.add('danger');
				break;
			}
			break;
		case 'array':
			const new_array = gross
				.toString()
				.split(',')
				.map((v) => Number(v));
			if (new_array.some((v) => isNaN(v)) || new_array.length < 1) {
				choice_li.classList.add('error');
				break;
			}
			net = new_array;

			if (
				net.length < choices[choice].min ||
				net.length > choices[choice].max
			) {
				choice_li.classList.add('danger');
				break;
			}
			break;
	}

	return net;
}

// SECTION HOTKEYS

hotkey_add(
	'e',
	'Toggle Cycle',
	'Toggle cycle on current panel',
	() => panel_focused() && epoch_toggle(panel_focused())
);
hotkey_add(
	'r',
	'Reconstruct Network',
	'Reconstruct network on current panel using current choices',
	() => {
		// TODO set instant clear cycle by setting cycle on a variable and then clearing it
		panel_focused();
	},
	true
);
hotkey_add('n', 'New panel', 'New network panel', () => panel_network());

// SECTION INIT

addEventListener('load', async () => requestAnimationFrame(frame_loop));
