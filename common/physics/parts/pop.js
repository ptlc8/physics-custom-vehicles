import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class PopCorn extends VehiclePart {
    constructor() {
        super(.3, new Shape.Box(.5, .5));
        this.attachable = true;
        this.attachType = "default";
        this.activable = true;
        this.activableonce = true;
        this.containable = true;
    }
    activate(world) {
        for (let i = this.joints.length - 1; i >= 0; i--)
            world.world.DestroyJoint(this.joints.pop());
        // TODO: delete part
        world.explode(this.body.GetPosition(), 10, 64);
        this.activated = false;
    }
}
