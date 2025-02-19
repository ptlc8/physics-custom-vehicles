import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Weight extends VehiclePart { // 336g // cerise
	constructor() {
		super(1.4, new Shape.Polygon([[.2, 0], [-.2, 0], [-.4, .4], [.4, .4]]));
		this.attachable = true;
		this.attachType = "rope";
		this.attachDistance = 0;
		this.attachColor = "black";
	}
}
