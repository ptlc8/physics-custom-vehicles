import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Balloon extends VehiclePart {
    /**
     * @param {number} color 
     */
    constructor(color = 1) {
        super(.35, new Shape.Circle(.45));
        this.attachable = true;
        this.gravityinverted = true;
        this.attachType = "rope";
        this.attachColor = "black";
        this.colors = 6;
        this.color = color;
        this.activable = true;
    }
    getParam() {
        return this.color;
    }
    activate(world) {
        world.playSound("balloon-pop1");
    }
}
