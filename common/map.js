export default class WorldMap {

	/**
	 * @typedef {[x: number, y: number][]} Ground
	 */

	/**
	 * @param {Ground[]} grounds
	 * @param {[x: number, y: number][]} spawns
	 * @param {[x: number, y: number][]} finishes
	 */
	constructor(grounds = [], spawns = [], finishes = []) {
		this.grounds = grounds;
		this.spawns = spawns;
		this.finishes = finishes;
	}

	/**
	 * Caste un objet en WorldMap
	 * @param {Object} obj
	 */
	static cast(obj) {
		let map = new WorldMap(obj.grounds, obj.spawns, obj.finishes);
		return map;
	}

	static createSoloMap() {
		return new WorldMap(
			[
				createFlatGround(-15, 100),
				...createLooping(35, 0, 5),
				...createLooping(75, 0, 10),
				createSinusoidalGround(85)
			],
			[[0, 0]],
			[[385, -4.8]]
		);
	}

	/**
	 * Crée un carte d'affrontement 1v1
	 * @returns {WorldMap}
	 */
	static createMatchMap() {
		return new WorldMap(
			[
				createFlatGround(-30, 60)
			],
			[[-20, 0], [20, 0]],
			[[20, 0], [-20, 0]]
		);
	}

}

/**
 * Crée un sol plat
 * @param {number} x
 * @param {number} width
 */
export function createFlatGround(x, width = 500) {
	return [[x, 0], [x + width, 0]];
}

/**
 * Crée un sol sinusoïdal
 * @param {number} x
 * @param {number} width
 * @param {number} height
 * @param {number} amplitude
 * @param {number} rudeness
 * @returns {Ground}
 */
export function createSinusoidalGround(x, width = 500, height = 10, amplitude = 10, rudeness = 0.5) {
	let vertices = [];
	for (let i = 0; i < width / amplitude / rudeness; i++) {
		let vertex = [];
		vertex[0] = x + i * amplitude * rudeness;
		vertex[1] = Math.sin(i * rudeness) * height / 2;
		vertices.push(vertex);
	}
	return vertices;
}

/**
 * Crée un looping
 * @returns {Ground[]}
 */
export function createLooping(x, y, r = 10) {
	let springboard = [];
	for (let i = 0; i < 30; i++) {
		let vertex = [];
		vertex[0] = x - r / 2 - 1 + Math.sin(i / 180 * Math.PI) * r;
		vertex[1] = y - r + Math.cos(i / 180 * Math.PI) * r;
		springboard.push(vertex);
	}
	for (let i = 330; i < 360; i++) {
		let vertex = [];
		vertex[0] = x + r / 2 - 1 + Math.sin(i / 180 * Math.PI) * r;
		vertex[1] = y - r + Math.cos(i / 180 * Math.PI) * r;
		springboard.push(vertex);
	}
	let loop = [];
	for (let i = 30; i < 330; i++) {
		let vertex = [];
		vertex[0] = x + Math.sin(i / 180 * Math.PI) * r;
		vertex[1] = y - r * 1.2 - 1 + Math.cos(i / 180 * Math.PI) * r;
		loop.push(vertex);
	}
	return [springboard, loop];
}
