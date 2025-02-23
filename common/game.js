import World from "./physics/world.js";
export default Game;


function Game(map, gamemode, vehiclesPatterns = [], opponents = []) {
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
	// Dernier son joué
	this.nextSoundToPlay = 0;
}

// démarre le monde
Game.prototype.start = function() {
	this.stop();
	let startTime = Date.now() - this.world.tick / 30 * 1000;
	this.updateIntervalId = setInterval(() => {
		while (this.world.tick < (Date.now() - startTime) * 30 / 1000) {
			this.world.update(this.events);
			if (this.gamemode.isEnd(this.world)) {

			}
		}
	}, 1000 / 30);
}

// arrête le monde
Game.prototype.stop = function() {
	if (!this.updateIntervalId) return;
	clearInterval(this.updateIntervalId);
}

// ajoute un évent à la suite de la liste et le retourne, unreal pour le client (les events envoyés pas encore reçus)
Game.prototype.pushEvent = function(event, unreal = false) {
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
	for (let i = index; toPlace !== undefined; i++) {
		if (this.events[i] && this.events[i].tag == event.tag) {
			let unrealEvent = this.events[i];
			this.events[i] = event;
			if (event.tick != unrealEvent.tick)
				this.regenerate();
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
		this.regenerate();
	}
	return event;
}

Game.prototype.regenerate = function() {
	console.log("[pcv] A regenaration has occurred");
	var newWorld = new World(this.map, this.vehiclesPatterns);
	for (let i = 0; i < this.world.tick; i++) {
		newWorld.update(this.events);
	}
	let exWorld = this.world;
	this.world = newWorld;
	exWorld.destroy();
}

// ajoute l'évent d'activation d'un contrôle
Game.prototype.activate = function(playerId, controlIndex, tag = undefined, unreal = false) {
	return this.pushEvent({
		name: "activate",
		opponentIndex: this.getOpponentIndex(playerId),
		controlIndex: controlIndex,
		tag: tag
	}, unreal);
}

// ajoute l'évent de désactivation d'un contrôle
Game.prototype.disactivate = function(playerId, controlIndex, tag = undefined, unreal = false) {
	return this.pushEvent({
		name: "disactivate",
		opponentIndex: this.getOpponentIndex(playerId),
		controlIndex: controlIndex,
		tag: tag
	}, unreal);
}

// retourne l'indice d'un opposant à partir de son identifiant de joueur
Game.prototype.getOpponentIndex = function(playerId) {
	let opponentIndex = this.opponents.indexOf(playerId);
	if (opponentIndex < 0)
		throw "Invalid opponent";
	return opponentIndex;
}

// ajoute un spectateur
Game.prototype.addSpectator = function(playerId) {
	this.spectators.push(playerId);
	return true;
}

// supprime un spectateur
Game.prototype.removeSpectator = function(playerId) {
	let spectatorIndex = this.spectators.indexOf(playerId);
	if (spectatorIndex < 0)
		return false;
	this.spectators.splice(spectatorIndex, 1);
	return true;
}

Game.prototype.getSoundsToPlay = function() {
	let sounds = [];
	for (let i = this.nextSoundToPlay; i < this.world.sounds.length; i++) {
		sounds.push(this.world.sounds[i].name);
		this.nextSoundToPlay++;
	}
}
