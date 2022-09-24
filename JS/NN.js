/**
 * @author Auracle
 * @brief Neural Network class
 * @version 1.0
 * @date 2022-09-06
 *
 * @copyright Copyright (c) 2022
 *
 */
import { seed, sigmoid, sigmoid_derivative } from './math.js';

const SEED = 694201337;
const LEARNING_RATE = 1;
const randomize = () => seed(SEED) * 2 - 1;
let uuid_increment = 0;

class Weight {
	constructor() {
		this.value = randomize();
	}
}

class Neuron {
	constructor() {
		this.weights = [];
	}
}

class Layer {
	constructor(neurons) {
		this.neurons = Array(neurons)
			.fill()
			.map(() => new Neuron());
		this.bias = randomize();
	}
}
class Network {
	constructor(layers) {
		this.UUID = uuid_increment++;
		this.layers = [];
		for (let neurons of layers) this.layers.push(new Layer(neurons));
		let weights = 1;
		for (let layer of this.layers) {
			for (let neuron of layer.neurons) {
				neuron.weights = Array(weights)
					.fill()
					.map(() => new Weight());
			}
			weights = layer.neurons.length;
		}
	}

	set_value(layer, neuron, weight, value) {
		this.layers[layer].neurons[neuron].weights[weight].value = value;
	}
}

class SupervisedNetwork {
	constructor(inputs, network, theorized) {
		this.inputs = inputs;
		for (const [i, v] of inputs.entries()) network.set_value(0, i, 0, v);
		this.network = network;
		this.theorized = theorized;
	}
}

const forward = (network, inputs) => {
	let outputs = [];
	for (let i = 0; i < network.layers.length; i++) {
		let layer = network.layers[i];
		outputs = layer.neurons.map((neuron) => {
			let sum = 0;
			for (let j = 0; j < neuron.weights.length; j++) {
				let weight = neuron.weights[j];
				sum += weight.value * (outputs[j] || inputs[j]);
			}
			sum += layer.bias;
			return sigmoid(sum);
		});
	}
	return outputs;
};

function backward(network, error, learning_rate = LEARNING_RATE) {
	let deltas = [];
	for (let i = network.layers.length - 1; i > 0; i--) {
		let layer = network.layers[i];
		deltas = layer.neurons.map((neuron, j) => {
			let output = deltas[j] || error;
			let delta = output * sigmoid_derivative(output);
			for (let k = 0; k < neuron.weights.length; k++) {
				let weight = neuron.weights[k];
				weight.value += learning_rate * delta * (deltas[k] || error);
			}
			return delta;
		});
	}
}

export { Network, SupervisedNetwork, forward, backward };
