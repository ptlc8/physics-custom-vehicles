import WorldMap from "../common/map";
import Player from "../common/player";
import Game from "../common/game";
import Gamemodes from "../common/gamemodes";


const State = Object.assign({}, ...Object.entries(["BUILD", "WAIT", "PLAY", "SPECTATE"]).map(([i, s]) => ({ [s]: i })));

class Remote {

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

    addEventListener(event, listener) {
        this.listeners[event].push(listener);
    }

    removeEventListener(event, listener) {
        this.listeners[event].splice(this.listeners[event].indexOf(listener), 1);
    }

    onOpen(event) {
        console.log("[ws] Connecté");
        this.send("setname", { name: "myself" });
        if (this.listeners.open)
            this.listeners.open(this);
    };

    onMessage(event) {
        let args = JSON.parse(event.data);
        if (args.command) {
            if (this.listeners.message)
                this.listeners.message(this, args.command, args);
        } else if (args.error) {
            if (this.listeners.messageerror)
                this.listeners.messageerror(this, args.error, args);
        }
    }

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

    onClose(event) {
        console.log("[ws] Déconnecté");
        if (this.listeners.close)
            this.listeners.close(this);
    }

    onError(error, ...args) {
        console.group("[ws] Erreur : " + error);
        console.warn(args); // Check that
        console.groupEnd();
    }

    send(command, args = {}) {
        args.command = command;
        this.ws.send(JSON.stringify(args));
    }

    createTag() {
        return this.selfPlayer.id + "#" + (this.nextTagId++);
    }

    startSolo(vehiclePattern) {
        this.send("startsolo", { vehiclePattern });
    }

    startMatch(vehiclePattern) {
        this.send("startmatch", { vehiclePattern });
    }

    leaveQueue() {
        this.send("leavequeue");
    }

    activate(index) {
        let tag = this.createTag();
        this.send("activate", { index: index, tag: tag });
        this.game.activate(this.selfPlayer.id, index, tag, true);
    }

    disactivate(index) {
        let tag = this.createTag();
        this.send("disactivate", { index: index, tag: tag });
        this.game.disactivate(this.selfPlayer.id, index, tag, true);
    }

    spectate(playerId) {
        this.send("spectate", { playerId: playerId });
        this.spectatedPlayerId = playerId;
    }

    spectateNext() {
        if (this.spectatedPlayerId == this.game.opponents[this.game.opponents.length - 1])
            this.spectatedPlayerId = this.game.opponents[0];
        else
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.indexOf(this.spectatedPlayerId) + 1];
    }

    spectatePrevious() {
        if (this.spectatedPlayerId == this.game.opponents[0])
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.length - 1];
        else
            this.spectatedPlayerId = this.game.opponents[this.game.opponents.indexOf(this.spectatedPlayerId) - 1];
    }
}


export default Remote;
export { State };