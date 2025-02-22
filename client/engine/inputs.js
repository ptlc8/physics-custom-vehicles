/**
 * Entrée physique (MouseButton1, KeyE, Space, GamepadButton5 etc. ; ou +GamepadAxe1, -MouseMoveX etc. pour les axes)
 * @typedef {string} Key
 */

/**
 * Entrée virtuelle (jump, grab etc. ; ou +moveX, -moveX etc. pour les axes en 2 boutons)
 * @typedef {string} Input
 */

export default class InputsManager {

    /**
     * @param {Array<[Key, Input]>} mapping
     * @param {HTMLElement} htmlElement
     */
    constructor(mapping, htmlElement = document) {
        /** @type {Array<[Key, Input]>} */
        this.mapping = mapping;
        /** @type {number} */
        this.deadzone = 0.2;
        /** @type {Object<Input, number>} */
        this.values = {};
        /** @type {Object<Key, number>} */
        this.lastInputs = {};
        /** @type {Array<boolean>} */
        this.connectedGamepads = navigator.getGamepads ? navigator.getGamepads().map(g => !!g) : {};
        /** @type {(function(Key):void)?} */
        this.scanResolve = null;
        /** @type {number} */
        this.scanTime = 0;
        htmlElement.tabIndex = 0;
        // listen keyboard
        htmlElement.addEventListener("keydown", e => this.values[e.code] = 1);
        htmlElement.addEventListener("keyup", e => this.values[e.code] = 0);
        // listen mouse
        htmlElement.addEventListener("mousedown", e => this.values["MouseButton" + e.button] = 1);
        htmlElement.addEventListener("mouseup", e => this.values["MouseButton" + e.button] = 0);
        htmlElement.addEventListener("mousemove", (e) => {
            if (Math.abs(e.movementX) > Math.abs(e.movementY))
                this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveX"] += e.movementX / 50;
            this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveY"] += e.movementY / 50;
            if (Math.abs(e.movementX) <= Math.abs(e.movementY))
                this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveX"] += e.movementX / 50;
        });
        htmlElement.addEventListener("wheel", e => {
            this.values["MouseWheelX"] = e.deltaX / 100;
            this.values["MouseWheelY"] = e.deltaY / 100;
        });
        // listen touch
        htmlElement.addEventListener("touchstart", e => this.values["MouseButton" + e.changedTouches[0].identifier] = 1);
        htmlElement.addEventListener("touchend", e => this.values["MouseButton" + e.changedTouches[0].identifier] = 0);
        // TODO: touchmove
        // listen gamepads
        window.addEventListener("gamepadconnected", (e) => {
            this.connectedGamepads[e.gamepad.index] = true;
        });
        window.addEventListener("gamepaddisconnected", (e) => {
            this.connectedGamepads[e.gamepad.index] = false;
        });
    }

    /**
     * Retourne l'état des entrée virtuelles depuis le dernier appel de cette fonction
     * @returns {{ [input: Input]: { value: number, clicked: boolean, unclicked: boolean } }}
     */
    getInputs() {
        // gamepads
        if (navigator.getGamepads) {
            navigator.getGamepads().forEach((gamepad, gIndex) => {
                if (!gamepad) return;
                gamepad.buttons.forEach((button, bIndex) => {
                    this.values["Gamepad" + gIndex + "Button" + bIndex] = button.pressed ? 1 : 0;
                });
                gamepad.axes.forEach((axe, aIndex) => {
                    if (this.isInDeadzone(axe))
                        this.values["Gamepad" + gIndex + "Axe" + aIndex] = 0;
                    else
                        this.values["Gamepad" + gIndex + "Axe" + aIndex] = Math.round(axe*10) / 10;
                });
            });
        }
        // scan
        for (const [key, value] of Object.entries(this.values)) {
            if (value != 0 && this.scanResolve && Date.now() - this.scanTime > 100) {
                this.scanResolve(key);
                this.scanResolve = null;
            }
        }
        // initialize
        /** @type {{ [input: Input]: { value: number, clicked: boolean, unclicked: boolean } }} */
        var inputs = {};
        for (const [key, input] of this.mapping) {
            inputs[input] = { value: 0, clicked: false, unclicked: false };
            if (input.startsWith("+") || input.startsWith("-"))
                inputs[input.substring(1)] = { value: 0 };
        }
        // map keys to inputs
        for (let [key, input] of this.mapping) {
            if (key.startsWith("+"))
                inputs[input].value += Math.max(this.values[key.replace("+", "")] ?? 0, 0);
            else if (key.startsWith("-"))
                inputs[input].value -= Math.min(this.values[key.replace("-", "")] ?? 0, 0);
            else
                inputs[input].value += this.values[key] ?? 0;
        }
        // simulate axes
        for (const [name, input] of Object.entries(inputs)) {
            if (input.value == 0) continue;
            if (name.startsWith("+")) {
                inputs[name.slice(1)].value += input.value;
            } else if (name.startsWith("-")) {
                inputs[name.slice(1)].value -= input.value;
            }
        }
        // simulate clicks
        for (const [name, input] of Object.entries(inputs)) {
            if (this.isInDeadzone(input.value) == this.isInDeadzone(this.lastInputs[name]?.value))
                continue;
            if (this.isInDeadzone(input.value))
                input.unclicked = true;
            else
                input.clicked = true;
        }
        // return and reset mouse moves
        this.lastInputs = inputs;

        this.values["MouseMoveX"] = 0;
        this.values["MouseMoveY"] = 0;
        this.values["MouseGrabMoveX"] = 0;
        this.values["MouseGrabMoveY"] = 0;
        this.values["MouseWheelX"] = 0;
        this.values["MouseWheelY"] = 0;
        return inputs;
    }

