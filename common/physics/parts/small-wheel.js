import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class SmallWheel extends VehiclePart {
    constructor(rotation = 0) {
        super(.2, new Shape.Circle(.22));
        this.rotation = rotation;
        this.rotate4 = true;
        this.rotationAttachable = true;
        this.friction = 1;
        this.attachType = "revolute";
        this.attachDistance = 0;
        this.attachableDistance = .25;
    }
    getParam() {
        return this.rotation;
    }
}
