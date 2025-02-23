import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Wheel extends VehiclePart { // donut
    constructor(rotation = 0) {
        super(2, new Shape.Circle(.45));
        this.rotation = rotation;
        this.rotate4 = true;
        this.rotationAttachable = true;
        this.motorized = true;
        this.friction = 3;
        this.attachType = "revolute";
        this.attachDistance = 0;
        this.attachableDistance = .55;
        this.activable = true;
        this.needjointtoactivable = true;
    }
    getParam() {
        return this.rotation;
    }
    activate(world, backward = false) {
        let speed = backward ? 100 : -100;
        for (let joint of this.joints)
            joint.SetMotorSpeed(speed);
    }
    disactivate(world) {
        for (let joint of this.joints)
            joint.SetMotorSpeed(0);
    }
}
