import Scene from "../engine/scene.js";


export default class LoadScene extends Scene {
    
    render(remote, wCtx, vCtx, renderRatio, cursor) {
        let loadDots = new Array(3).fill(" ");
        loadDots[parseInt(Date.now() / 400) % loadDots.length] = ".";
        loadDots = loadDots.join("");
        vCtx.drawText("Connexion au serveur" + loadDots, 0, 20, 20, "white", 0, "black", "center");
    }

}
