if (typeof exports === 'object' && typeof module === 'object') {
	if (require) {
		World = require("./world");
	}
	module.exports = Game;
}

if (Box2D == undefined)
	throw "Need Box2D var to be declared";

function Game(map, gamemode, vehiclesPatterns=[], opponents=[]) {
	// Carte [sol, spawns] de la partie
	this.map = map;
	// Mode de jeu de la partie (cf. gamemodes.js)
	this.gamemode = gamemode;
	// Patterns des véhicules de la partie
	this.vehiclesPatterns = vehiclesPatterns;
	// Liste des identifiants des opposants
	this.opponents = opponents;
	// Liste des identifiants des spectateurs
	this.spectators = [];
	// Monde de actuel de la partie
	this.world = new World(map, vehiclesPatterns);
	// Liste des évents qui se sont déroulés (activation, désactivation...) par ordre chronologique
	this.events = [];
}

// démarre le monde
Game.prototype.start = function() {
	this.stop();
	let startTime = Date.now()-this.world.tick/30*1000;
	this.updateIntervalId = setInterval(() => {
		while (this.world.tick < (Date.now()-startTime)*30/1000) {
			this.world.update(this.events);
			if (this.gamemode.isEnd(this.world)) {

			}
		}
	}, 1000/30);
}

// arrête le monde
Game.prototype.stop = function() {
	if (!this.updateIntervalId) return;
	clearInterval(this.updateIntervalId);
}

// ajoute un évent à la suite de la liste et le retourne, unreal pour le client (les events envoyés pas encore reçus)
Game.prototype.pushEvent = function(event, unreal=false) {
	event.tick = this.world.tick;
	if (!unreal) event.index = this.events.length;
	this.events.push(event);
	return event;
}

// client seulement // insert un event à un tick donné et revient en arrière
Game.prototype.insertEvent = function(index, tick, event) {
	event.tick = tick;
	event.index = index;
	let toPlace = event;
	for (let i = index; toPlace!==undefined; i++) {
		if (this.events[i] && this.events[i].tag == event.tag) {
			this.events[i] = event;
			break;
		}
		if (this.events[i] && this.events[i].index == i)
			continue;
		let tmp = this.events[i];
		this.events[i] = toPlace;
		toPlace = tmp;
	}
	//events.splice(index, 0, event);
	// Si l'évent est censé être passé, on regénère le monde
	if (tick < this.world.tick) {
		var newWorld = new World(this.map, this.vehiclesPatterns);
		for (let i = 0; i < this.world.tick; i++) {
			newWorld.update(this.events);
		}
		let exWorld = this.world;
		this.world = newWorld;
		exWorld.destroy();
	}
	return event;
}

// ajoute l'évent d'activation d'un contrôle
Game.prototype.activate = function(playerId, controlIndex, tag=undefined, unreal=false) {
	return this.pushEvent({name:"activate",opponentIndex:this.getPlayerIndex(playerId),controlIndex:controlIndex,tag:tag}, unreal);
}

// ajoute l'évent de désactivation d'un contrôle
Game.prototype.disactivate = function(playerId, controlIndex, tag=undefined, unreal=false) {
	return this.pushEvent({name:"disactivate",opponentIndex:this.getPlayerIndex(playerId),controlIndex:controlIndex,tag:tag}, unreal);
}

// retourne l'indice d'un joueur selon l'ordre des opposants
Game.prototype.getPlayerIndex = function(playerId) {
	for (let index in this.opponents)
		if (this.opponents[index] == playerId)
			return index;
	return undefined; 
}
