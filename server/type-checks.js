import VehiclePattern from "../common/physics/vehicle-pattern.js";


export function isString(value) {
    if (typeof value != "string")
		throw "Invalid string";
	return value;
}

export function isNumber(value) {
    if (typeof value != "number")
		throw "Invalid number";
}

export function isPositiveInteger(value) {
	if (!Number.isInteger(value) || value < 0)
		throw "Invalid positive integer";
	return value;
}

export function isValidVehiclePattern(value) {
	let pattern = VehiclePattern.cast(value);
	if (!pattern.isValid())
		throw "Invalid vehicle pattern";
	return pattern;
}