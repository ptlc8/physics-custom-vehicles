import Box2D from "box2d.js";
import VehiclePart from "./part.js";


/**
 * Véhicule à partir d'un pattern en (x, y) du monde
 */
class Vehicle {
    /**
     * @param {Box2D.b2World} world monde
     * @param {Array<Array<Object>>} reducedPattern
     * @param {number} y position x
     * @param {number} x position y
     */
    constructor(world, reducedPattern, x = 0, y = 0) {
        this.parts = [];
        this.controls = [];
        x -= reducedPattern[0].length / 2;
        y -= reducedPattern.length;
        // Assemblage du pattern avec toutes les infos
        for (let i = 0; i < reducedPattern.length; i++) {
            this.parts[i] = [];
            for (let j = 0; j < reducedPattern[i].length; j++) {
                if (!reducedPattern[i][j]) continue;
                this.parts[i][j] = VehiclePart.createById(reducedPattern[i][j].id, reducedPattern[i][j].param);
                this.parts[i][j].createBody(world, x + j, y + i);
                if (this.parts[i][j] instanceof VehiclePart.all["player"] || this.parts[i][j].contained instanceof VehiclePart.all["player"]) {
                    this.pos = this.parts[i][j].body.GetPosition();
                }
            }
        }
        // Création des liens entre les pièces du véhicule
        for (let i = 0; i < this.parts.length; i++) {
            for (let j = 0; j < this.parts[i].length; j++) {
                if (!this.parts[i][j]) continue;
                if (i != 0 && this.parts[i - 1][j] != undefined && this.parts[i - 1][j].attach) { // possible lien en y-
                    if (this.parts[i][j].attach || this.parts[i][j].attachable)
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i - 1][j].body, new Box2D.b2Vec2(0, 1), undefined));
                    if (this.parts[i][j].rotationAttachable && (this.parts[i][j].rotation || 0) == 0) {
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i - 1][j].body, new Box2D.b2Vec2(0, this.parts[i][j].linkD || 1), undefined, this.parts[i][j].motorized));
                    }
                }
                if (j != 0 && this.parts[i][j - 1] != undefined && this.parts[i][j - 1].attach) { // possible lien en x-
                    if (this.parts[i][j].attach || this.parts[i][j].attachable)
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i][j - 1].body, new Box2D.b2Vec2(1, 0), undefined));
                    if (this.parts[i][j].rotationAttachable && this.parts[i][j].rotation == 3) {
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i][j - 1].body, new Box2D.b2Vec2(this.parts[i][j].linkD || 1, 0), undefined, this.parts[i][j].motorized));
                    }
                }
                if (i != this.parts.length - 1 && this.parts[i + 1][j] != undefined && this.parts[i + 1][j].attach) { // possible lien en y+
                    if ((this.parts[i][j].rotationAttachable && this.parts[i][j].rotation == 2) || this.parts[i][j].attachable) {
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i + 1][j].body, new Box2D.b2Vec2(0, -(this.parts[i][j].linkD || 1)), undefined, this.parts[i][j].motorized));
                    }
                }
                if (j != this.parts[i].length - 1 && this.parts[i][j + 1] != undefined && this.parts[i][j + 1].attach) { // possible lien en x+
                    if ((this.parts[i][j].rotationAttachable && this.parts[i][j].rotation == 1) || this.parts[i][j].attachable) {
                        this.parts[i][j].joints.push(joinBodies(world, this.parts[i][j].attachType, this.parts[i][j].body, this.parts[i][j + 1].body, new Box2D.b2Vec2(-(this.parts[i][j].linkD || 1), 0), undefined, this.parts[i][j].motorized));
                    }
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
     */
    update(world) {
        for (let line of this.parts) for (let part of line) {
            if (part == undefined) continue;
            part.update(world);
        }
    }

    /**
     * Active un contrôle du véhicule
     * @param {number} controlIndex
     */
    activate(controlIndex) {
        for (let part of this.controls[controlIndex].parts)
            part.activated = true;
    }

    /**
     * Désactive un contrôle du véhicule
     * @param {number} controlIndex
     */
    disactivate(controlIndex) {
        for (let part of this.controls[controlIndex].parts)
            part.activated = false;
    }

}

