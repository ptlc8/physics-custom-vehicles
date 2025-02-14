import Scene from "../engine/scene.js";
import { renderVehicleEditor } from "../render.js";
import VehiclePart from "../../common/physics/part.js";


const u = undefined; // tmp :)

class BuildScene extends Scene {

    constructor() {
        super();
        /** @type {Array<Array<VehiclePart>>} */
        this.vehiclePattern = [[u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u], [u, u, u, u, u, u, u]];
        /** @type {VehiclePart} */
        this.placingItem = undefined;
    }
    
    render(remote, wCtx, vCtx, renderRatio, cursor) {
        renderVehicleEditor(wCtx, this.vehiclePattern);
        // Barre d'inventaire
        if (remote.selfPlayer && remote.selfPlayer.inventory) {
            let inventory = Object.entries(remote.selfPlayer.inventory).map(e => ({ id: e[0], amount: e[1].amount }));
            for (let i = 0; i < inventory.length; i++) {
                let x = i % 9 * 40 - 20 * Math.min(9, inventory.length);
                let y = 80 - 40 * Math.floor(i / 9);
                vCtx.drawRect("#A0A0A0", x + 22, y + 2, 30, 30);
                vCtx.drawRect("#C0C0C0", x + 20, y, 30, 30);
                vCtx.drawImage(inventory[i].id, x + 20, y, 20, 20)
                vCtx.drawText(inventory[i].amount, x + 8, y + 6, 12, "white", 0, "black");
            }
        }
        // Objet en placement
        if (this.placingItem) {
            vCtx.drawImage(this.placingItem.id, cursor.viewportX, cursor.viewportY, 20, 20);
            if (this.placingItem.contained) vCtx.drawImage(this.placingItem.contained.id, cursor.viewportX, cursor.viewportY, 18, 18);
        }
        // Boutons start
        vCtx.drawImage("solo", 120, 0, 20, 20);
        vCtx.drawImage("duo", 120, -30, 20, 20);
        vCtx.drawImage("spectate", -120, -30, 20, 20);
    }

    onClick(remote, input, cursor) {
        if (input == "use") {
            // Bouton start
            if (Math.sqrt(Math.pow(120 - cursor.viewportX, 2) + Math.pow(cursor.viewportY, 2)) < 10) {
                remote.startSolo(reducePattern(this.vehiclePattern));
                return;
            }
            // Bouton duo
            if (Math.sqrt(Math.pow(cursor.viewportX - 120, 2) + Math.pow(cursor.viewportY + 30, 2)) < 10) {
                remote.startMatch(reducePattern(this.vehiclePattern));
                return;
            }
            // Bouton spectate
            if (Math.sqrt(Math.pow(cursor.viewportX + 120, 2) + Math.pow(cursor.viewportY + 30, 2)) < 10) {
                remote.spectate(parseInt(prompt("Quel est l'identifiant du joueur à regarder ?")));
                return;
            }
            // Barre d'inventaire
            let inventory = Object.entries(remote.selfPlayer.inventory).map(([id, item]) => ({ id, amount: item.amount }));
            let inventoryIndex = Math.floor(2.5 - cursor.viewportY / 40) * 9 + Math.floor((cursor.viewportX + 20 * Math.min(9, inventory.length)) / 40);
            if (inventory[inventoryIndex] && this.placingItem == undefined && inventory[inventoryIndex].amount > 0) {
                this.placingItem = VehiclePart.createById(inventory[inventoryIndex].id);
                remote.selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
                return;
            }
            // Édition du véhicule 
            let i = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= i && i < this.vehiclePattern.length) {
                let j = Math.floor((cursor.worldX + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= j && j < this.vehiclePattern[0].length && this.placingItem == undefined && this.vehiclePattern[i][j] != undefined) {
                    this.placingItem = this.vehiclePattern[i][j].contained || this.vehiclePattern[i][j];
                    if (this.vehiclePattern[i][j].contained) this.vehiclePattern[i][j].contained = undefined;
                    else this.vehiclePattern[i][j] = undefined;
                    return;
                }
            }
        }
        if (input == "special") {
            let i = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= i && i < this.vehiclePattern.length) {
                let j = Math.floor((cursor.worldX + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= j && j < this.vehiclePattern[0].length/* && this.placingItem==undefined*/) {
                    if (this.vehiclePattern[i][j] == undefined) return;
                    if (this.vehiclePattern[i][j].rotate4) {
                        this.vehiclePattern[i][j].rotation = ((this.vehiclePattern[i][j].rotation || 0) + 1) % 4;
                    }
                    if (this.vehiclePattern[i][j].rotate8) {
                        this.vehiclePattern[i][j].rotation = ((this.vehiclePattern[i][j].rotation || 0) + .5) % 4;
                    }
                    if (this.vehiclePattern[i][j].colors)
                        this.vehiclePattern[i][j].color = ((this.vehiclePattern[i][j].color || 0) + 1) % this.vehiclePattern[i][j].colors;
                    return;
                }
            }
        }
    }

    onUnclick(remote, input, cursor) {
        if (input == "use") {
            let i = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.length); // vehicle editor
            if (0 <= i && i < this.vehiclePattern.length) {
                let j = Math.floor((cursor.worldX + (.6 * this.vehiclePattern[0].length) - .6) / 1.2 + .5);
                if (0 <= j && j < this.vehiclePattern[0].length) {
                    if (this.vehiclePattern[i][j] != undefined && this.vehiclePattern[i][j].contain && this.placingItem != undefined && this.placingItem.containable) {
                        if (this.vehiclePattern[i][j].contained != undefined)
                            remote.selfPlayer.addToInventory(this.vehiclePattern[i][j].contained.id);
                        this.vehiclePattern[i][j].contained = this.placingItem;
                        this.placingItem = undefined;
                        return;
                    }
                    if (this.vehiclePattern[i][j] != undefined) {
                        remote.selfPlayer.addToInventory(this.vehiclePattern[i][j].id);
                        if (this.vehiclePattern[i][j].contained != undefined)
                            remote.selfPlayer.addToInventory(this.vehiclePattern[i][j].contained.id);
                    }
                    this.vehiclePattern[i][j] = this.placingItem;
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