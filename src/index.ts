import p5 = require("p5");

import * as BoardData from "./sketchData"
import * as BoardScribble from "./sketchScribble"

let p5Helper = new p5(null);
export let modeScribbling = false;
let scribbleSwitch = p5Helper.select('#mode-switch');

scribbleSwitch.mouseClicked((ev) => {
    scribbleSwitch.toggleClass('dark-primary-text-color');
    scribbleSwitch.toggleClass('accent-text-color');
    modeScribbling = !modeScribbling;
    onSwitchScribbleMode();
})



let scribbledock = p5Helper.select('#scribbledock');
let mainSketch = p5Helper.select('#mainSketchHolder');
let scribbleSketch = p5Helper.select('#scribbleSketchHolder');


function onSwitchScribbleMode() {
    if (modeScribbling) {
        // BoardData.pInst.loop();
        BoardScribble.pInst.loop();
        scribbleSketch.style('visibility', 'visible');
        scribbledock.style('visibility', 'visible');
        BoardData.mainDock.style('visibility', 'hidden');
    } else {
        scribbleSketch.style('visibility', 'hidden');
        BoardScribble.pInst.noLoop();
        // BoardData.pInst.loop();
        scribbledock.style('visibility', 'hidden');
        BoardData.mainDock.style('visibility', 'visible');
    }
}
onSwitchScribbleMode();