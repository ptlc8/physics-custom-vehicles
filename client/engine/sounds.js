/**
 * @type {Object<string, HTMLAudioElement>}
 */
const audios = {};
globalThis.audios = audios;

/**
 * Récupère un son à partir de son nom
 * @param {string} name
 * @returns {HTMLAudioElement}
 */
export function getAudio(name) {
    const src = "sounds/" + name + ".mp3";
    if (audios[src])
        return audios[src];
    var audio = new Audio();
    audio.onerror = function () {
        console.error("[Engine] Can't load audio : " + src);
    }
    audio.onload = function () {
        console.info("[Engine] Audio loaded : " + src);
    }
    audio.src = src;
    audios[src] = audio;
    return audio;
}