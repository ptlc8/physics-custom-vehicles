import Shape from "../shape.js";
import VehiclePart from "../part.js";
import { createPartById } from "../parts.js";


export default class Waffle extends VehiclePart {
    constructor(contained = null) {
        super(.2, new Shape.Box(.5, .5));
        this.attach = true;
        this.contain = true;
        this.contained = contained ? createPartById(contained.id, contained.param) : null;
    }
    update(world) {
        if (this.contained)
            this.contained.update(world);
    }
    getParam() {
        if (!this.contained) return null;
        return { id: this.contained.id, param: this.contained.getParam() };
    }
}
