import Box2D from "box2d.js";
import Shape from "./shape.js";
import VehiclePart from "./part.js";


class Waffle extends VehiclePart {
	constructor(contained = null) {
		super(.2, new Shape.Box(.5, .5));
		this.attach = true;
		this.contain = true;
		this.contained = contained ? VehiclePart.createById(contained.id, contained.param) : null;
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

class Box extends VehiclePart { // biscuit ? chocolat ?
	constructor(contained = null) {
		super(.3, new Shape.Box(.5, .5));
		this.attach = true;
		this.contain = true;
		this.contained = contained ? VehiclePart.createById(contained.id, contained.param) : null;
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

class Wheel extends VehiclePart { // donut
	constructor(rotation = 0) {
		super(.2, new Shape.Circle(.45));
		this.rotation = rotation;
		this.rotate4 = true;
		this.rotationAttachable = true;
		this.motorized = true;
		this.friction = 3;
		this.attachType = "revolute";
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

class SmallWheel extends VehiclePart {
	constructor(rotation = 0) {
		super(.2, new Shape.Circle(.22));
		this.rotation = rotation;
		this.rotate4 = true;
		this.rotationAttachable = true;
		this.friction = 1;
		this.linkD = .75;
		this.attachType = "revolute";
	}
	getParam() {
		return this.rotation;
	}
}

class PlayerVehiclePart extends VehiclePart { // pain d'épice ? fraise des bois ?
	constructor() {
		super(.1, new Shape.Circle(.45));
		this.containable = true;
	}
}

class Firework extends VehiclePart {
	constructor(rotation = 0) {
		super(.2, new Shape.Box(.15, .35));
		this.rotation = rotation;
		this.attachable = true;
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

class Propeller extends VehiclePart {
	constructor(rotation = 0) {
		super(.2, new Shape.Box(.5, .1));
		this.rotation = rotation;
		this.rotate4 = true;
		this.rotationAttachable = true;
		this.linkD = .62;
		this.attachType = "default";
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

class Balloon extends VehiclePart { // -350g
	/**
	 * @param {number} color 
	 */
	constructor(color = 1) {
		super(.35, new Shape.Circle(.45));
		this.attachable = true;
		this.gravityinverted = true;
		this.attachType = "rope";
		this.colors = 6;
		this.color = color;
	}
	getParam() {
		return this.color;
	}
}

class Weight extends VehiclePart { // 336g // cerise
	constructor() {
		super(1.4, new Shape.Polygon([[.2, 0], [-.2, 0], [-.4, .4], [.4, .4]]));
		this.attachable = true;
		this.attachType = "rope";
	}
}

class PopCorn extends VehiclePart {
	constructor() {
		super(.3, new Shape.Box(.5, .5));
		this.attachable = true;
		this.attachType = "default";
		this.activable = true;
		this.activableonce = true;
		this.containable = true;
	}
	update(world) {
		if (!this.activated) return;
		for (let i = this.joints.length - 1; i >= 0; i--) world.world.DestroyJoint(this.joints.pop());
		// delete part
		world.explode(this.body.GetPosition(), 10, 64);
		this.activated = false;
	}
}

// toaster
// parapluie
// ressort // marshmallow ?
// corde // reglisse ?
// axe de rotation (en mode pince)


export function registerParts() {
	VehiclePart.register("waffle", Waffle);
	VehiclePart.register("box", Box);
	VehiclePart.register("wheel", Wheel);
	VehiclePart.register("small-wheel", SmallWheel);
	VehiclePart.register("player", PlayerVehiclePart);
	VehiclePart.register("firework", Firework);
	VehiclePart.register("propeller", Propeller);
	VehiclePart.register("balloon", Balloon);
	VehiclePart.register("weight", Weight);
	VehiclePart.register("pop", PopCorn);
}