import Scene from "../engine/scene.js";
import { renderVehicleEditor } from "../render.js";
import VehiclePattern from "../../common/physics/vehicle-pattern.js";
import VehiclePart from "../../common/physics/part.js";
import { createPartById } from "../../common/physics/parts.js";


class BuildScene extends Scene {

    constructor() {
        super();
        /** @type {VehiclePattern} */
        this.vehiclePattern = new VehiclePattern();
        /** @type {VehiclePart?} */
        this.placingItem = null;
    }

    render(remote, wCtx, vCtx, renderRatio, cursor) {
        renderVehicleEditor(wCtx, this.vehiclePattern);
        // Barre d'inventaire
        if (remote.selfPlayer && remote.selfPlayer.inventory) {
            let inventory = Object.entries(remote.selfPlayer.inventory).map(([id, item]) => ({ id, amount: item.amount }));
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
                remote.startSolo(this.vehiclePattern);
                return;
            }
            // Bouton duo
            if (Math.sqrt(Math.pow(cursor.viewportX - 120, 2) + Math.pow(cursor.viewportY + 30, 2)) < 10) {
                remote.startMatch(this.vehiclePattern);
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
            if (inventory[inventoryIndex] && !this.placingItem && inventory[inventoryIndex].amount > 0) {
                this.placingItem = createPartById(inventory[inventoryIndex].id);
                remote.selfPlayer.removeFromInventory(inventory[inventoryIndex].id);
                return;
            }
            // Édition du véhicule
            let y = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.getHeight());
            let x = Math.floor((cursor.worldX + (.6 * this.vehiclePattern.getWidth()) - .6) / 1.2 + .5);
            if (!this.placingItem) {
                this.placingItem = this.vehiclePattern.delete(x, y);
                return;
            }
        }
        if (input == "special") {
            // Édition du véhicule
            let y = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.getHeight());
            let x = Math.floor((cursor.worldX + (.6 * this.vehiclePattern.getWidth()) - .6) / 1.2 + .5);
            this.vehiclePattern.rotate(x, y);
            return;
        }
    }

    onUnclick(remote, input, cursor) {
        if (input == "use") {
            let y = Math.floor(cursor.worldY / 1.2 + this.vehiclePattern.getHeight()); // vehicle editor
            let x = Math.floor((cursor.worldX + (.6 * this.vehiclePattern.getWidth()) - .6) / 1.2 + .5);
            let previousItem = this.vehiclePattern.set(x, y, this.placingItem);
            this.placingItem = null;
            if (previousItem) {
                remote.selfPlayer.addToInventory(previousItem.id, 1);
                if (previousItem.contained)
                    remote.selfPlayer.addToInventory(previousItem.contained.id, 1);
            }
        }
    }
}


export default BuildScene;