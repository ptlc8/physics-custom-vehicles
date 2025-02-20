export default {
	args: {},
	execute: function(connectionId, args) {
		this.waitingPlayers.splice(this.waitingPlayers.find(e=>e.id==connectionId), 1);
		return {
			command: "leavequeue"
		};
	}
};
