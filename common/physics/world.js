import Box2D from "box2d.js";
import Items from "./items.js";


function World(map, vehiclesPatterns=[]) {
	// Vecteur gravité (y est orienté vers le bas)
	var gravity = new Box2D.b2Vec2(0.0, 10.0);
	// Création du monde Box2D
	this.world = new Box2D.b2World(gravity);
	// Liste des joueurs par identifiant
	this.vehicles = [];
	// temps actuel du monde en 1/30 secondes
	this.tick = 0;
	
	// Création du sol dans le monde
	for (let i = 0; i < map.groundVertices.length-1; i++) {
		var bd_ground = new Box2D.b2BodyDef();
		var body = this.world.CreateBody(bd_ground);
		var groundShape = new Box2D.b2EdgeShape();
		groundShape.Set(new Box2D.b2Vec2(map.groundVertices[i][0], map.groundVertices[i][1]), new Box2D.b2Vec2(map.groundVertices[i+1][0], map.groundVertices[i+1][1]));
		var fd = new Box2D.b2FixtureDef();
		fd.set_shape(groundShape);
		fd.set_density(0.0);
		fd.set_friction(3);
		body.CreateFixture(fd);
	}
	
	// Création des véhicules
	for (let i = 0; i < vehiclesPatterns.length; i++) {
		this.vehicles[i] = new Vehicle(this.world, vehiclesPatterns[i], map.spawns[i]?map.spawns[i][0]:0, map.spawns[i]?map.spawns[i][1]:0);
	}
}

// avance le monde de 1/30 secondes, 1 tick
World.prototype.update = function(events) {
	for (let event of events) {
		if (event.tick == this.tick) {
			switch (event.name) {
				case "activate":
					for (let part of this.vehicles[event.opponentIndex].controls[event.controlIndex].parts)
						part.activated = true;
					break;
				case "disactivate":
					for (let part of this.vehicles[event.opponentIndex].controls[event.controlIndex].parts)
						part.activated = false;
					break;
				default:
					console.group("[pcv] Unknow event");
					console.error(event);
					console.groupEnd();
			}
		}
	}
	this.world.Step(1/30, 2, 2);
	for (let vehicle of this.vehicles) {
		for (let line of vehicle.parts) for (let part of line) {
			if (part==undefined) continue;
			let partId  = part.containedactivable ? part.contained.id : part.id;
			let direction = new Box2D.b2Vec2(Math.cos(part.body.GetAngle()-Math.PI/2),Math.sin(part.body.GetAngle()-Math.PI/2));
			if (partId == "firework" && part.activated) {
				direction.op_mul(6);
				part.body.SetLinearVelocity(direction, part.body.GetPosition(), true);
			} else if (partId == "p" && part.activated) {
				direction.op_mul(-4);
				part.body.SetLinearVelocity(direction, part.body.GetPosition(), true);
			} else if (partId == "pop" && part.activated) { // explosion !!!
				for (let i = part.joints.length-1; i >= 0; i--) this.world.DestroyJoint(part.joints.pop());
				// delete part
				this.explode(part.body.GetPosition(), 10, 64);
				part.activated = false;
			} else if (partId == "w+" && part.joints[0]!=undefined) {
				part.joints[0].SetMaxMotorTorque(part.activated?5:0);
				part.joints[0].SetMotorSpeed(part.activated?-10:0);
			}
			Box2D.destroy(direction);
		}
	}
	this.tick++;
}

// Détruire le monde
World.prototype.destroy = function() {
	/*let body = this.world.GetBodyList();
	for (let i = 0; i < this.world.GetBodyCount(); i++) {
		let b = body;
		body = body.GetNext();
		this.world.DestroyBody(b);
	}
	let joint = this.world.GetJointList();
	for (let i = 0; i < this.world.GetJointCount(); i++) {
		let j = joint;
		joint = joint.GetNext();
		this.world.DestroyJoint(j);
	}*/
	Box2D.destroy(this.world);
}

//World.prototype.Vehicle = Vehicle;

