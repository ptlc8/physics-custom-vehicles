import Box2D from "box2d.js";
import { allParts, createPartById } from "./parts.js";


/**
 * Véhicule à partir d'un pattern en (x, y) du monde
 */
class Vehicle {
    /**
     * @param {Box2D.b2World} world monde
     * @param {VehiclePattern} pattern
     * @param {number} y position x
     * @param {number} x position y
     */
    constructor(world, pattern, x = 0, y = 0) {
        this.parts = [];
        this.controls = [];
        x -= pattern.parts[0].length / 2;
        y -= pattern.parts.length;
        // Assemblage du pattern avec toutes les infos
        for (let i = 0; i < pattern.parts.length; i++) {
            this.parts[i] = [];
            for (let j = 0; j < pattern.parts[i].length; j++) {
                if (!pattern.parts[i][j]) continue;
                this.parts[i][j] = createPartById(pattern.parts[i][j].id, pattern.parts[i][j].getParam());
                this.parts[i][j].createBody(world, x + j, y + i);
                if (this.parts[i][j] instanceof allParts["player"] || this.parts[i][j].contained instanceof allParts["player"]) {
                    this.pos = this.parts[i][j].body.GetPosition();
                }
            }
        }
        // Création des liens entre les pièces du véhicule
        for (let i = 0; i < this.parts.length; i++) {
            for (let j = 0; j < this.parts[i].length; j++) {
                let part = this.parts[i][j];
                if (!part) continue;
                // Si la pièce au dessus est une attache (y-)
                let ymPart = this.parts[i - 1] ? this.parts[i - 1][j] : undefined;
                if (ymPart && ymPart.attach) {
                    // Si la pièce actuelle est une attache aussi ou attachable
                    if (part.attach || part.attachable)
                        part.joints.push(joinBodies(world, part.attachType, part.body, ymPart.body, [0, -part.attachDistance], [0, ymPart.attachDistance + part.attachableDistance], undefined, part.motorized));
                    // Si la pièce actuelle est rotativement attachable et tournée vers le hauts
                    if (part.rotationAttachable && part.rotation == 0)
                        part.joints.push(joinBodies(world, part.attachType, part.body, ymPart.body, [0, -part.attachDistance], [0, ymPart.attachDistance + part.attachableDistance], undefined, part.motorized));
                }
                // Si la pièce à gauche est une attache (x-)
                let xmPart = this.parts[i][j - 1];
                if (xmPart && xmPart.attach) {
                    // Si la pièce actuelle est une attache aussi ou attachable
                    if (part.attach || part.attachable)
                        part.joints.push(joinBodies(world, part.attachType, part.body, xmPart.body, [-part.attachDistance, 0], [xmPart.attachDistance + part.attachableDistance, 0], undefined, part.motorized));
                    // Si la pièce actuelle est rotativement attachable et tournée vers la gauche
                    if (part.rotationAttachable && part.rotation == 3)
                        part.joints.push(joinBodies(world, part.attachType, part.body, xmPart.body, [0, -part.attachDistance], [xmPart.attachDistance + part.attachableDistance, 0], undefined, part.motorized));
                }
                // Si la pièce en dessous est une attache (y+)
                let ypPart = this.parts[i + 1] ? this.parts[i + 1][j] : undefined;
                if (ypPart && ypPart.attach) {
                    // Si la pièce actuelle est attachable
                    if (part.attachable)
                        part.joints.push(joinBodies(world, part.attachType, part.body, ypPart.body, [0, part.attachDistance], [0, -ypPart.attachDistance - part.attachableDistance], undefined, part.motorized));
                    // Si la pièce actuelle est rotativement attachable et tournée vers le bas
                    if (part.rotationAttachable && part.rotation == 2)
                        part.joints.push(joinBodies(world, part.attachType, part.body, ypPart.body, [0, -part.attachDistance], [0, -ypPart.attachDistance - part.attachableDistance], undefined, part.motorized));
                }
                // Si la pièce à droite est une attache (x+)
                let xpPart = this.parts[i][j + 1];
                if (xpPart && xpPart.attach) {
                    // Si la pièce actuelle est attachable
                    if (part.attachable)
                        part.joints.push(joinBodies(world, part.attachType, part.body, xpPart.body, [part.attachDistance, 0], [-xpPart.attachDistance - part.attachableDistance, 0], undefined, part.motorized));
                    // Si la pièce actuelle est rotativement attachable et tournée vers la droite
                    if (part.rotationAttachable && part.rotation == 1)
                        part.joints.push(joinBodies(world, part.attachType, part.body, xpPart.body, [0, -part.attachDistance], [-xpPart.attachDistance - part.attachableDistance, 0], undefined, part.motorized));
                }
            }
        }
        // Création des différents contrôles du véhicules
        var controls = {};
        for (let i = 0; i < this.parts.length; i++) {
            for (let j = 0; j < this.parts[i].length; j++) {
                if (this.parts[i][j] == undefined) continue;
                let controlId = this.parts[i][j].getControlId();
                if (!controlId) continue;
                if (!controls[controlId])
                    controls[controlId] = this.parts[i][j].createControl();
                controls[controlId].parts.push(this.parts[i][j]);
            }
        }
        this.controls = Object.values(controls);
    }

