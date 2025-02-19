import WorldMap from "../common/map";
import Player from "../common/player";
import Game from "../common/game";
import Gamemodes from "../common/gamemodes";


/** @type {Object<string, number>} */
const State = Object.assign({}, ...["BUILD", "WAIT", "PLAY", "SPECTATE"].map((s, i) => ({ [s]: i })));

class Remote {

    /**
     * @param {string} url URL du websocket
     */
    constructor(url) {
        /** @type {number} */
        this.selfPlayer = undefined;
        this.state = State.BUILD;
        this.game = undefined;
        /** @type {number} */
        this.spectatedPlayerId = undefined;
        this.nextTagId = 0;
        /** @type {Object<string, Array<function(Remote, Object...):void>>} */
        this.listeners = {};
        this.ws = new WebSocket(url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
    }

    /**
     * @param {string} event
     * @param {function(Remote, Object...):void} listener
     */
    addEventListener(event, listener) {
        this.listeners[event].push(listener);
    }

    /**
     * @param {"open"|"close"|"error"|"command"} event
     * @param {function(Remote, Object...):void} listener
     */
    removeEventListener(event, listener) {
        this.listeners[event].splice(this.listeners[event].indexOf(listener), 1);
    }

    /**
     * @param {string} event
     * @param {...Object} data 
     */
    dispathEvent(event, ...data) {
        if (this.listeners[event])
            for (let listener of this.listeners[event])
                listener(this, ...data);
    }

    /**
     * Quand la connexion est établie avec le serveur
     * @private
     * @param {Event} event Évent WebSocket
     */
    onOpen(event) {
        console.log("[ws] Connecté");
        this.send("setname", { name: "myself" });
        this.dispathEvent("open");
    };

    /**
     * Quand la connexion avec le serveur est coupée
     * @param {Event} event Évent WebSocket
     */
    onClose(event) {
        console.log("[ws] Déconnecté" + (event.reason ? " : " + event.reason : "") + " (" + event.code + ")");
        this.dispathEvent("close", event.reason, event.code);
    }

    /**
     * Quand le serveur envoie un message
     * @private
     * @param {Event} event Évent WebSocket
     */
    onMessage(event) {
        const data = JSON.parse(event.data);
        if (data.error)
            this.onError(data.error, data);
        else if (data.command)
            this.onCommand(data.command, data);
        else
            console.warn("[ws] Message inconnu", data);
    }

    /**
     * Quand le serveur envoie une commande
     * @private
     * @param {string} command
     * @param {Object} data
     */
    onCommand(command, data) {
        console.groupCollapsed("[ws] Serveur : " + command);
        console.info(data);
        console.groupEnd();
        if (command == "logged") { // self, selfId
            // Lorsque le joueur est enregistré
            this.selfPlayer = Player.cast(data.self);
            this.selfPlayer.id = data.selfId;
        } else if (command == "start") { // map, vehiclesPatterns, opponents, gamemode
            // Lorsqu'une instance de jeu démarre
            let map = WorldMap.cast(data.map);
            this.game = new Game(map, Gamemodes.getByName(data.gamemode), data.vehiclesPatterns, data.opponents);
            this.state = State.PLAY;
            this.game.start();
        } else if (command == "spectate") { // map, vehiclesPatterns, opponents, events, tick
            // Lorsque l'on devient spectateur d'un jeu
            let map = WorldMap.cast(data.map);
            this.game = new Game(map, Gamemodes.getByName(data.gamemode), data.vehiclesPatterns, data.opponents);
            this.game.events = data.events;
            this.game.world.tick = data.tick;
            this.state = State.SPECTATE;
            this.game.start();
            this.game.regenerate();
        } else if (command == "gameevent") { // event
            // Lorqu'un évent se produit lors d'un match, ex : activate, disactivate
            this.game.insertEvent(data.event.index, data.event.tick, data.event)
        } else if (command == "wait") {
            this.state = State.WAIT;
            this.selfPlayer.vehiclePattern = data.vehiclePattern;
        } else if (command == "build") {
            this.state = State.BUILD;
            this.game.stop();
            this.game = undefined;
        } else if (command == "addspectator") {
            this.game.addSpectator(data.spectatorId);
        } else if (command == "removespectator") {
            this.game.removeSpectator(data.spectatorId);
        } else {
            return console.error("[ws] Unknow command : " + command);
        }
        this.dispathEvent("command", command, data);
    }

    /**
     * Quand le serveur envoie une erreur
     * @private
     * @param {string} error
     * @param  {Object} data
     */
    onError(error, data) {
        console.groupCollapsed("[ws] Erreur : " + error);
        console.warn(data);
        console.groupEnd();
        this.dispathEvent("error", error, data);
    }

    /**
     * Envoie une commande au serveur
     * @private
     * @param {string} command
     * @param {Object} data
     */
    send(command, data = {}) {
        data.command = command;
        this.ws.send(JSON.stringify(data));
    }

    /**
     * Crée un nouvel id unique pour une interaction du joueur
     * @returns {string}
     */
    createTag() {
        return this.selfPlayer.id + "#" + (this.nextTagId++);
    }

    /**
     * Lance une partie en mode solo
     * @param {Array<Array<Object>>} vehiclePattern 
     */
    startSolo(vehiclePattern) {
        this.send("startsolo", { vehiclePattern });
    }

    /**
     * Démarre une recherche d'adversaire
     * @param {Array<Array<Object>>} vehiclePattern 
     */
    startMatch(vehiclePattern) {
        this.send("startmatch", { vehiclePattern });
    }

    /**
     * Arrête la recherche d'adversaire
     */
    leaveQueue() {
        this.send("leavequeue");
    }

    /**
     * Active une pièce du véhicule
     * @param {number} index Indice de la pièce
     */
    activate(index) {
        const tag = this.createTag();
        this.send("activate", { index, tag });
        this.game.activate(this.selfPlayer.id, index, tag, true);
    }

    /**
     * Désactive une pièce du véhicule
     * @param {number} index Indice de la pièce
     */
    disactivate(index) {
        const tag = this.createTag();
        this.send("disactivate", { index, tag });
        this.game.disactivate(this.selfPlayer.id, index, tag, true);
    }

    /**
     * Regarde un autre joueur jouer
     * @param {number} playerId Identifiant du joueur
     */
    spectate(playerId) {
        this.send("spectate", { playerId });
        this.spectatedPlayerId = playerId;
    }

    /**
     * Déplace la caméra sur l'adversaire suivant
     */
    spectateNext() {
        if (this.spectatedPlayerId == this.game.opponents[this.game.opponents.length - 1])
            this.spectatedPlayerId = this.game.opponents[0];
        else
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.indexOf(this.spectatedPlayerId) + 1];
    }

    /**
     * Déplace la caméra sur l'adversaire précédent
     */
    spectatePrevious() {
        if (this.spectatedPlayerId == this.game.opponents[0])
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.length - 1];
        else
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.indexOf(this.spectatedPlayerId) - 1];
    }

    /**
     * Quitte une partie (SPECTATE ou PLAY)
     */
    leaveGame() {
        this.send("leavegame");
    }
}


export default Remote;
export { State };