/**
 * Accroche 2 corps ensemble
 * @param {Box2D.b2World} world
 * @param {string} joinType
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {Box2D.b2Vec2} originB
 * @param {number} angleOrLength
 * @param {boolean} motor
 * @returns {Box2D.b2RevoluteJoint|Box2D.b2RopeJoint|Box2D.b2WeldJoint}
 */
function joinBodies(world, joinType, bodyA, bodyB, originB, angleOrLength = joinType == "rope" ? 2 : bodyB.GetAngle() - bodyA.GetAngle(), motor = false) {
    if (joinType == "revolute") return revoluteJoinBodies(world, bodyA, bodyB, originB, angleOrLength, motor);
    if (joinType == "rope") return ropeJoinBodies(world, bodyA, bodyB, originB, angleOrLength);
    return weldJoinBodies(world, bodyA, bodyB, originB, angleOrLength);
}

/**
 * Accroche 2 corps ensemble
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {Box2D.b2Vec2} originB
 * @param {number} angle
 * @returns {Box2D.b2WeldJoint}
 */
function weldJoinBodies(world, bodyA, bodyB, originB, angle) {
    var jd = new Box2D.b2WeldJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorB(originB);
    jd.set_collideConnected(true);
    jd.set_dampingRatio(0.5);
    jd.set_referenceAngle(angle);
    var joint = world.CreateJoint(jd);
    Box2D.destroy(jd);
    return Box2D.castObject(joint, Box2D.b2WeldJoint);
}

/**
 * Accroche 2 corps avec un axe de rotation
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {Box2D.b2Vec2} originB
 * @param {number} angle
 * @param {boolean} motor
 * @returns {Box2D.b2RevoluteJoint}
 */
function revoluteJoinBodies(world, bodyA, bodyB, originB, angle = 0, motor = false) {
    var jd = new Box2D.b2RevoluteJointDef();
    //jd.Initialize(bodyA, bodyB, bodyA.GetPosition());
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    //jd.set_localAnchorA(new Box2D.b2Vec2(aX,aY));
    jd.set_localAnchorB(originB);
    //jd.set_collideConnected(true);
    jd.set_motorSpeed(0);
    jd.set_enableMotor(motor);
    //jd.set_maxMotorTorque(motor?20.0:10.0);
    //jd.set_frequencyHz(4.0);
    //jd.set_dampingRatio(0.7);
    jd.set_referenceAngle(angle);
    var joint = world.CreateJoint(jd);
    Box2D.destroy(jd);
    return Box2D.castObject(joint, Box2D.b2RevoluteJoint);
}

/**
 * Relie 2 corps avec une corde
 * @param {Box2D.b2World} world
 * @param {Box2D.b2Body} bodyA
 * @param {Box2D.b2Body} bodyB
 * @param {Box2D.b2Vec2} originB
 * @param {number} length longueur de la corde
 * @returns {Box2D.b2RopeJoint}
 */
function ropeJoinBodies(world, bodyA, bodyB, originB, length) {
    var jd = new Box2D.b2RopeJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorB(originB);
    jd.set_maxLength(length);
    jd.set_collideConnected(true);
    var joint = world.CreateJoint(jd);
    Box2D.destroy(jd);
    return Box2D.castObject(joint, Box2D.b2RopeJoint);
}

// unused // 
function _weldJoinBodies(world, bodyA, bodyB, aX, aY, bX, bY, collide = true) {
    var jd = new Box2D.b2WeldJointDef();
    jd.set_bodyA(bodyA);
    jd.set_bodyB(bodyB);
    jd.set_localAnchorA(new Box2D.b2Vec2(aX, aY));
    jd.set_localAnchorB(new Box2D.b2Vec2(bX, bY));
    if (collide) jd.set_collideConnected(true);
    jd.set_dampingRatio(0.5);
    jd.set_referenceAngle(0);
    var joint = world.CreateJoint(jd);
    Box2D.destroy(jd);
    return Box2D.castObject(joint, Box2D.b2WeldJoint);
}


export default Vehicle;