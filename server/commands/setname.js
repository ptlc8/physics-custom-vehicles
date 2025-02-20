import { isString } from "../type-checks.js";
import Player from "../../common/player.js";


// Renvoie l'inventaire du joueur
export default {
	args: { "name": isString },
	execute: function(connectionId, args) {
		if (args.name.length < 3)
			throw "name too short";
		this.players[connectionId] = new Player(args.name);
		return {
			command: "logged",
			self: this.players[connectionId],
			selfId: connectionId
		};
	}
};
