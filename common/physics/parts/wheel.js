import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Wheel extends VehiclePart { // donut
    constructor(rotation = 0) {
        super(.2, new Shape.Circle(.45));
        this.rotation = rotation;
        this.rotate4 = true;
        this.rotationAttachable = true;
        this.motorized = true;
        this.friction = 3;
        this.attachType = "revolute";
        this.attachDistance = 0;
        this.attachableDistance = .5;
        this.activable = true;
        this.needjointtoactivable = true;
    }
    update(world) {
        if (this.joints.length > 0) {
            this.joints[0].SetMaxMotorTorque(this.activated ? 5 : 0);
            this.joints[0].SetMotorSpeed(this.activated ? -10 : 0);
        }
    }
    getParam() {
        return this.rotation;
    }
}
