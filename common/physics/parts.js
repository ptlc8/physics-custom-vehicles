
import VehiclePart from "./part.js";

import Balloon from "./parts/balloon.js";
import Box from "./parts/box.js";
import Firework from "./parts/firework.js";
import PlayerVehiclePart from "./parts/player.js";
import PopCorn from "./parts/pop.js";
import Propeller from "./parts/propeller.js";
import SmallWheel from "./parts/small-wheel.js";
import Waffle from "./parts/waffle.js";
import Weight from "./parts/weight.js";
import Wheel from "./parts/wheel.js";


// toaster
// parapluie
// ressort // marshmallow ?
// corde // reglisse ?
// axe de rotation (en mode pince)


export const allParts = {};

/**
 * Enregistre une pièce de véhicule
 * @param {string} id
 * @param {class<VehiclePart>} part
 */
export function registerPart(id, partClass) {
    allParts[id] = partClass;
    partClass.id = id;
}

/**
 * Retourne la classe de la pièce de véhicule par son identifiant
 * @param {string} id
 * @returns {class<VehiclePart>}
 */
export function getPartClassById(id) {
    return allParts[id];
}

/**
 * Crée une pièce de véhicule en prenant la classe correspondant à son identifiant
 * @param {string} id 
 * @param {...any} parameters 
 * @returns {VehiclePart}
 */
export function createPartById(id, ...parameters) {
    let partClass = getPartClassById(id);
    if (!partClass)
        throw new Error("Unknown part id " + id);
    return new partClass(...parameters);
}


registerPart("balloon", Balloon);
registerPart("box", Box);
registerPart("firework", Firework);
registerPart("player", PlayerVehiclePart);
registerPart("pop", PopCorn);
registerPart("propeller", Propeller);
registerPart("small-wheel", SmallWheel);
registerPart("waffle", Waffle);
registerPart("weight", Weight);
registerPart("wheel", Wheel);
