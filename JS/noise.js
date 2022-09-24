const canvas_noise = document.createElement('canvas');
canvas_noise.id = 'canvas_noise_overlay';
const ctx_noise = canvas_noise.getContext('2d');

function noise_gen() {
	canvas_noise.width = innerWidth;
	canvas_noise.height = innerHeight;
	const image_data = ctx_noise.createImageData(
		canvas_noise.width,
		canvas_noise.height
	);
	const buffer_u32 = new Uint32Array(image_data.data.buffer);
	for (let p = 0; p < buffer_u32.length; p++) {
		const saturation = Math.random() * 0xff;
		const which_color = Math.floor(Math.random() * 3);
		const alpha = 0xff000000;
		buffer_u32[p] = (saturation << (which_color * 8)) | alpha;
	}
	ctx_noise.putImageData(image_data, 0, 0);
	canvas_noise.style.opacity = 'calc(4 / 256)';
}

addEventListener('load', () => document.body.prepend(canvas_noise));
addEventListener('load', noise_gen);
addEventListener('resize', noise_gen);
