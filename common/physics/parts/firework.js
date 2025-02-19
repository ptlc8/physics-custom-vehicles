import Box2D from "box2d.js";
import Shape from "../shape.js";
import VehiclePart from "../part.js";


export default class Firework extends VehiclePart {
    constructor(rotation = 0) {
        super(.2, new Shape.Box(.15, .35));
        this.rotation = rotation;
        this.attachable = true;
        this.attachDistance = 0;
        this.attachableDistance = 0.5;
        this.rotate8 = true;
        this.activable = true;
    }
    update(world) {
        if (!this.activated) return;
        let direction = new Box2D.b2Vec2(Math.cos(this.body.GetAngle() - Math.PI / 2), Math.sin(this.body.GetAngle() - Math.PI / 2));
        direction.op_mul(6);
        this.body.SetLinearVelocity(direction, this.body.GetPosition(), true);
        Box2D.destroy(direction);
    }
    getParam() {
        return this.rotation;
    }
}