    /**
     * Scanne la prochaine entrée phyisque (getInputs doit être appelée pour résoudre le scan)
     * @async
     * @returns {Promise<Input>} Une promesse qui est résolue une fois le scan terminé
     */
    scan() {
        this.scanTime = Date.now();
        return new Promise((resolve, reject) => {
            this.scanResolve = resolve;
        });
    }

    /**
     * Vérifie si le premier bouton de la souris est actuellement enfoncé
     * @returns {boolean}
     */
    isGrabbing() {
        return this.values["MouseButton0"] > 0;
    }

    /**
     * Vérifie si une valeur est dans la zone morte
     * @param {number} value 
     * @returns {number}
     */
    isInDeadzone(value) {
        return Math.abs(value) < this.deadzone;
    }

    /**
     * Vérifie si un gamepad est connecté à l'indice spécifié
     * @param {number} index
     * @returns {boolean}
     */
    hasGamepad(index) {
        return this.connectedGamepads[index];
    }

    /**
     * Modifie une association entre une entrée physique et une entrée virtuelle
     * @param {number} index indice de l'entrée dans le mapping
     * @param {string} key entrée physique
     * @param {string} input entrée virtuelle
     */
    setKey(index, key, input) {
        this.mapping[index] = [key, input];
    }

    /**
     * Fait vibrer les manettes de jeu ou le périphérique mobile si aucun gamepad n'est connecté
     * @param {number} [duration=200] durée de la vibration en millisecondes
     * @param {number} [strongMagnitude=1.0] intensité de la vibration forte (entre 0 et 1)
     * @param {number} [weakMagnitude=1.0] intensité de la vibration faible (entre 0 et 1)
     * @returns {boolean} `true` si la vibration a été activée, sinon `false`
     */
    static vibrate(duration=200, strongMagnitude=1.0, weakMagnitude=1.0) {
        let hasVibrated = false;
        if (navigator.getGamepads) {
            for (let gamepad of navigator.getGamepads()) {
                if (!gamepad) continue;
                if (gamepad.vibrationActuator)
                    gamepad.vibrationActuator.playEffect("dual-rumble", {duration,strongMagnitude,weakMagnitude});
                if (gamepad.hapticActuators && gamepad.hapticActuators[0])
                    gamepad.hapticActuators[0].pulse(strongMagnitude, duration);
                else continue;
                hasVibrated = true;
            }
        }
        if (!hasVibrated && navigator.vibrate) {
            navigator.vibrate(duration);
            hasVibrated = true;
        }
        return hasVibrated;
    }

    /**
     * Retourne le nom lisible d'un entrée physique
     * @param {Key} key
     * @returns {string}
     */
    static getKeyName(key) {
        let sign = "";
        if (key.startsWith("+") || key.startsWith("-")) {
            sign = key[0];
            key = key.slice(1);
        }
        if (key.startsWith("MouseButton"))
            return "Bouton souris " + key.slice(10);
        if (key.startsWith("Gamepad")) {
            if (key.substring(8).startsWith("Button"))
                return "Bouton " + key.slice(13) + " manette " + key.substring(7, 1);
            if (key.substring(8).startsWith("Axe"))
                return "Axe " + key.slice(10) + sign + " manette " + key.substring(7, 1);
        }
        if (key.startsWith("MouseGrabMove"))
            return "Déplacement souris maintenue " + key.slice(13) + sign;
        if (key.startsWith("MouseMove"))
            return "Déplacement souris " + key.slice(9) + sign;
        if (key.startsWith("Key"))
            return key.slice(3);
        if (key.startsWith("Numpad"))
            return "Pavé numérique " + key.slice(6);
        return key;
    }
}

/**
 * Retourne le signe
 * @param {number} x
 * @returns {number} 1 si positif, -1 si négatif, ou 0 si nul
 */
function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}