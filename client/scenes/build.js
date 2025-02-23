import Scene from "../engine/scene.js";
import Button from "../engine/button.js";
import { renderVehicleEditor } from "../render.js";
import VehiclePattern from "../../common/physics/vehicle-pattern.js";
import VehiclePart from "../../common/physics/part.js";
import { createPartById } from "../../common/physics/parts.js";


class BuildScene extends Scene {

    constructor() {
        super();
        /** @type {VehiclePattern} */
        this.vehiclePattern = this.loadVehiclePattern();
        /** @type {VehiclePart?} */
        this.placingItem = null;
        this.soloButton = new Button("solo", 120, 0, 20);
        this.duoButton = new Button("duo", 120, -30, 20);
        this.spectateButton = new Button("spectate", -120, -30, 20);
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
        this.soloButton.draw(vCtx);
        this.duoButton.draw(vCtx);
        this.spectateButton.draw(vCtx);
    }

    onClick(remote, input, cursor) {
        if (input == "use") {
            // Bouton solo
            if (this.soloButton.isHover(cursor)) {
                remote.startSolo(this.vehiclePattern);
                this.saveVehiclePattern();
                return;
            }
            // Bouton duo
            if (this.duoButton.isHover(cursor)) {
                remote.startMatch(this.vehiclePattern);
                this.saveVehiclePattern();
                return;
            }
            // Bouton spectate
            if (this.spectateButton.isHover(cursor)) {
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

    saveVehiclePattern() {
        localStorage.setItem("pcv.vehiclePattern", JSON.stringify(this.vehiclePattern.serialize()));
    }

    loadVehiclePattern() {
        try {
            let pattern = localStorage.getItem("pcv.vehiclePattern");
            if (pattern)
                return VehiclePattern.cast(JSON.parse(pattern));
        } catch (e) {
            console.error(e);
        }
        return new VehiclePattern();
    }

}


export default BuildScene;