// private // Construit un véhicule à partir d'un pattern en (x, y) du monde
function Vehicle(world, reducedPattern, x=0, y=0) {
	this.parts = [];
	this.controls = [];
	x -= reducedPattern[0].length/2;
	y -= reducedPattern.length;
	// Assemblage du pattern avec toutes les infos
	let pattern = [];
	for (let l of reducedPattern) {
		let line = [];
		for (let p of l) {
			if (p && p.id) {
				let part = clone(Items.getItem(p.id)); 
				if (p.color) part.color = p.color;
				if (p.rotation) part.rotation = p.rotation;
				if (p.rotationattachable) part.rotationattachable = p.rotationattachable;
				if (p.contained) {
					part.contained = clone(Items.getItem(p.contained.id));
					if (p.contained.color) part.contained.color = p.contained.color;
				}
				line.push(part);
			} else
				line.push(undefined);
		}
		pattern.push(line);
	}
	// Création des differentes parties
	for (let i = 0; i < pattern.length; i++) {
		this.parts[i] = [];
		for (let j = 0; j < pattern[i].length; j++) {
			if (!pattern[i][j]) continue;
			{
				var bd = new Box2D.b2BodyDef();
				bd.set_type(Box2D.b2_dynamicBody);
				bd.set_position(new Box2D.b2Vec2(x+j, y+i));
				if (pattern[i][j].rotation!=undefined)
					bd.set_angle(pattern[i][j].rotation*Math.PI/2);
				if (pattern[i][j].gravityinverted)
					bd.set_gravityScale(-1);
				this.parts[i][j] = {body:world.CreateBody(bd), id:pattern[i][j].id, joints:[]};
				var shape;
				if (["w+","player","baloon"].includes(pattern[i][j].id)) {
					shape = new Box2D.b2CircleShape();
					shape.set_m_radius(.45);
				} else if (pattern[i][j].id == "w-") {
					shape = new Box2D.b2CircleShape();
					shape.set_m_radius(.22);
				} else if (pattern[i][j].id == "firework") {
					shape = new Box2D.b2PolygonShape();
					shape.SetAsBox(.15, .35);
				} else if (pattern[i][j].id == "p") {
					shape = new Box2D.b2PolygonShape();
					shape.SetAsBox(.5, .1);
				} else if (pattern[i][j].id == "weight") {
					shape = createPolygonShape([new Box2D.b2Vec2(.2,0),new Box2D.b2Vec2(-.2,0),new Box2D.b2Vec2(-.4,.4),new Box2D.b2Vec2(.4,.4)]);
				} else { // box, box+, player?
					shape = new Box2D.b2PolygonShape();
					shape.SetAsBox(.5, .5);
				}
				var fd = new Box2D.b2FixtureDef();
				fd.set_shape(shape);
				fd.set_density(pattern[i][j].density);
				fd.set_friction(pattern[i][j].friction||1);
				if (pattern[i][j].contained!=undefined) {
					this.parts[i][j].contained = {id:pattern[i][j].contained.id};
					fd.set_density(pattern[i][j].density+pattern[i][j].contained.density);
				}
				if (pattern[i][j].id=="player" || (pattern[i][j].contained!=undefined && pattern[i][j].contained.id=="player"))
						this.pos = this.parts[i][j].body.GetPosition();
				if (pattern[i][j].colorable)
					this.parts[i][j].color = pattern[i][j].color||0;
				this.parts[i][j].body.CreateFixture(fd);
			}
		}
	}
	// Création des liens entre les parties du véhicule 
	for (let i = 0; i < pattern.length; i++) {
		for (let j = 0; j < pattern[i].length; j++) {
			if (pattern[i][j]==undefined) continue;
			if (i!=0 && pattern[i-1][j]!=undefined && pattern[i-1][j].attach) { // possible lien en y-
				if (pattern[i][j].attach || pattern[i][j].attachable)
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i-1][j].body, new Box2D.b2Vec2(0,1), undefined));
				if (pattern[i][j].rotate4attachable && (pattern[i][j].rotationattachable||0)==0) {
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i-1][j].body, new Box2D.b2Vec2(0,pattern[i][j].linkD||1), undefined, pattern[i][j].motorized));
				}
			}
			if (j!=0 && pattern[i][j-1]!=undefined && pattern[i][j-1].attach) { // possible lien en x-
				if (pattern[i][j].attach || pattern[i][j].attachable)
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i][j-1].body, new Box2D.b2Vec2(1,0), undefined));
				if (pattern[i][j].rotate4attachable && pattern[i][j].rotationattachable==3) {
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i][j-1].body, new Box2D.b2Vec2(pattern[i][j].linkD||1,0), undefined, pattern[i][j].motorized));
				}
			}
			if (i!=pattern.length-1 && pattern[i+1][j]!=undefined && pattern[i+1][j].attach) { // possible lien en y+
				if ((pattern[i][j].rotate4attachable && pattern[i][j].rotationattachable==2) || pattern[i][j].attachable) {
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i+1][j].body, new Box2D.b2Vec2(0,-(pattern[i][j].linkD||1)), undefined, pattern[i][j].motorized));
				}
			}
			if (j!=pattern[i].length-1 && pattern[i][j+1]!=undefined && pattern[i][j+1].attach) { // possible lien en x+
				if ((pattern[i][j].rotate4attachable && pattern[i][j].rotationattachable==1) || pattern[i][j].attachable) {
					this.parts[i][j].joints.push(joinBodies(world, pattern[i][j].attachType, this.parts[i][j].body, this.parts[i][j+1].body, new Box2D.b2Vec2(-(pattern[i][j].linkD||1),0), undefined, pattern[i][j].motorized));
				}
			}
		}
	}
	// Création des différents contrôles du véhicules
	var controls = {};
	for (let i = 0; i < pattern.length; i++) {
		for (let j = 0; j < pattern[i].length; j++) {
			if (pattern[i][j]==undefined) continue;
			if (pattern[i][j].activable && (!pattern[i][j].needjointtoactivable || this.parts[i][j].joints.length!=0)) {
				let controlId = pattern[i][j].id+(pattern[i][j].rotation||0)+(!!pattern.activableonce)+(pattern[i][j].color||0);
				if (controls[controlId]==undefined)
					controls[controlId] = {id:pattern[i][j].id,parts:[],rotation:(pattern[i][j].rotation||0),activableonce:pattern[i][j].activableonce,color:pattern[i][j].colorable?pattern[i][j].color||0:""};
				controls[controlId].parts.push(this.parts[i][j]);
			}
			if (pattern[i][j].contained!=undefined && pattern[i][j].contained.activable && !pattern[i][j].contained.needjointtoactivable) {
				let controlId = pattern[i][j].contained.id+(pattern[i][j].contained.rotation||0)+(!!pattern[i][j].contained.activableonce)+(pattern[i][j].contained.color||0);
				if (controls[controlId]==undefined)
					controls[controlId] = {id:pattern[i][j].contained.id,parts:[],rotation:(pattern[i][j].contained.rotation||0),activableonce:pattern[i][j].contained.activableonce,color:pattern[i][j].contained.colorable?pattern[i][j].contained.color||0:""};
				controls[controlId].parts.push(this.parts[i][j]);
				this.parts[i][j].containedactivable = true;
			}
		}
	}
	this.controls = Object.values(controls);
}

