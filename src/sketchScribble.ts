import p5 = require("p5");

import { BoardScribbleElement, Path, Rect, Ellipse, Arrow, Line, TagLikedText } from "./elements";
import { modeScribbling, switchScribbleMode, boardToolbar } from "./crx_index";


const scribbleType_handwrite = 'handwrite';
const scribbleType_rect = 'rect';
const scribbleType_ellipse = 'ellipse';
const scribbleType_arrow = 'arrow';
const scribbleType_line = 'line';
const scribbleType_text = 'text';
const scribbleType_empty = 'empty';
// let st:
// scribbleType_handwrite|scribbleType_rect|scribbleType_ellipse|scribbleType_arrow|scribbleType_line|scribbleType_text;
type ScribbleType = 'handwrite' | 'rect' | 'ellipse' | 'arrow' | 'line' | 'text' | 'empty';
type StrokeType = "strokecolor" | "strokeweight"
type StrokeWeightPresetKey = 'subdock-strokeweight-light' | 'subdock-strokeweight-medium' | 'subdock-strokeweight-weight'
type StrokeColorPresetKey = 'subdock-palette-red' | 'subdock-palette-blue' | 'subdock-palette-yellow' | 'subdock-palette-orange' | 'subdock-palette-white' | 'subdock-palette-gray'
//画笔参数的预设
const strokecolorPreset = new Map([
    ['subdock-palette-red', '#db0c0c'],
    ['subdock-palette-blue', '#0c66db'],
    ['subdock-palette-yellow', '#dbc60c'],
    ['subdock-palette-orange', '#01d340'],
    ['subdock-palette-white', '#ffffff'],
    ['subdock-palette-gray', '#383838']
]
)
//画笔参数的预设
const strokeweightPreset = new Map([
    ['subdock-strokeweight-light', 2],
    ['subdock-strokeweight-medium', 4],
    ['subdock-strokeweight-weight', 6],
])
//scribble 类型所缓存的颜色、粗细值 
let scribblePenArgsMap = new Map<ScribbleType, Map<StrokeType, StrokeColorPresetKey | StrokeWeightPresetKey>>(); // <scribbletype,<'weight'/'color',value>>

let elementScribbling: BoardScribbleElement;
let scribblingAnchor;
export let mousePos: p5.Vector;
let canvas: p5.Element;
let currentScribbleType: ScribbleType = null;
let subdock: p5.Element;
let elementStack = new Array<BoardScribbleElement>();//TODO 理论上撤销的都是行为，应该是个存 action的 actionStack，不过所有的行为其实都是绘画，所有存”drawable“是目前看起来更好的方法
window.onresize = () => {

}

const sketchScribble = (pInst: p5) => {
    pInst.mouseReleased=sketch_mouseReleased;
    pInst.setup = function () {
        mousePos = pInst.createVector(pInst.width / 2, pInst.height / 2);
        canvas = pInst.createCanvas(1920, 1080);
        canvas.id('scribble-canvas');
        canvas.hide();
        let leetcodeMainContainer = document.querySelector("div[class^=main__]");
    
        canvas.parent(leetcodeMainContainer);
        // canvas.style('position', 'absolute');
        // canvas.style('display', 'block');
        // canvas.style('width', '100%')
        // canvas.style('height', '100%')

        canvas.mousePressed(sketch_mousePressed)

        pInst.frameRate(180)
        pInst.strokeWeight(1.2);
        pInst.stroke(0, 0, 255);
        pInst.angleMode(pInst.DEGREES);
        // system = new ChargeForceSystem();
        pInst.textAlign(pInst.CENTER, pInst.CENTER);

        // boardToolbar.mouseClicked((ev: MouseEvent) => )
    }

    pInst.draw = function () {
        // if (!modeScribbling) return;
        mousePos.set(pInst.mouseX, pInst.mouseY);

        pInst.clear();
        pInst.background('rgba(0,0, 0,0.1)');
  
        elementStack.forEach(drawable => {
            drawable.draw();
        });
    }
    pInst.keyPressed = function () {
        if (!modeScribbling) return;
        //优先由全局处理的逻辑
        switch (pInst.keyCode) {
            //esc
          case 27:
            switchScribbleMode();
            break;
          default:
            break;
        }
        //分发给元素去处理
    
    
    }
    

    function sketch_mousePressed(ev: MouseEvent) {
        console.log('scribble canvas pressed')
        if (!modeScribbling) return;
        //当前 scribbletpye 的画笔参数 :决定了创建的 element 的 weight 与 color 属性
        let args = scribblePenArgsMap.get(currentScribbleType);
        switch (currentScribbleType) {
            case scribbleType_handwrite:
                let path = new Path(exports, mousePos.copy(), strokecolorPreset.get(args.get('strokecolor')), strokeweightPreset.get(args.get('strokeweight')));
                path.onScribbling = true;
                elementScribbling = path
                elementStack.push(path);
                break;
            case scribbleType_rect:
                let rect = new Rect(exports, mousePos.copy(), 0, 0, strokecolorPreset.get(args.get('strokecolor')), strokeweightPreset.get(args.get('strokeweight')));
                rect.onScribbling = mousePos.copy()
                elementScribbling = rect
                elementStack.push(rect);
                break;
            case scribbleType_ellipse:
                let ellipse = new Ellipse(exports, mousePos.copy(), 0, 0, strokecolorPreset.get(args.get('strokecolor')), strokeweightPreset.get(args.get('strokeweight')));
                ellipse.onScribbling = mousePos.copy();
                elementScribbling = ellipse
                elementStack.push(ellipse);
                break;
            case scribbleType_arrow:
                let arrow = new Arrow(exports, mousePos.copy(), mousePos.copy(), strokecolorPreset.get(args.get('strokecolor')), strokeweightPreset.get(args.get('strokeweight')));
                arrow.onScribbling = true
                elementScribbling = arrow
                elementStack.push(arrow);
                break;
            case scribbleType_line:
                let line = new Line(exports, mousePos.copy(), mousePos.copy(), strokecolorPreset.get(args.get('strokecolor')), strokeweightPreset.get(args.get('strokeweight')));
                line.onScribbling = true;
                elementScribbling = line
                elementStack.push(line);
                break;
            case scribbleType_text:
                // new TagLikedText(mousePos.copy())
                break;
            default:
                break;
        }
        // arrowDragging = null;
        //         return false;
    }



    function sketch_mouseReleased() {
        if (!modeScribbling) return;
        if(elementScribbling)
            elementScribbling.onScribbling = false;
    }

}

