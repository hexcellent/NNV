let seed_increment = 0;
const seed = (seed) => {
	let x = Math.sin(seed + seed_increment) * 10000;
	seed_increment++;
	if (seed_increment > 100000000) seed_increment = 0;
	return x - Math.floor(x);
};

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

const sigmoid_derivative = (x) => x * (1 - x);

export { seed, sigmoid, sigmoid_derivative };
