const Gamemodes = {
	SOLO: {
		name: "SOLO",
		players: 1,
		isEnd: function() {}
	},
	RUSH: {
		name: "RUSH",
		players: 2,
		isEnd: function(world) {
			for (let playerId in world.vehicles) {
				world.vehicles[playerId].pos.get_x();
			}
		}
	}
};

Gamemodes.getByName = function(name) {
	return Gamemodes[name];
};

export default Gamemodes;
