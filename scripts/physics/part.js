"use strict";

if (typeof require === "function") {
    globalThis.Box2D = require("./Box2D_v2.3.1_min_46394a63");
}

/**
 * Une partie d'un véhicule
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
        this.attach = false;
        this.contain = false;
        this.contained = null;
        this.rotate4attachable = false;
        this.motorized = false;
        this.friction = 1;
        this.attachType = "default";
        this.activable = false;
        this.activableonce = true;
        this.needjointtoactivable = false;
        this.activated = false;
        this.linkD = 1;
        this.containable = false;
        this.rotate8 = false;
        this.rotation4 = false;
        this.rotation = 0;
        this.gravityinverted = false;
        // color
        //this.colors = 6;
        //this.color = 1;
    }

    /**
     * Crée le corps physique de la partie du véhicule
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
        /*if (this.id == "player" || (part.contained != undefined && part.contained.id == "player"))
            vehicle.pos = this.body.GetPosition();*/ // TODO
        this.body.CreateFixture(fd);
    }

    /**
     * Met à jour la partie du véhicule
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

VehiclePart.all = [];

/**
 * Enregistre une partie de véhicule
 * @param {string} id
 * @param {class<VehiclePart>} part
 */
VehiclePart.register = function (id, partClass) {
    VehiclePart.all.push(partClass);
    partClass.id = id;
}

/**
 * Retourne la classe de la partie de véhicule par son identifiant
 * @param {string} id
 * @returns {class<VehiclePart>}
 */
VehiclePart.getClassById = function (id) {
    for (let partClass of VehiclePart.all)
        if (partClass.id == id)
            return partClass;
}

/**
 * Crée une partie de véhicule en prenant la classe correspondant à son identifiant
 * @param {string} id 
 * @param  {...any} parameters 
 * @returns 
 */
VehiclePart.createById = function (id, ...parameters) {
    let partClass = VehiclePart.getClassById(id);
    if (!partClass)
        throw new Error("Unknown part id " + id);
    return new partClass(...parameters);
}

if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = VehiclePart;
}