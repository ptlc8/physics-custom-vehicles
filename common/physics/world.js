import Box2D from "box2d.js";
import Vehicle from "./vehicle.js";


/**
 * Monde physique
 */
class World {
	/**
	 * @param {WorldMap} map
	 * @param {Array<VehiclePattern>} vehiclesPatterns
	 */
	constructor(map, vehiclesPatterns = []) {
		// Vecteur gravité (y est orienté vers le bas)
		var gravity = new Box2D.b2Vec2(0.0, 10.0);
		// Création du monde Box2D
		this.world = new Box2D.b2World(gravity);
		// Liste des joueurs par identifiant
		this.vehicles = [];
		// temps actuel du monde en 1/30 secondes
		this.tick = 0;

		// Création du sol dans le monde
		for (let i = 0; i < map.groundVertices.length - 1; i++) {
			var bd_ground = new Box2D.b2BodyDef();
			var body = this.world.CreateBody(bd_ground);
			var groundShape = new Box2D.b2EdgeShape();
			groundShape.Set(new Box2D.b2Vec2(map.groundVertices[i][0], map.groundVertices[i][1]), new Box2D.b2Vec2(map.groundVertices[i + 1][0], map.groundVertices[i + 1][1]));
			var fd = new Box2D.b2FixtureDef();
			fd.set_shape(groundShape);
			fd.set_density(0.0);
			fd.set_friction(3);
			body.CreateFixture(fd);
		}

		// Création des véhicules
		for (let i = 0; i < vehiclesPatterns.length; i++) {
			this.vehicles[i] = new Vehicle(this.world, vehiclesPatterns[i], map.spawns[i] ? map.spawns[i][0] : 0, map.spawns[i] ? map.spawns[i][1] : 0);
		}
	}
	
	/**
	 * Avance le monde de 1/30 secondes, 1 tick
	 * @param {Array<WorldEvent>} events 
	 */
	update(events) {
		for (let event of events) {
			if (event.tick == this.tick) {
				switch (event.name) {
					case "activate":
						this.vehicles[event.opponentIndex].activate(event.controlIndex);
						break;
					case "disactivate":
						this.vehicles[event.opponentIndex].disactivate(event.controlIndex);
						break;
					default:
						console.groupCollapsed("[pcv] Unknow event");
						console.error(event);
						console.groupEnd();
				}
			}
		}
		this.world.Step(1 / 30, 2, 2);
		for (let i = 0; i < this.vehicles.length; i++)
			this.vehicles[i].update(this, i % 2 == 1);
		this.tick++;
	}
	/**
	 * Détruit le monde
	 */
	destroy() {
		Box2D.destroy(this.world);
	}
	/**
	 * Provoque une explosion à un certain point (center) du monde
	 * (raycast method)
	 * @param {Box2D.b2Vec2} center 
	 * @param {number} blastRadius 
	 * @param {number} blastPower 
	 * @param {number} numRays 
	 */
	explode(center, blastRadius, blastPower, numRays = 32) {
		for (let i = 0; i < numRays; i++) {
			let angle = (i / numRays) * 2 * Math.PI;
			let rayEnd = new Box2D.b2Vec2(center.get_x() + blastRadius * Math.sin(angle), center.get_y() + blastRadius * Math.cos(angle));
			//check what this ray hits
			let myQueryCallback = new Box2D.JSRayCastCallback();
			myQueryCallback.ReportFixture = function (fixturePtr, point, normal, fraction) {
				var fixture = Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
				if (fixture.GetBody().GetType() == Box2D.b2_dynamicBody)
					applyBlastImpulse(fixture.GetBody(), center, myQueryCallback.point, blastPower / numRays);
				//Box2D.destroy(rayEnd);
			};
			this.world.RayCast(myQueryCallback, center, rayEnd);
		}
		//Box2D.destroy(center);
	}
}

/**
 * Applique un effet d'explosion sur un corps du monde
 * (source : http://www.iforce2d.net/b2dtut/explosions)
 * @param {Box2D.b2Body} body
 * @param {Box2D.b2Vec2} blastCenter
 * @param {Box2D.b2Vec2} applyPoint
 * @param {number} blastPower
 */
function applyBlastImpulse(body, blastCenter, applyPoint = body.GetPosition(), blastPower = 1) {
	var blastDir = new Box2D.b2Vec2(applyPoint.get_x() - blastCenter.get_x(), applyPoint.get_y() - blastCenter.get_y());
	let distance = blastDir.Normalize();
	// ignorer les corps exactement au point d'explosion - la direction d'explosion n'est pas definie
	if (distance == 0) return;
	let invDistance = 1 / distance;
	let impulseMag = blastPower * invDistance * invDistance;
	blastDir.op_mul(impulseMag);
	body.ApplyLinearImpulse(blastDir, applyPoint, true);
	Box2D.destroy(blastDir);
}

export default World;
