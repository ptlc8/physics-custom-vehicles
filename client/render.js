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
    wCtx.drawRectInfiniteX("#6ab9e2", -2176, 242);
    wCtx.drawImageInfiniteX("sky", 0, -128, 128, 72);
    wCtx.drawRectInfiniteX("#b4d5f4", -56, 2048);
    wCtx.camera.setDistance(1);
}

/**
 * Affiche l'éditeur de véhicule
 * @param {RenderContext} wCtx
 * @param {Array<Array<VehiclePart>>} vehiclePattern
 */
export function renderVehicleEditor(wCtx, vehiclePattern) {
    for (let i = 0; i < vehiclePattern.length; i++)
        for (let j = 0; j < vehiclePattern[i].length; j++) {
            wCtx.drawRect("#D0D0D0", j * 1.2 - (.6 * vehiclePattern[i].length) + .6, (i - vehiclePattern.length + 1) * 1.2 - .6, 1, 1);
            if (vehiclePattern[i][j]) {
                let angle = (vehiclePattern[i][j].rotation || 0) * Math.PI / 2;
                wCtx.drawImage(vehiclePattern[i][j].id + (vehiclePattern[i][j].color ?? ""), j * 1.2 - (.6 * vehiclePattern[i].length) + .6, (i - vehiclePattern.length + 1) * 1.2 - .6, 1, 1, angle);
                if (vehiclePattern[i][j].contained != undefined)
                    wCtx.drawImage(vehiclePattern[i][j].contained.id + (vehiclePattern[i][j].contained.color ?? ""), j * 1.2 - (.6 * vehiclePattern[i].length) + .6, (i - vehiclePattern.length + 1) * 1.2 - .6, .9, .9, angle);
                if (vehiclePattern[i][j].rotationAttachable) {
                    wCtx.drawImage("rotation-arrow", j * 1.2 - (.6 * vehiclePattern[i].length) + .6, (i - vehiclePattern.length + 1) * 1.2 - .6, 1, 1, ((vehiclePattern[i][j].rotation || 0) - 1) * Math.PI / 2);
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
export function renderGame(wCtx, game, playerIdToFollow) {
    if (game === undefined) return;
    // Centrage de la caméra sur le véhicule du joueur
    let opponentIndexToFollow = game.getPlayerIndex(playerIdToFollow);
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
        for (let line of vehicle.parts) for (let part of line) {
            if (part == undefined) continue;
            wCtx.drawImage(part.id + (part.color != undefined ? part.color : ""), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), 1, 1, part.body.GetAngle());
            if (part.contained)
                wCtx.drawImage(part.contained.id, part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), .9, .9, part.body.GetAngle());
            if (part.id == "player" || (part.contained && part.contained.id == "player"))
                wCtx.drawText("Joueur " + game.opponents[index], part.body.GetPosition().get_x(), part.body.GetPosition().get_y() - 1, .5, "white", 0, "black", "center");
        }
    }
}

/**
 * Affiche les contrôles du véhicule d'un joueur dans une partie
 * @param {RenderContext} vCtx
 * @param {Game} game
 * @param {number} playerIdToFollow id du joueur à suivre
 * @param {{ code: string, display: string }[]} controlKeys
 */
export function renderGameControls(vCtx, game, playerIdToFollow, controlKeys) {
    let opponentIndexToFollow = game.getPlayerIndex(playerIdToFollow);
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