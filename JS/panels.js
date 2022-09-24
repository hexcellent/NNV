// TODO make sure panels are ordered by z-index so when we close one the next one is the one the most on top
const wall = document.createElement('div');
wall.id = 'wall';
wall.panels = [];
document.body.append(wall);

wall.addEventListener('contextmenu', (ev) => {
	ev.target === ev.currentTarget && focus();
});
wall.addEventListener('pointerdown', (ev) => {
	ev.target === ev.currentTarget && focus();
});
addEventListener('resize', () => wall.panels.forEach((p) => reposition(p)));

let cursor_pos = { x: 0, y: 0 };
addEventListener(
	'mousemove',
	(ev) => (cursor_pos = { x: ev.clientX, y: ev.clientY })
);

function panel_focused() {
	return wall.panels[wall.panels.length - 1]?.classList.contains('focus')
		? wall.panels[wall.panels.length - 1]
		: null;
}
function close(panel, ev) {
	ev.stopPropagation();
	panel.remove();
	const next = wall.querySelector('.panel');
	if (next) focus(next);
}
function grab(panel, ev) {
	const y = ev.clientY - panel.offsetTop;
	const x = ev.clientX - panel.offsetLeft;
	const pointermove = (ev) =>
		reposition(panel, {
			top: ev.clientY - y,
			left: ev.clientX - x,
		});
	const pointerup = () => {
		wall.classList.remove('numb', 'grabbing');
		removeEventListener('pointermove', pointermove);
	};
	wall.classList.add('numb', 'grabbing');
	addEventListener('pointermove', pointermove);
	addEventListener('pointerup', pointerup, { once: true });
}
function resizing(panel) {
	// FIX resizing do not take into account CSS min-width and min-height when resizing in negative direction
	wall.classList.add('numb', 'resizing');
	const down = (ev) => {
		const down_pos = resizing_clamp(ev);
		const move = (ev) => {
			const snap = 16;
			const move_pos = resizing_clamp(ev);
			let top = Math.min(move_pos.y, down_pos.y);
			let left = Math.min(move_pos.x, down_pos.x);
			let right = Math.max(move_pos.x, down_pos.x);
			let bottom = Math.max(move_pos.y, down_pos.y);
			top = top < snap ? 0 : top;
			left = left < snap ? 0 : left;
			right = right > wall.clientWidth - snap ? wall.clientWidth : right;
			bottom = bottom > wall.clientHeight - snap ? wall.clientHeight : bottom;
			const width = right - left;
			const height = bottom - top;
			resize(panel, { width, height });
			reposition(panel, { top, left });
		};
		const up = () => {
			wall.classList.remove('numb', 'resizing');
			removeEventListener('pointermove', move);
		};
		addEventListener('pointermove', move);
		addEventListener('pointerup', up, { once: true });
	};
	addEventListener('pointerdown', down, { once: true });
}
function resizing_clamp(ev) {
	return {
		x: Math.max(0, Math.min(ev.clientX, wall.clientWidth)),
		y: Math.max(0, Math.min(ev.clientY, wall.clientHeight)),
	};
}
function alternate(panel) {
	panel.alternate.classList.toggle('restore');
	panel.alternate.title = panel.preserved ? 'Preserve' : 'Restore';
	if (!panel.preserved)
		panel.preserved = {
			width: panel.clientWidth,
			height: panel.clientHeight,
			top: panel.offsetTop,
			left: panel.offsetLeft,
		};
	else {
		const { width, height, top, left } = panel.preserved;
		resize(panel, { width, height });
		// TODO Panel.preserved restore top and left only if panel options is non resizable
		reposition(panel, { top, left });
		panel.preserved = null;
	}
}
function squish(panel) {
	if (panel.squished) {
		if (panel.options.resizable) resize(panel, panel.squished.size);
		else reposition(panel, panel.squished.pos);
		panel.squished = null;
	} else {
		panel.squished = {
			size: {
				width: panel.clientWidth,
				height: panel.clientHeight,
			},
			pos: {
				top: panel.offsetTop,
				left: panel.offsetLeft,
			},
		};
		resize(panel);
	}
	panel.classList.toggle('squish');
}
function focus(panel) {
	wall.panels = wall.panels.filter((p) => p !== panel);
	wall.panels.forEach((p) => p.classList.remove('focus'));
	if (panel) {
		wall.panels.push(panel);
		panel.classList.add('focus');
	}
	wall.panels.forEach((p, i) => (p.style.zIndex = i));
}
function maximize(panel) {
	if (
		panel.clientWidth === wall.clientWidth &&
		panel.clientHeight === wall.clientHeight
	)
		resize(panel);
	else resize(panel, { width: wall.clientWidth, height: wall.clientHeight });
}
function reposition_cursor(panel) {
	// FIX reposition_random panel.clientWidth and panel.clientHeight are blank when the panel is created
	// FIX result in impossibility to use them for repositioning
	reposition(panel, {
		top: cursor_pos.y,
		left: cursor_pos.x,
	});
}
function reposition_random(panel) {
	// FIX reposition_random panel.clientWidth and panel.clientHeight are blank when the panel is created
	// FIX result in impossibility to use them for repositioning
	reposition(panel, {
		top: Math.round(Math.random() * wall.clientHeight - panel.clientHeight),
		left: Math.round(Math.random() * wall.clientWidth - panel.clientWidth),
	});
}
function reposition(panel, positions) {
	if (!positions) positions = { top: panel.offsetTop, left: panel.offsetLeft };
	let { top, left } = positions;
	top = Math.max(0, Math.min(top, wall.clientHeight - panel.clientHeight));
	left = Math.max(0, Math.min(left, wall.clientWidth - panel.clientWidth));
	panel.style.top = `${top}px`;
	panel.style.left = `${left}px`;
	panel.dispatchEvent(new CustomEvent('reposition', { detail: { top, left } }));
}
function resize(panel, size) {
	const { width, height } = size || {};
	panel.style.width = width ? `${width}px` : null;
	panel.style.height = height ? `${height}px` : null;
	panel.dispatchEvent(new CustomEvent('resize', { detail: { width, height } }));
}
function panel_new(options = {}) {
	const panel = document.createElement('div');
	panel.bar = document.createElement('div');
	panel.close = document.createElement('div');
	panel.grab = document.createElement('div');
	panel.resize = document.createElement('div');
	panel.alternate = document.createElement('div');
	panel.squish = document.createElement('div');
	panel.content = document.createElement('div');

	panel.options = {
		resizable: false,
		preservable: false,
		reposition_random: true,
		reposition_cursor: false,
	};
	for (let option of Object.keys(options)) {
		panel.options[option] = options[option];
	}

	panel.close.title = 'Close';
	panel.resize.title = 'Resize';
	panel.alternate.title = 'Preserve';
	panel.squish.title = 'Squish';

	panel.classList.add('panel');
	panel.bar.classList.add('bar');
	panel.close.classList.add('close', 'option');
	panel.grab.classList.add('grab');
	panel.resize.classList.add('resize', 'option');
	panel.alternate.classList.add('alternate', 'option');
	panel.squish.classList.add('squish', 'option');
	panel.content.classList.add('content');

	panel.bar.append(panel.close, panel.grab);
	if (panel.options.resizable) panel.bar.append(panel.resize);
	if (panel.options.preservable) panel.bar.append(panel.alternate);
	panel.bar.append(panel.squish);
	panel.append(panel.bar, panel.content);
	wall.append(panel);

	panel.addEventListener('pointerdown', () => focus(panel));
	const resizeObserver = new ResizeObserver((entries) =>
		entries.forEach((entry) => reposition(entry.target))
	);
	resizeObserver.observe(panel);
	panel.close.addEventListener('pointerup', (ev) => close(panel, ev));
	panel.grab.addEventListener('pointerdown', (ev) => grab(panel, ev));
	if (panel.options.resizable)
		panel.grab.addEventListener('dblclick', () => maximize(panel));
	else panel.grab.addEventListener('dblclick', () => squish(panel));
	panel.resize.addEventListener('click', (ev) => resizing(panel, ev));
	panel.alternate.addEventListener('click', () => alternate(panel));
	panel.squish.addEventListener('click', () => squish(panel));

	focus(panel);

	if (panel.options.reposition_random) reposition_random(panel);
	if (panel.options.reposition_cursor) reposition_cursor(panel);
	return panel;
}

export { panel_new, panel_focused, wall };
