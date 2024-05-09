/**
 * Crée une image à partir de d'un URL
 * @param {string} src URL
 * @returns {HTMLImageElement}
 */
function createImage(src) {
    var img = new Image();
    img.src = src;
    return img;
}

/**
 * @type {Object<string, HTMLImageElement>}
 */
const images = {
    no: createImage("assets/no.png"),
    loading: createImage("assets/loading.png")
};

/**
 * Récupère une image à partir de son nom
 * @param {string} name
 * @returns {HTMLImageElement}
 */
export function getImage(name, ignoreLoading = false) {
    const src = "assets/" + name + ".png";
    if (images[src]) return images[src].complete || ignoreLoading ? images[src] : images.loading;
    //console.log("[Engine] Loading Image : " + src);
    var img = new Image();
    img.onerror = function () {
        images[src] = images.no;
        console.error("[Engine] Can't load image : " + src);
    }
    img.onload = function () {
        console.info("[Engine] Image loaded : " + src);
    }
    img.src = src;
    images[src] = img;
    return ignoreLoading ? img : images.loading;
}