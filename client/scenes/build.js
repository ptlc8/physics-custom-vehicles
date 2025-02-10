import Scene from "../scene.js";
//import { renderVehicleEditor } from "./common/render.js";


const u = undefined; // tmp :)

class BuildScene extends Scene {
    constructor() {
        super();
        /** @type {Array<Array<VehiclePart>>} */
        this.vehiclePattern = [[u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u]];
        /** @type {VehiclePart} */
        this.placingItem = undefined;
    }
    render(wctx, rctx, rendererRatio) {

    }
    onMouseDown(remote, event) {
        // Clic gauche
        if (event.button == 0) {
            // Bouton start
            if (Math.sqrt(Math.pow(120-event.rx, 2)+Math.pow(event.ry, 2)) < 10) {
                remote.startSolo(reducePattern(this.vehiclePattern));
                return;
            }
            // Bouton duo
            if (Math.sqrt(Math.pow(event.rx-120, 2)+Math.pow(event.ry+30, 2)) < 10) {
                remote.startMatch(reducePattern(this.vehiclePattern));
                return;
            }
            // Bouton spectate
            if (Math.sqrt(Math.pow(event.rx + 120, 2) + Math.pow(event.ry + 30, 2)) < 10) {
                remote.spectate(parseInt(prompt("Quel est l'identifiant du joueur à regarder ?")));
                return;
            }
            // Barre d'inventaire
            let inventory = Object.entries(remote.selfPlayer.inventory).map(e => ({ id: e[0], amount: e[1].amount }));
            let inventoryIndex = Math.floor(2.5 - event.ry / 40) * 9 + Math.floor((event.rx + 20 * Math.min(9, inventory.length)) / 40);
            if (0 <= inventoryIndex && inventoryIndex < inventory.length && this.placingItem == undefined && inventory[inventoryIndex].amount > 0) {
                this.placingItem = VehiclePart.createById(inventory[inventoryIndex].id);
                remote.selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
                return;
            }
            // Édition du véhicule 
            let vehicleIndex = Math.floor(event.wy / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= vehicleIndex && vehicleIndex < this.vehiclePattern.length) {
                let vehicleJndex = Math.floor((event.wx + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= vehicleJndex && vehicleJndex < this.vehiclePattern[0].length && this.placingItem == undefined && this.vehiclePattern[vehicleIndex][vehicleJndex] != undefined) {
                    this.placingItem = this.vehiclePattern[vehicleIndex][vehicleJndex].contained || this.vehiclePattern[vehicleIndex][vehicleJndex];
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex].contained) this.vehiclePattern[vehicleIndex][vehicleJndex].contained = undefined;
                    else this.vehiclePattern[vehicleIndex][vehicleJndex] = undefined;
                    return;
                }
            }
        }
        // Clic droit
        if (event.button == 2) {
            let vehicleIndex = Math.floor(event.wy / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= vehicleIndex && vehicleIndex < this.vehiclePattern.length) {
                let vehicleJndex = Math.floor((event.wx + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= vehicleJndex && vehicleJndex < this.vehiclePattern[0].length/* && this.placingItem==undefined*/) {
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex] == undefined) return;
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex].rotate4attachable) {
                        this.vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable = ((this.vehiclePattern[vehicleIndex][vehicleJndex].rotationattachable || 0) + 1) % 4;
                    }
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex].rotate4) {
                        this.vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((this.vehiclePattern[vehicleIndex][vehicleJndex].rotation || 0) + 1) % 4;
                    }
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex].rotate8) {
                        this.vehiclePattern[vehicleIndex][vehicleJndex].rotation = ((this.vehiclePattern[vehicleIndex][vehicleJndex].rotation || 0) + .5) % 4;
                    }
                    if ("color" in this.vehiclePattern[vehicleIndex][vehicleJndex])
                        this.vehiclePattern[vehicleIndex][vehicleJndex].color = ((this.vehiclePattern[vehicleIndex][vehicleJndex].color || 0) + 1) % this.vehiclePattern[vehicleIndex][vehicleJndex].colors;
                    return;
                }
            }
        }
    }
    onMouseUp(remote, event) {
        if (event.button == 0) {
            let vehicleIndex = Math.floor(event.wy / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= vehicleIndex && vehicleIndex < this.vehiclePattern.length) {
                let vehicleJndex = Math.floor((event.wx + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= vehicleJndex && vehicleJndex < this.vehiclePattern[0].length) {
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex] != undefined && this.vehiclePattern[vehicleIndex][vehicleJndex].contain && this.placingItem != undefined && this.placingItem.containable) {
                        if (this.vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
                            remote.selfPlayer.addToInventory(this.vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
                        this.vehiclePattern[vehicleIndex][vehicleJndex].contained = this.placingItem;
                        this.placingItem = undefined;
                        return;
                    }
                    if (this.vehiclePattern[vehicleIndex][vehicleJndex] != undefined) {
                        remote.selfPlayer.addToInventory(this.vehiclePattern[vehicleIndex][vehicleJndex].id);
                        if (this.vehiclePattern[vehicleIndex][vehicleJndex].contained != undefined)
                            remote.selfPlayer.addToInventory(this.vehiclePattern[vehicleIndex][vehicleJndex].contained.id);
                    }
                    this.vehiclePattern[vehicleIndex][vehicleJndex] = this.placingItem;
                    this.placingItem = undefined;
                    return;
                }
            }
            if (this.placingItem) {
                remote.selfPlayer.addToInventory(this.placingItem.id, 1);
                if (this.placingItem.contained != undefined)
                    remote.selfPlayer.addToInventory(this.placingItem.contained.id, 1);
                this.placingItem = undefined;
            }
        }
    }
    onKeyDown(remote, event) {

    }
    onKeyUp(remote, event) {

    }
}

/**
 * Reduce a vehicle pattern to be serializable in JSON
 * @param {Array<Array<VehiclePart>>} pattern 
 * @returns {Array<Array<Object>>}
 */
function reducePattern(pattern) {
	var reducedPattern = [];
	for (let l of pattern) {
		let line = [];
		for (let p of l)
			line.push(p ? { id: p.id, param: p.getParam() } : undefined);
		reducedPattern.push(line);
	}
	return reducedPattern;
}


export default BuildScene;