// Applique un effet d'explosion sur un corps du monde // source : http://www.iforce2d.net/b2dtut/explosions
function applyBlastImpulse(body, blastCenter, applyPoint=body.GetPosition(), blastPower=1) {
	var blastDir = new Box2D.b2Vec2(applyPoint.get_x()-blastCenter.get_x(), applyPoint.get_y()-blastCenter.get_y());
	let distance = blastDir.Normalize();
	// ignorer les corps exactement au point d'explosion - la direction d'explosion n'est pas definie
	if (distance == 0) return;
	let invDistance = 1 / distance;
	let impulseMag = blastPower * invDistance * invDistance;
	blastDir.op_mul(impulseMag);
	body.ApplyLinearImpulse(blastDir, applyPoint, true);
	Box2D.destroy(blastDir);
}

// Provoque une explosion à un certain point (center) du monde // raycast method
World.prototype.explode = function(center, blastRadius, blastPower, numRays=32) {
	for (let i = 0; i < numRays; i++) {
		let angle = (i/numRays) * 2*Math.PI;
		let rayEnd = new Box2D.b2Vec2(center.get_x()+blastRadius*Math.sin(angle), center.get_y()+blastRadius*Math.cos(angle));
		//check what this ray hits
		let myQueryCallback = new Box2D.JSRayCastCallback();
		myQueryCallback.ReportFixture = function(fixturePtr, point, normal, fraction) { // fixture, point, normal, fraction
			var fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
			if (fixture.GetBody().GetType() == Box2D.b2_dynamicBody)
				applyBlastImpulse(fixture.GetBody(), center, myQueryCallback.point, blastPower/numRays);
			//Box2D.destroy(rayEnd);
		};
		this.world.RayCast(myQueryCallback, center, rayEnd);
	}
	//Box2D.destroy(center);
}