    /**
     * Met à jour le véhicule
     * @param {World} world
     * @param {boolean} backward
     */
    update(world, backward = false) {
        for (let line of this.parts) for (let part of line) {
            if (part == undefined) continue;
            part.update(world, backward);
        }
    }

    /**
     * Active un contrôle du véhicule
     * @param {Box2D.b2World} world
     * @param {number} controlIndex
     * @param {boolean} backward
     */
    activate(world, controlIndex, backward = false) {
        for (let part of this.controls[controlIndex].parts) {
            part.activated = true;
            part.activate(world, backward);
        }
    }

    /**
     * Désactive un contrôle du véhicule
     * @param {Box2D.b2World} world
     * @param {number} controlIndex
     * @param {boolean} backward
     */
    disactivate(world, controlIndex, backward = false) {
        for (let part of this.controls[controlIndex].parts) {
            part.activated = false;
            part.disactivate(world, backward);
        }
    }

}

/**
 * Accroche 2 corps ensemble
 * @param {Box2D.b2World} world
 * @param {string} joinType
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {[number, number]} originA
 * @param {[number, number]} originB
 * @param {number} angleOrLength
 * @param {boolean} motor
 * @returns {Box2D.b2RevoluteJoint|Box2D.b2RopeJoint|Box2D.b2WeldJoint}
 */
function joinBodies(world, joinType, bodyA, bodyB, originA, originB, angleOrLength = joinType == "rope" ? 2 : bodyB.GetAngle() - bodyA.GetAngle(), motor = false) {
    if (joinType == "revolute") return revoluteJoinBodies(world, bodyA, bodyB, originA, originB, angleOrLength, motor);
    if (joinType == "rope") return ropeJoinBodies(world, bodyA, bodyB, originA, originB, angleOrLength);
    return weldJoinBodies(world, bodyA, bodyB, originA, originB, angleOrLength);
}

/**
 * Accroche 2 corps ensemble
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {[number, number]} originA
 * @param {[number, number]} originB
 * @param {number} angle
 * @returns {Box2D.b2WeldJoint}
 */
function weldJoinBodies(world, bodyA, bodyB, originA, originB, angle) {
    var jd = new Box2D.b2WeldJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorA(new Box2D.b2Vec2(...originA));
    jd.set_localAnchorB(new Box2D.b2Vec2(...originB));
    jd.set_collideConnected(true);
    jd.set_dampingRatio(0.5);
    jd.set_referenceAngle(angle);
    var joint = world.CreateJoint(jd);
    return Box2D.castObject(joint, Box2D.b2WeldJoint);
}

/**
 * Accroche 2 corps avec un axe de rotation
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {[number, number]} originA
 * @param {[number, number]} originB
 * @param {number} angle
 * @param {boolean} motor
 * @returns {Box2D.b2RevoluteJoint}
 */
function revoluteJoinBodies(world, bodyA, bodyB, originA, originB, angle = 0, motor = false) {
    var jd = new Box2D.b2RevoluteJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorA(new Box2D.b2Vec2(...originA));
    jd.set_localAnchorB(new Box2D.b2Vec2(...originB));
    //jd.set_collideConnected(true);
    jd.set_enableMotor(motor);
    jd.set_maxMotorTorque(10);
    jd.set_referenceAngle(angle);
    var joint = world.CreateJoint(jd);
    return Box2D.castObject(joint, Box2D.b2RevoluteJoint);
}

/**
 * Relie 2 corps avec une corde
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {[number, number]} originA
 * @param {[number, number]} originB
 * @param {number} length longueur de la corde
 * @returns {Box2D.b2RopeJoint}
 */
function ropeJoinBodies(world, bodyA, bodyB, originA, originB, length) {
    var jd = new Box2D.b2RopeJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorA(new Box2D.b2Vec2(...originA));
    jd.set_localAnchorB(new Box2D.b2Vec2(...originB));
    jd.set_maxLength(length);
    jd.set_collideConnected(true);
    var joint = world.CreateJoint(jd);
    return Box2D.castObject(joint, Box2D.b2RopeJoint);
}


export default Vehicle;