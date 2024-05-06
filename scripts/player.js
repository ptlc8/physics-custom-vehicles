if (typeof exports === 'object' && typeof module === 'object') {
	if (require) {
		Items = require("./physics/items");
	}
	module.exports = Player;
}

function Player(name) {
	// Nom du joueur
	this.name = name;
	// Inventaire du joueur
	this.inventory = {};
	// Véhicules préenregistrés
	this.vehicles = [];
	// identifiant de la game dans laquelle il est
	this.game = undefined;
	// Don de tous les items à la création du joueur
	for (let item of Items) {
		this.inventory[item.id] = {amount:20};
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
	if (obj.vehicles) player.vehicles = obj.vehicles;
	if (obj.game) player.game = obj.game;
    return player;
}