// Relie 2 corps
function joinBodies(world, joinType, bodyA, bodyB, originB, angleOrLength=joinType=="rope"?2:bodyB.GetAngle()-bodyA.GetAngle(), motor=false) {
	if (joinType=="revolute") return revoluteJoinBodies(world, bodyA, bodyB, originB, angleOrLength, motor);
	if (joinType=="rope") return ropeJoinBodies(world, bodyA, bodyB, originB, angleOrLength);
	return defaultJoinBodies(world, bodyA, bodyB, originB, angleOrLength);
}

// Accroche 2 corps ensemble
function defaultJoinBodies(world, bodyA, bodyB, originB, angle) {
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

// unused // 
function weldJoinBodies(world, bodyA, bodyB, aX, aY, bX, bY, collide=true) {
	var jd = new Box2D.b2WeldJointDef();
	jd.set_bodyA(bodyA);
	jd.set_bodyB(bodyB);
	jd.set_localAnchorA(new Box2D.b2Vec2(aX,aY));
	jd.set_localAnchorB(new Box2D.b2Vec2(bX,bY));
	if (collide) jd.set_collideConnected(true);
	jd.set_dampingRatio(0.5);
	jd.set_referenceAngle(0);
	var joint = world.CreateJoint(jd);
	Box2D.destroy(jd);
	return Box2D.castObject(joint, Box2D.b2WeldJoint);
}

// Accroche 2 corps avec un axe de rotation
function revoluteJoinBodies(world, bodyA, bodyB, originB, angle=0, motor=false) {
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

// Relie 2 corps avec une corde de longueur length
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

// deprecated
function wheelJoinBodies(world, bodyA, bodyB, originA, axis, motor=false) {
	var jd = new Box2D.b2WheelJointDef();
	jd.Initialize(bodyA, bodyB, bodyB.GetPosition(), axis);
	jd.set_collideConnected(true);
	jd.set_motorSpeed(0);
	jd.set_enableMotor(motor);
	jd.set_maxMotorTorque(motor?20.0:10.0);
	jd.set_frequencyHz(4.0);
	jd.set_dampingRatio(0.7);
	var joint = world.CreateJoint(jd);
	Box2D.destroy(jd);
	return Box2D.castObject(joint, Box2D.b2WheelJoint);
}

// clone un objet
function clone(obj) {
	if (obj===undefined) return undefined;
	return JSON.parse(JSON.stringify(obj));
}


function createPolygonShape(vertices) {
    var shape = new Box2D.b2PolygonShape();            
    var buffer = Box2D._malloc(vertices.length * 8);
    var offset = 0;
    for (var i=0;i<vertices.length;i++) {
        Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].get_x();
        Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y();
        offset += 8;
    }            
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
}


export default World;
