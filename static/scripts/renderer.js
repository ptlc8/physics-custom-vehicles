"use strict";

class Renderer {

    constructor(remote) {
        this.remote = remote;
    }

    /**
     * Affiche le jeu
     * @param {WorldContext} wctx 
     * @param {RenderContext} rctx 
     * @param {number} rendererRatio 
     */
    render(wctx, rctx, rendererRatio) {
        wctx.clear();
        wctx.setZ(-2);
        wctx.drawRectInfiniteX("#6ab9e2", -2176, 242);
        wctx.drawImageInfiniteX(getImage("sky"), 0, -128, 128, 72);
        wctx.drawRectInfiniteX("#b4d5f4", -56, 2048);
        wctx.setZ(0);
        // Affichage du sol
        if (this.remote.game && this.remote.game.map)
            this.renderMap(wctx);
        if ((this.remote.state == State.PLAY || this.remote.state == State.SPECTATE) && this.remote.game!==undefined)
            this.renderInGame(wctx, rctx, rendererRatio);
        if (this.remote.state == State.BUILD || this.remote.state == State.WAIT)
            this.renderVehicleEditor(wctx, rctx, rendererRatio);
        if (this.remote.state == State.BUILD)
            this.renderVehicleBuilder(wctx, rctx, rendererRatio);
        if (this.remote.state == State.WAIT)
            this.renderWait(rctx, rendererRatio);
    }

    /**
     * Affiche la carte
     * @param {WorldContext} wctx
    */
    renderMap(wctx) {
        wctx.drawLines("green", this.remote.game.map.groundVertices.map(e=>e[0]), this.remote.game.map.groundVertices.map(e=>e[1]), .1);
    }

