import Box2D from "box2d.js";


/**
 * Une pièce d'un véhicule
 */
class VehiclePart {
    /**
     * @param {number} density 
     * @param {Shape} shape 
     */
    constructor(density, shape) {
        this.id = this.constructor.id;
        this.density = density;
        this.shape = shape;
        this.friction = 1;
        this.attach = false;
        this.contain = false;
        this.contained = null;
        this.attachable = false;
        this.attachType = "default";
        this.attachDistance = .5;
        this.attachableDistance = 0;
        this.attachColor = null;
        this.motorized = false;
        this.activable = false;
        this.activableonce = true;
        this.needjointtoactivable = false;
        this.activated = false;
        this.containable = false;
        this.rotate4 = false;
        this.rotate8 = false;
        this.rotation = 0;
        this.rotationAttachable = false;
        this.gravityinverted = false;
        this.colors = 0;
        this.color = null;
    }

    /**
     * Crée le corps physique de la pièce du véhicule
     * @param {Box2D.b2World} world
     * @param {number} x
     * @param {number} y
     */
    createBody(world, x, y) {
        var bd = new Box2D.b2BodyDef();
        bd.set_type(Box2D.b2_dynamicBody);
        bd.set_position(new Box2D.b2Vec2(x, y));
        if (this.rotation != undefined)
            bd.set_angle(this.rotation * Math.PI / 2);
        if (this.gravityinverted)
            bd.set_gravityScale(-1);
        this.body = world.CreateBody(bd);
        this.joints = [];
        var shape = this.shape.toBox2D();
        var fd = new Box2D.b2FixtureDef();
        fd.set_shape(shape);
        fd.set_density(this.density);
        fd.set_friction(this.friction);
        if (this.contained)
            fd.set_density(this.density + this.contained.density);
        this.body.CreateFixture(fd);
    }

    /**
     * Met à jour la pièce du véhicule
     * @param {World} world
     */
    update(world) { }

    /**
     * Retourne l'identifiant du contrôle
     * @returns {string}
     */
    getControlId() {
        if (this.activable && (!this.needjointtoactivable || this.joints.length != 0))
            return this.id + (this.rotation || 0) + (!!this.activableonce) + (this.color || 0);
        if (this.contained && this.contained.activable && !this.contained.needjointtoactivable)
            return this.contained.id + (this.contained.rotation || 0) + (!!this.contained.activableonce) + (this.contained.color || 0);
        return null;
    }

    createControl() {
        if (this.activable && (!this.needjointtoactivable || this.joints.length != 0))
            return { id: this.id, parts: [], rotation: (this.rotation || 0), activableonce: this.activableonce, color: this.color ?? "" };
        if (this.contained && this.contained.activable && !this.contained.needjointtoactivable)
            return { id: this.contained.id, parts: [], rotation: (this.contained.rotation || 0), activableonce: this.contained.activableonce, color: this.contained.color ?? "" }
        return null;
    }

    getParam() {
        return undefined;
    }
}


export default VehiclePart;