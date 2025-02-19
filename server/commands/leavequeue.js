export default {
	args: {},
	execute: function(connectionId, args) {
		this.cancelWait(connectionId);
		return {
			command: "build"
		};
	}
};