    /**
     * Affiche le jeu en cours
     * @param {WorldContext} wctx 
     * @param {RenderContext} rctx 
     * @param {number} rendererRatio 
     */
    renderInGame(wctx, rctx, rendererRatio) {
        // Centrage de la caméra sur le véhicule du joueur
        let playerIdToFollow = this.remote.state==State.PLAY ? selfPlayer.id : this.remote.state==State.SPECTATE ? spectatedPlayerId : undefined;
        let opponentIndexToFollow = this.remote.game.getPlayerIndex(playerIdToFollow);
        if (this.remote.game.world.vehicles[opponentIndexToFollow] !== undefined) {
            let toFollow = this.remote.game.world.vehicles[opponentIndexToFollow].pos;
            engine.setCameraPos(toFollow?toFollow.get_x():0, toFollow?toFollow.get_y():0);
        }
        // Affichage des arrivées
        for (let finish of this.remote.game.map.finishes) {
            wctx.drawImage(getImage("finish"), spawn[0]-1, spawn[1]-2, 2, 4);
        }
        for (const [index,vehicle] of Object.entries(this.remote.game.world.vehicles)) {
            // Véhicules
            for (let line of vehicle.parts) for (let part of line) {
                if (part == undefined) continue;
                wctx.drawImage(getImage(part.id+(part.color!=undefined?part.color:"")), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), 1, 1, part.body.GetAngle());
                if (part.contained)
                    wctx.drawImage(getImage(part.contained.id), part.body.GetPosition().get_x(), part.body.GetPosition().get_y(), .9, .9, part.body.GetAngle());
                if (part.id == "player" || (part.contained && part.contained.id == "player"))
                    wctx.drawText("Joueur "+this.remote.game.opponents[index], part.body.GetPosition().get_x(), part.body.GetPosition().get_y()-1, .5, "white", 0, "black", "center");
            }
            if (index==opponentIndexToFollow) {
                // Affichage des contrôles du véhicule du joueur
                for (let i = 0; i < vehicle.controls.length; i++) {
                    rctx.drawRect("#A0A0A0", i*40-(20*vehicle.controls.length)+20+2, 80+2, 30, 30);
                    rctx.drawRect("#C0C0C0", i*40-(20*vehicle.controls.length)+20, 80, 30, 30);
                    rctx.drawImage(getImage(vehicle.controls[i].id+vehicle.controls[i].color), i*40-(20*vehicle.controls.length)+20, 80, 20, 20, vehicle.controls[i].rotation*Math.PI/2);
                    rctx.drawText(vehicle.controls[i].parts[0].activated?"ON":"OFF", i*40-(20*vehicle.controls.length)+8, 86, 12, "white", 0, "black");
                    if (i<ControlKeys.length) rctx.drawText(ControlKeys[i].display, i*40-(20*vehicle.controls.length)+34, 70, 12, "white", 0, "black", "right");
                }
            }
        }
    }

    /**
     * Affiche l'éditeur de véhicule
     * @param {WorldContext} wctx
     * @param {RenderContext} rctx
     * @param {number} rendererRatio
     */
    renderVehicleEditor(wctx, rctx, rendererRatio) {
        for (let i = 0; i < vehiclePattern.length; i++)
            for (let j = 0; j < vehiclePattern[i].length; j++) {
                wctx.drawRect("#D0D0D0", j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1);
                if (vehiclePattern[i][j]) {
                    let angle = 0;
                    if (vehiclePattern[i][j].rotation) angle = (vehiclePattern[i][j].rotation||0)*Math.PI/2;
                    else if (vehiclePattern[i][j].rotate4attachable) angle = (vehiclePattern[i][j].rotationattachable||0)*Math.PI/2;
                    wctx.drawImage(getImage(vehiclePattern[i][j].id+(vehiclePattern[i][j].color??"")), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1, angle);
                    if (vehiclePattern[i][j].contained!=undefined)
                        wctx.drawImage(getImage(vehiclePattern[i][j].contained.id+(vehiclePattern[i][j].contained.color ?? "")), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, .9, .9, angle);
                    if (vehiclePattern[i][j].rotate4attachable) {
                        wctx.drawImage(getImage("rotation-arrow"), j*1.2-(.6*vehiclePattern[i].length)+.6, (i-vehiclePattern.length+1)*1.2-.6, 1, 1, ((vehiclePattern[i][j].rotationattachable||0)-1)*Math.PI/2);
                    }
                }
            }
    }

    /**
     * Affiche la contruction de véhicule
     * @param {WorldContext} wctx
     * @param {RenderContext} rctx
     * @param {number} rendererRatio
     */
    renderVehicleBuilder(wctx, rctx, rendererRatio) {
        // Barre d'inventaire
        if (selfPlayer && selfPlayer.inventory) {
            let inventory = Object.entries(selfPlayer.inventory).map(e=>({id:e[0],amount:e[1].amount}));
            for (let i = 0; i < inventory.length; i++) {
                let x = i%9*40-20*Math.min(9, inventory.length);
                let y = 80-40*Math.floor(i/9);
                rctx.drawRect("#A0A0A0", x+22, y+2, 30, 30);
                rctx.drawRect("#C0C0C0", x+20, y, 30, 30);
                rctx.drawImage(getImage(inventory[i].id), x+20, y, 20, 20)
                rctx.drawText(inventory[i].amount, x+8, y+6, 12, "white", 0, "black");
            }
        }
        // Objet en placement
        if (placingItem) {
            rctx.drawImage(getImage(placingItem.id), mousePos.rx, mousePos.ry, 20, 20);
            if (placingItem.contained) rctx.drawImage(getImage(placingItem.contained.id), mousePos.rx, mousePos.ry, 18, 18);
        }
        // Boutons start
        rctx.drawImage(getImage("solo"), 120, 0, 20, 20);
        rctx.drawImage(getImage("duo"), 120, -30, 20, 20);
        rctx.drawImage(getImage("spectate"), -120, -30, 20, 20);
    }

    /**
     * Affiche l'attente de match
     * @param {RenderContext} rctx
     * @param {number} rendererRatio
     */
    renderWait(rctx, rendererRatio) {
        rctx.drawImage(getImage("quit"), 120, 0, 20, 20);
        let loadDot = "   ";
        loadDot[parseInt(Date.now()/1000)%3] = ".";
        rctx.drawText("Recherche d'adversaires en cours"+loadDot, 0, 60, 20, "white", 0, "black", "center");
    }

}