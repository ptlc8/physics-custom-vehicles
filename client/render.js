import Box2D from "box2d.js";


/**
 * Affiche la carte
 * @param {RenderContext} wCtx
 * @param {WorldMap} map
*/
export function renderMap(wCtx, map) {
    if (!map) return;
    wCtx.drawLines("green", map.groundVertices.map(e => e[0]), map.groundVertices.map(e => e[1]), .1);
}

/**
 * Affiche le fond (ciel bleu)
 * @param {RenderContext} wCtx
 */
export function renderBackground(wCtx) {
    wCtx.camera.setDistance(10);
    wCtx.drawRectInfiniteX("#6ab9e2", -20950, 2048);
    wCtx.drawImageInfiniteX("sky", 0, -128, 128, 72);
    wCtx.drawRectInfiniteX("#b4d5f4", 230, 2048);
    wCtx.camera.setDistance(1);
}

/**
 * Affiche le fond (ciel bleu)
 * @param {RenderContext} wCtx
 */
export function renderNightBackground(wCtx) {
    wCtx.camera.setDistance(10);
    wCtx.drawRectInfiniteX("#9d3945", -20950, 2048);
    wCtx.drawImageInfiniteX("night-sky", 0, -128, 128, 72);
    wCtx.drawRectInfiniteX("#ae3846", 230, 2048);
    wCtx.camera.setDistance(1);
}

/**
 * Affiche l'éditeur de véhicule
 * @param {RenderContext} wCtx
 * @param {VehiclePattern} vehiclePattern
 */
export function renderVehicleEditor(wCtx, vehiclePattern) {
    wCtx.camera.setSize(10);
    wCtx.camera.setPos(0, -1);
    for (let y = 0; y < vehiclePattern.getHeight(); y++)
        for (let x = 0; x < vehiclePattern.getWidth(y); x++) {
            wCtx.drawRect("#D0D0D0", x * 1.2 - (.6 * vehiclePattern.parts[y].length) + .6, (y - vehiclePattern.parts.length + 1) * 1.2 - .6, 1, 1);
            if (vehiclePattern.get(x, y)) {
                let angle = (vehiclePattern.get(x, y).rotation || 0) * Math.PI / 2;
                wCtx.drawImage(vehiclePattern.get(x, y).id + (vehiclePattern.get(x, y).color ?? ""), x * 1.2 - (.6 * vehiclePattern.parts[y].length) + .6, (y - vehiclePattern.parts.length + 1) * 1.2 - .6, 1, 1, angle);
                if (vehiclePattern.get(x, y).contained != undefined)
                    wCtx.drawImage(vehiclePattern.get(x, y).contained.id + (vehiclePattern.get(x, y).contained.color ?? ""), x * 1.2 - (.6 * vehiclePattern.parts[y].length) + .6, (y - vehiclePattern.parts.length + 1) * 1.2 - .6, .9, .9, angle);
                if (vehiclePattern.get(x, y).rotationAttachable) {
                    wCtx.drawImage("rotation-arrow", x * 1.2 - (.6 * vehiclePattern.parts[y].length) + .6, (y - vehiclePattern.parts.length + 1) * 1.2 - .6, 1, 1, ((vehiclePattern.get(x, y).rotation || 0) - 1) * Math.PI / 2);
                }
            }
        }
}

/**
 * Affiche un partie
 * @param {RenderContext} wCtx
 * @param {Game} game
 * @param {number} playerIdToFollow id du joueur à suivre
 */
export function renderGame(wCtx, game, playerIdToFollow, debug = false) {
    if (game === undefined) return;
    // Centrage de la caméra sur le véhicule du joueur
    let opponentIndexToFollow = game.getOpponentIndex(playerIdToFollow);
    if (game.world.vehicles[opponentIndexToFollow] !== undefined) {
        let toFollow = game.world.vehicles[opponentIndexToFollow].pos;
        wCtx.camera.setPos(toFollow ? toFollow.get_x() : 0, toFollow ? toFollow.get_y() : 0);
    }
    // Affichage des arrivées
    for (let finish of game.map.finishes) {
        wCtx.drawImage("finish", finish[0] - 1, finish[1] - 2, 2, 4);
    }
    // Véhicules
    for (const [index, vehicle] of Object.entries(game.world.vehicles)) {
        renderVehicle(wCtx, vehicle, "Joueur " + game.opponents[index], debug);
    }
}

/**
 * Affiche un véhicule
 * @param {RenderContext} wCtx
 * @param {Vehicle} vehicle
 * @param {string} name
 */
