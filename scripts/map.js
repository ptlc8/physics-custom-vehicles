//
// groundVertices, spawns et finishes de la forme [[x,y],[x,y]]
function Map(groundVertices=[], spawns=[], finishes=[]) {
	this.groundVertices = groundVertices;
	this.spawns = spawns;
	this.finishes = finishes;
}

// static // caster un objet en Map
Map.cast = function(obj) {
    let map = new Map(obj.groundVertices, obj.spawns);
    return map;
}

// static // créer un sol sinusoïdal 
Map.createSinusoidalGround = function(width=500, height=10, amplitude=10, rudeness=0.5) {
	let groundVertices = [];
	for (let i = 0; i < width/amplitude/rudeness; i++) {
		let vertex = [];
		vertex[0] = i*amplitude*rudeness-15;
		vertex[1] = i<=3/rudeness?0:Math.sin(i*rudeness)*height/2;
		groundVertices.push(vertex);
	}
	return groundVertices;
}

// static // créer un carte d'affrontement 1v1
Map.createMatchMap = function() {
	return new Map([[-30,0],[30,0]], [[-20,0],[20,0]], [[20,0],[-20,0]]);
}

if (typeof exports === 'object' && typeof module === 'object') {
	module.exports = Map;
}