function Ground() {
	this.xs = [];
	this.ys = [];
	// Génération d'un sol sinusoïdal
	for (let i = 0; i < 100; i++) {
		this.xs[i] = i*10-10;
		this.ys[i] = i<2?0:-Math.sin(/*Math.sqrt*/(106-i))*5;
	}
}

// static // caster un objet en Ground
Ground.cast = function(obj) {
    let ground = new Ground();
	if (obj.xs) ground.xs = obj.xs;
	if (obj.ys) ground.ys = obj.ys;
    return ground;
};


export default Ground;