export function renderVehicle(wCtx, vehicle, name = "", debug = false) {
    for (let line of vehicle.parts) for (let part of line) {
        if (part == undefined) continue;
        if (part.attachColor)
            for (let joint of part.joints)
                wCtx.drawLine(part.attachColor, joint.GetAnchorA().get_x(), joint.GetAnchorA().get_y(), joint.GetAnchorB().get_x(), joint.GetAnchorB().get_y(), .05);
        wCtx.drawImage(part.id + (part.color != undefined ? part.color : ""), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), 1, 1, part.body.GetAngle());
        if (part.contained)
            wCtx.drawImage(part.contained.id, part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), .9, .9, part.body.GetAngle());
        if (part.id == "player" || (part.contained && part.contained.id == "player"))
            wCtx.drawText(name, part.body.GetPosition().get_x(), part.body.GetPosition().get_y() - 1, .5, "white", 0, "black", "center");
    }
    if (debug)
        renderDebugVehicle(wCtx, vehicle);
}

/**
 * Affiche un véhicule en mode debug
 * @param {RenderContext} wCtx 
 * @param {Vehicle} vehicle
 */
function renderDebugVehicle(wCtx, vehicle) {
    for (let line of vehicle.parts) for (let part of line) {
        if (part == undefined) continue;
        renderDebugBody(wCtx, part.body);
        for (let joint of part.joints) {
            wCtx.drawLine("#ffff00", joint.GetBodyA().GetPosition().get_x(), joint.GetBodyA().GetPosition().get_y(), joint.GetAnchorA().get_x(), joint.GetAnchorA().get_y(), .05);
            wCtx.drawLine("#ffff00", joint.GetBodyB().GetPosition().get_x(), joint.GetBodyB().GetPosition().get_y(), joint.GetAnchorB().get_x(), joint.GetAnchorB().get_y(), .05);
            wCtx.drawCircle("#ff0000", joint.GetAnchorA().get_x(), joint.GetAnchorA().get_y(), .1);
            wCtx.drawCircle("#ff0000", joint.GetAnchorB().get_x(), joint.GetAnchorB().get_y(), .1);
            wCtx.drawLine("#ff0000", joint.GetAnchorA().get_x(), joint.GetAnchorA().get_y(), joint.GetAnchorB().get_x(), joint.GetAnchorB().get_y(), .05);
        }
    }
}

/**
 * Affiche un corps Box2D en mode debug
 * @param {RenderContext} wCtx
 * @param {Box2D.b2Body} body
 */
function renderDebugBody(wCtx, body) {
    let shape = body.GetFixtureList().GetShape();
    wCtx.drawCircle("#0000ff", body.GetPosition().get_x(), body.GetPosition().get_y(), shape.get_m_radius(), false, .05);
    if (shape.GetType() == Box2D.b2Shape.e_polygon) {
        let polygon = Box2D.castObject(shape, Box2D.b2PolygonShape);
        let xs = [], ys = [];
        for (let i = 0; i < polygon.GetVertexCount(); i++) {
            let vertex = body.GetWorldPoint(polygon.GetVertex(i));
            xs.push(vertex.get_x());
            ys.push(vertex.get_y());
        }
        wCtx.drawLines("#0000ff", xs, ys, .05, true);
    }
    wCtx.drawText(body.GetMass().toFixed(2) + "kg", body.GetPosition().get_x(), body.GetPosition().get_y(), .4, "white", 0, "black", "center");
}

/**
 * Affiche les contrôles du véhicule d'un joueur dans une partie
 * @param {RenderContext} vCtx
 * @param {Game} game
 * @param {number} playerIdToFollow id du joueur à suivre
 * @param {{ code: string, display: string }[]} controlKeys
 */
export function renderGameControls(vCtx, game, playerIdToFollow, controlKeys) {
    let opponentIndexToFollow = game.getOpponentIndex(playerIdToFollow);
    for (const [index, vehicle] of Object.entries(game.world.vehicles)) {
        if (index == opponentIndexToFollow) {
            // Affichage des contrôles du véhicule du joueur
            for (let i = 0; i < vehicle.controls.length; i++) {
                vCtx.drawRect("#A0A0A0", i * 40 - (20 * vehicle.controls.length) + 20 + 2, 80 + 2, 30, 30);
                vCtx.drawRect("#C0C0C0", i * 40 - (20 * vehicle.controls.length) + 20, 80, 30, 30);
                vCtx.drawImage(vehicle.controls[i].id + vehicle.controls[i].color, i * 40 - (20 * vehicle.controls.length) + 20, 80, 20, 20, vehicle.controls[i].rotation * Math.PI / 2);
                vCtx.drawText(vehicle.controls[i].parts[0].activated ? "ON" : "OFF", i * 40 - (20 * vehicle.controls.length) + 8, 86, 12, "white", 0, "black");
                if (i < controlKeys.length) vCtx.drawText(controlKeys[i].display, i * 40 - (20 * vehicle.controls.length) + 34, 70, 12, "white", 0, "black", "right");
            }
        }
    }
}

/**
 * Affiche le curseur
 * @param {RenderContext} viewportContext
 * @param {Cursor} cursor
 */
export function renderCursor(viewportContext, cursor) {
    viewportContext.drawImage("cursor", cursor.viewportX, cursor.viewportY, 16, 16);
}