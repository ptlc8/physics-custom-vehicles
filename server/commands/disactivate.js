import { isPositiveInteger, isString } from "../type-checks.js";


// Uniquement en jeu, désactive un controle du véhicule
export default {
	args: { index: isPositiveInteger, tag: isString },
	execute: function(connectionId, args) {
		let gameId = this.players[connectionId].game;
		if (gameId === undefined)
			throw "Not in game";
		var event = this.games[gameId].disactivate(connectionId, args.index, args.tag);
		this.broadcastGame(gameId, {command:"gameevent",event:event});
	}
};
