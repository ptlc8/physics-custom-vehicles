import { allParts } from "./physics/parts.js";


function Player(name) {
	// Nom du joueur
	this.name = name;
	// Inventaire du joueur
	this.inventory = {};
	// Véhicule enregistré
	this.vehiclePattern = undefined;
	// identifiant de la game dans laquelle il est
	this.game = undefined;
	// Don de tous les pièces de véhicule à la création du joueur
	for (let partId in allParts) {
		this.inventory[partId] = {amount:20};
	}
}

// ajouter amount item à l'inventaire du joueur
Player.prototype.addToInventory = function(itemId, amount=1) {
	if (this.inventory[itemId])
		this.inventory[itemId].amount += amount;
	else
		this.inventory[itemId] = {amount: amount};
}

// ajouter amount item à l'inventaire du joueur
Player.prototype.removeFromInventory = function(itemId, amount=1) {
	this.inventory[itemId].amount -= amount;
}

// static // caster un objet en Player
Player.cast = function(obj) {
	let player = new Player(obj.name);
	if (obj.inventory) player.inventory = obj.inventory;
	if (obj.vehiclePattern) player.vehiclePattern = obj.vehiclePattern;
	if (obj.game) player.game = obj.game;
	return player;
}

export default Player;
