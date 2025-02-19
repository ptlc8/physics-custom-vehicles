import Box2D from "box2d.js";
import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Propeller extends VehiclePart {
    constructor(rotation = 0) {
        super(.2, new Shape.Box(.5, .1));
        this.rotation = rotation;
        this.rotate4 = true;
        this.rotationAttachable = true;
        this.attachType = "default";
        this.attachDistance = .12;
        this.activable = true;
        this.needjointtoactivable = true;
    }
    update(world) {
        if (!this.activated) return;
        let direction = new Box2D.b2Vec2(Math.cos(this.body.GetAngle() - Math.PI / 2), Math.sin(this.body.GetAngle() - Math.PI / 2));
        direction.op_mul(-4);
        this.body.SetLinearVelocity(direction, this.body.GetPosition(), true);
        Box2D.destroy(direction);
    }
    getParam() {
        return this.rotation;
    }
}