export let scribble_pInst = new p5(sketchScribble);


export let onToolbarClicked=function(ev: MouseEvent){
    {
        if(!modeScribbling) return;
        let target = ev.target;
        if (!(target instanceof Element)) return;
        let scribbletype = target.getAttribute('data-scribbletype') as ScribbleType;

        //点选的 scribbletype 如果和目前一样 就无事发生
        if (scribbletype == currentScribbleType) return false;
        //如果该类型的颜色、粗细值未缓存过 则 new 一个 map
        if (!scribblePenArgsMap.get(scribbletype)) scribblePenArgsMap.set(scribbletype, new Map());

        let old = scribble_pInst.select(`#scribble-${currentScribbleType}`, 'div');
        // scribbledock.elt.querySelector(`svg[data-scribbletype=${scribbleType}]`);
        //todo 颜色管理
        if (old) {
            old.toggleClass('dark-primary-text-color');
            old.toggleClass('accent-text-color');
        }

        if (subdock) subdock.remove();
        let n: p5.Element = scribble_pInst.select(`#scribble-${scribbletype}`, 'div');;
        currentScribbleType = scribbletype;
        if (n) {
            n.toggleClass('dark-primary-text-color');
            n.toggleClass('accent-text-color');
        }
        //todo subdock 是p5ScribbleInst的创建的
        subdock = scribble_pInst.createElement('div');
        let temp=document.querySelector("div[class^=css-][class*=-HeaderCn]");
        temp.setAttribute('style','position:relative');
        subdock.parent(temp);
        // subdock.parent(document.querySelector("div[class^=css-][class*=-Container]"))
        subdock.id('scribble-subdock')

        switch (currentScribbleType) {
            case scribbleType_handwrite:
            case scribbleType_rect:
            case scribbleType_ellipse:
            case scribbleType_arrow:
            case scribbleType_line:
            case scribbleType_text:
                let palette = createPaletteDiv();
                let strokeweightArea = createstrokeweightDiv();
                subdock.child(strokeweightArea);
                subdock.child(palette);
                break;
            case scribbleType_empty:
                emptySketch()
            default:
                break;
        }
    }
}
    //每次选择一个 scribbletype 都是现场创建该 type 对应的 subdock
    function createstrokeweightDiv() {
        let strokeweightArea = scribble_pInst.createDiv();
        strokeweightArea.class('subdock-toolscontainer')
        let light = scribble_pInst.createDiv();
        // light.style('background', '#FFFFFF');
        light.class('subdock-stokesize-item');
        light.style('width', '8px');
        light.style('height', '8px');
        light.id('subdock-strokeweight-light');
        strokeweightArea.child(light);
        let medium = scribble_pInst.createDiv();
        // medium.style('background', '#FFFFFF');
        medium.class('subdock-stokesize-item');
        medium.style('width', '13px');
        medium.style('height', '13px');
        medium.id('subdock-strokeweight-medium');
        strokeweightArea.child(medium);
        let weight = scribble_pInst.createDiv();
        // weight.style('background', '#FFFFFF');
        weight.class('subdock-stokesize-item');
        weight.style('width', '18px');
        weight.style('height', '18px');
        weight.id('subdock-strokeweight-weight');
        strokeweightArea.child(weight);


        strokeweightArea.mouseClicked((ev: MouseEvent) => {
            //当前ScribbleType的之前的画笔（weight）参数
            let oldselected = scribble_pInst.select(`#${scribblePenArgsMap.get(currentScribbleType).get('strokeweight' as StrokeType)}`);
            let target = ev.target
            if (!(target instanceof Element)) return;
            switch (target.id) {
                case 'subdock-strokeweight-light':
                    if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    light.elt.classList.add('subdock-item-selected');
                    scribblePenArgsMap.get(currentScribbleType).set("strokeweight", target.id);
                    // p5Scribble.strokeWeight(1.5)
                    break
                case 'subdock-strokeweight-medium':
                    if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    medium.elt.classList.add('subdock-item-selected');
                    scribblePenArgsMap.get(currentScribbleType).set('strokeweight', target.id);
                    // p5Scribble.strokeWeight(3)
                    break
                case 'subdock-strokeweight-weight':
                    if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    weight.elt.classList.add('subdock-item-selected');
                    scribblePenArgsMap.get(currentScribbleType).set('strokeweight', target.id);
                    // p5Scribble.strokeWeight(4.5)
                    break;
                default:
                    break;
            }
        })

        let oldselected = scribble_pInst.select(`#${scribblePenArgsMap.get(currentScribbleType).get('strokeweight' as StrokeType)}`);
        if (!oldselected)
            medium.elt.click();
        else
            oldselected.elt.click();

        return strokeweightArea;
    }
    //每次选择一个 scribbletype 都是现场创建该 type 对应的 subdock
    function createPaletteDiv() {
        let palette = scribble_pInst.createDiv();
        palette.class('subdock-toolscontainer')
        let red = scribble_pInst.createDiv();
        red.id('subdock-palette-red')
        red.style('background', strokecolorPreset.get(red.id()));
        red.class('subdock-palette-item');
        palette.child(red);
        let blue = scribble_pInst.createDiv();
        blue.id('subdock-palette-blue')
        blue.class('subdock-palette-item');
        blue.style('background', strokecolorPreset.get(blue.id()))
        palette.child(blue);
        let yellow = scribble_pInst.createDiv();
        yellow.id('subdock-palette-yellow')
        yellow.class('subdock-palette-item');
        yellow.style('background', strokecolorPreset.get(yellow.id()))
        palette.child(yellow);
        let orange = scribble_pInst.createDiv();
        orange.id('subdock-palette-orange')
        orange.class('subdock-palette-item');
        orange.style('background', strokecolorPreset.get(orange.id()))
        palette.child(orange);
        let white = scribble_pInst.createDiv();
        white.id('subdock-palette-white')
        white.class('subdock-palette-item');
        white.style('background', strokecolorPreset.get(white.id()))
        palette.child(white);
        let gray = scribble_pInst.createDiv();
        gray.id('subdock-palette-gray')
        gray.class('subdock-palette-item');
        gray.style('background', strokecolorPreset.get(gray.id()))
        palette.child(gray);


        palette.mouseClicked((ev: MouseEvent) => {
            let oldSelected = scribble_pInst.select(`#${scribblePenArgsMap.get(currentScribbleType).get('strokecolor')}`);
            if (!(ev.target instanceof Element)) return;
            switch (ev.target.id) {
                case 'subdock-palette-red':
                case 'subdock-palette-blue':
                case 'subdock-palette-yellow':
                case 'subdock-palette-orange':
                case 'subdock-palette-white':
                case 'subdock-palette-gray':
                    let newSelected = scribble_pInst.select(`#${ev.target.id}`);
                    if (oldSelected)
                        oldSelected.toggleClass('subdock-item-selected')
                    newSelected.elt.classList.add('subdock-item-selected');
                    scribblePenArgsMap.get(currentScribbleType).set("strokecolor", ev.target.id);
                    break
                default:
                    break;
            }
        })
        let oldSelected = scribble_pInst.select(`#${scribblePenArgsMap.get(currentScribbleType).get('strokecolor')}`);
        //默认选中红色
        if (!oldSelected)
            red.elt.click()
        else
            oldSelected.elt.click();
        return palette;
    }

    function emptySketch() {
        while (elementStack.length > 0)
            elementStack.pop();
    }
    // let scribble = new Scribble(sketchScribble);
    // scribble.scribbleFillingCircle = function (x, y, r, gap, angle) {
    //     let vertexV = sketchScribble.createVector(r, 0);
    //     let base = sketchScribble.createVector(x, y);
    //     let xCors = [];
    //     let yCors = [];
    //     for (let a = 0; a < 360; a += 9) {
    //         let tempV = base.copy().add(vertexV.rotate(9));
    //         xCors.push(tempV.x);
    //         yCors.push(tempV.y);
    //     }
    //     this.scribbleFilling(xCors, yCors, gap, angle);
    // }

    // sketchScribble.drawArrow = function (base, vec, myColor) {
    //     sketchScribble.push();
    //     sketchScribble.translate(base.x, base.y);
    //     sketchScribble.line(0, 0, vec.x, vec.y);
    //     sketchScribble.rotate(vec.heading());
    //     let arrowSize = 7;
    //     sketchScribble.translate(vec.mag() - arrowSize, 0);
    //     sketchScribble.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    //     sketchScribble.pop();
    // }

