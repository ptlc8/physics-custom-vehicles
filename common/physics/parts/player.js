import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class PlayerVehiclePart extends VehiclePart { // pain d'épice ? fraise des bois ?
	constructor() {
		super(.1, new Shape.Circle(.45));
		this.containable = true;
	}
}
