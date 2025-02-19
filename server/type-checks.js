export function isString(value) {
    return typeof value == "string";
}

export function isNumber(value) {
    return typeof value == "number";
}

export function isPositiveInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

export function isValidVehiclePattern(pattern, width=7, height=5) {
	if (pattern.length > height) return false;
	let havePlayer = false;
	for (let line of pattern) {
		if (line.length > width) return false;
		for (let part of line) {
			if (part == undefined) continue;
			if (typeof part !== "object")
				return false;
			if (part.id=="player" || (part.param && part.param.id == "player"))
				havePlayer = true;
		}
	}
	return havePlayer;
}