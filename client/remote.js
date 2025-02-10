import WorldMap from "../common/map";
import Player from "../common/player";
import Game from "../common/game";
import Gamemodes from "../common/gamemodes";


const State = Object.assign({}, ...Object.entries(["BUILD", "WAIT", "PLAY", "SPECTATE"]).map(([i, s]) => ({ [s]: i })));

class Remote {

    /**
     * @param {string} url URL du websocket
     */
    constructor(url) {
        this.selfPlayer = undefined;
        this.state = State.BUILD;
        this.game = undefined;
        this.spectatedPlayerId = undefined;
        this.nextTagId = 0;
        this.listeners = { open: [], close: [], message: [], messageerror: [] };
        this.ws = new WebSocket(url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
    }

    /**
     * @param {string} event
     * @param {function(Remote, ...):void} listener
     */
    addEventListener(event, listener) {
        this.listeners[event].push(listener);
    }

    /**
     * @param {string} event
     * @param {function(Remote, ...):void} listener
     */
    removeEventListener(event, listener) {
        this.listeners[event].splice(this.listeners[event].indexOf(listener), 1);
    }

    /**
     * Quand la connexion est établie avec le serveur
     * @private
     * @param {Event} event Évent WebSocket
     */
    onOpen(event) {
        console.log("[ws] Connecté");
        this.send("setname", { name: "myself" });
        if (this.listeners.open)
            this.listeners.open(this);
    };

    /**
     * Quand le serveur envoie un message
     * @private
     * @param {Event} event Évent WebSocket
     */
    onMessage(event) {
        const args = JSON.parse(event.data);
        if (args.command) {
            if (this.listeners.message)
                this.listeners.message(this, args.command, args);
        } else if (args.error) {
            if (this.listeners.messageerror)
                this.listeners.messageerror(this, args.error, args);
        }
    }

    /**
     *
     * @private ? TODO
     * @param {string} command
     * @param {Object} args
     */
    onCommand(command, args) {
        console.group("[ws] Serveur : " + command);
        console.info(args);
        console.groupEnd();
        if (command == "logged") { // self, selfId
            // Lorsque le joueur est enregistré
            this.selfPlayer = Player.cast(args.self);
            this.selfPlayer.id = args.selfId;
        } else if (command == "start") { // map, vehiclesPatterns, opponents, gamemode
            // Lorsqu'une instance de jeu démarre
            let map = WorldMap.cast(args.map);
            this.game = new Game(map, Gamemodes.getByName(args.gamemode), args.vehiclesPatterns, args.opponents);
            engine.setCameraSize(20);
            this.state = State.PLAY;
            this.game.start();
        } else if (command == "spectate") { // map, vehiclesPatterns, opponents, events, tick
            // Lorsque l'on devient spectateur d'un jeu
            let map = WorldMap.cast(args.map);
            this.game = new Game(map, Gamemodes.getByName(args.gamemode), args.vehiclesPatterns, args.opponents);
            this.game.events = args.events;
            this.game.world.tick = args.tick;
            engine.setCameraSize(20);
            this.state = State.SPECTATE;
            this.game.start();
            this.game.regenerate();
        } else if (command == "gameevent") { // event
            // Lorqu'un évent se produit lors d'un match, ex : activate, disactivate
            this.game.insertEvent(args.event.index, args.event.tick, args.event)
        } else if (command == "wait") {
            this.state = State.WAIT;
        } else if (command == "leavequeue") {
            this.state = State.BUILD;
        } else {
            return console.error("[ws] Unknow command : " + command);
        }
        if (this.listeners[command])
            for (let listener of this.listeners[command])
                listener(this, args);
    }

    /**
     * Quand la connexion avec le serveur est coupée
     * @param {Event} event Évent WebSocket
     */
    onClose(event) {
        console.log("[ws] Déconnecté" + (event.reason ? " : " + event.reason : ""));
        if (this.listeners.close)
            this.listeners.close(this);
    }

    /**
     * Quand la connexion a une erreur
     * @private
     * @param {*} error // TODO
     * @param  {...any} args
     */
    onError(error, ...args) {
        console.group("[ws] Erreur : " + error);
        console.warn(args); // TODO: Check that
        console.groupEnd();
    }

    /**
     * Envoie une commande au serveur
     * @private
     * @param {string} command
     * @param {Object} args
     */
    send(command, args = {}) {
        args.command = command;
        this.ws.send(JSON.stringify(args));
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
}


export default Remote;
export { State };