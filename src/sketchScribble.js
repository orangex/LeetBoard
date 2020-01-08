
const scribbleType_handwrite = 'handwrite';
const scribbleType_rect = 'rect';
const scribbleType_ellipse = 'ellipse';
const scribbleType_arrow = 'arrow';
const scribbleType_line = 'line';
const scribbleType_text = 'text';

const strokecolorMap = new Map([
    ['subdock-palette-red', '#db0c0c'],
    ['subdock-palette-blue', '#0c66db'],
    ['subdock-palette-yellow', '#dbc60c'],
    ['subdock-palette-orange', '#01d340'],
    ['subdock-palette-white', '#ffffff'],
    ['subdock-palette-gray', '#383838']
]
)
const strokeweightMap = new Map([
    ['subdock-strokeweight-light', 2],
    ['subdock-strokeweight-medium', 4],
    ['subdock-strokeweight-weight', 6],
])
const sketchScribble = (pInst) => {
    let system;
    let elements = [];//涂画层的 Element :矩形、椭圆、直线、箭头、点线
    let elementGroups = [];
    let links = [];//link 的两端可以是 Node，也可以是坐标。

    let lastLinkID = 0;
    let lastTitle = -1;
    let linkConnecting;
    let elementDragging;//node
    let mouseToElementAnchor; //开始拖动 Node 时，指针与 Node 中心的偏移量，此后拖动时 Node 就在指针的位置上加上该偏移量就行。

    let elementEditing;//node and link 
    let elementHovered;//node and link
    let elementSelected;

    let firstclick = false;
    let secondclick = false;
    let editingInput;

    let inEditingStartedAnimation = false;

    let scribblePenArgsMap = new Map(); // <scribbletype,<'weight'/'color',value>>

    let elementScribbling;
    let scribblingAnchor;
    let mousePos;
    let canvas;
    let scribbleType = null;
    let subdock;
    let drawableStack = [];//TODO 理论上撤销的都是行为，应该是个存 action的 actionStack，不过所有的行为其实都是绘画，所有存”drawable“是目前看起来更好的方法。
    pInst.setup = function () {
        mousePos = pInst.createVector(pInst.width / 2, pInst.height / 2);
        canvas = pInst.createCanvas(1000, 1000);
        canvas.style('position', 'absolute');
        pInst.frameRate(180)
        pInst.strokeWeight(1.2);
        pInst.stroke(0, 0, 255);
        pInst.angleMode(pInst.DEGREES);
        // system = new ChargeForceSystem();
        pInst.textAlign(pInst.CENTER, pInst.CENTER);
        let scribbledock = pInst.select('#scribbledock');
        let scribbleHandwrite = pInst.select('#scribble-handwrite');



        scribbledock.mouseClicked((ev) => {
            let target = ev.target;
            let type = target.getAttribute('data-scribbletype');
            if (type == scribbleType) return false;
            if (!scribblePenArgsMap.get(type)) scribblePenArgsMap.set(type, new Map());
            let old = pInst.select(`#scribble-${scribbleType}`, 'div');
            // scribbledock.elt.querySelector(`svg[data-scribbletype=${scribbleType}]`);
            if (old) {
                old.toggleClass('dark-primary-text-color');
                old.toggleClass('accent-text-color');
            }
            if (subdock) subdock.remove();
            let n;
            scribbleType = type;

            n = pInst.select(`#scribble-${type}`, 'div');
            if (n) {
                n.toggleClass('dark-primary-text-color');
                n.toggleClass('accent-text-color');
            }
            subdock = p5Scribble.createDiv();

            subdock.toggleClass('dark-primary-color');
            subdock.toggleClass('subdock');
            switch (scribbleType) {
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
                default:
                    break;
            }
        })
    }

    function createstrokeweightDiv() {
        let strokeweightArea = p5Scribble.createDiv();
        strokeweightArea.class('subdock-toolscontainer')
        let light = p5Scribble.createDiv();
        // light.style('background', '#FFFFFF');
        light.class('subdock-stokesize-item');
        light.style('width', '8px');
        light.style('height', '8px');
        light.id('subdock-strokeweight-light');
        strokeweightArea.child(light);
        let medium = p5Scribble.createDiv();
        // medium.style('background', '#FFFFFF');
        medium.class('subdock-stokesize-item');
        medium.style('width', '13px');
        medium.style('height', '13px');
        medium.id('subdock-strokeweight-medium');
        strokeweightArea.child(medium);
        let weight = p5Scribble.createDiv();
        // weight.style('background', '#FFFFFF');
        weight.class('subdock-stokesize-item');
        weight.style('width', '18px');
        weight.style('height', '18px');
        weight.id('subdock-strokeweight-weight');
        strokeweightArea.child(weight);

        let oldselected = p5Scribble.select(`#${scribblePenArgsMap.get(scribbleType).get('strokeweight')}`);
        strokeweightArea.mouseClicked((ev) => {
            oldselected = p5Scribble.select(`#${scribblePenArgsMap.get(scribbleType).get('strokeweight')}`);
            switch (ev.target.id) {
                case 'subdock-strokeweight-light':
                if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    light.elt.classList.add('subdock-item-selected');
                    
                    scribblePenArgsMap.get(scribbleType).set("strokeweight", ev.target.id);
                    // p5Scribble.strokeWeight(1.5)
                    break
                case 'subdock-strokeweight-medium':
                if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    
                        
                        medium.elt.classList.add('subdock-item-selected');
                    
                    scribblePenArgsMap.get(scribbleType).set('strokeweight', ev.target.id);
                    // p5Scribble.strokeWeight(3)
                    break
                case 'subdock-strokeweight-weight':
                if (oldselected) oldselected.toggleClass('subdock-item-selected')
                    
                        weight.elt.classList.add('subdock-item-selected');
                    
                    scribblePenArgsMap.get(scribbleType).set('strokeweight', ev.target.id);
                    // p5Scribble.strokeWeight(4.5)
                    break;
                default:
                    break;
            }
        })
        if (!oldselected)
            medium.elt.click();
        else
            oldselected.elt.click();

        return strokeweightArea;
    }
    function createPaletteDiv() {
        let palette = p5Scribble.createDiv();
        palette.class('subdock-toolscontainer')
        let red = p5Scribble.createDiv();
        red.id('subdock-palette-red')
        red.style('background', strokecolorMap.get(red.id()));
        red.class('subdock-palette-item');
        palette.child(red);
        let blue = p5Scribble.createDiv();
        blue.id('subdock-palette-blue')
        blue.class('subdock-palette-item');
        blue.style('background', strokecolorMap.get(blue.id()))
        palette.child(blue);
        let yellow = p5Scribble.createDiv();
        yellow.id('subdock-palette-yellow')
        yellow.class('subdock-palette-item');
        yellow.style('background', strokecolorMap.get(yellow.id()))
        palette.child(yellow);
        let orange = p5Scribble.createDiv();
        orange.id('subdock-palette-orange')
        orange.class('subdock-palette-item');
        orange.style('background', strokecolorMap.get(orange.id()))
        palette.child(orange);
        let white = p5Scribble.createDiv();
        white.id('subdock-palette-white')
        white.class('subdock-palette-item');
        white.style('background', strokecolorMap.get(white.id()))
        palette.child(white);
        let gray = p5Scribble.createDiv();
        gray.id('subdock-palette-gray')
        gray.class('subdock-palette-item');
        gray.style('background', strokecolorMap.get(gray.id()))
        palette.child(gray);
        let oldSelected = p5Scribble.select(`#${scribblePenArgsMap.get(scribbleType).get('strokecolor')}`);
        palette.mouseClicked((ev) => {
            oldSelected = p5Scribble.select(`#${scribblePenArgsMap.get(scribbleType).get('strokecolor')}`);
            switch (ev.target.id) {
                case 'subdock-palette-red':
                case 'subdock-palette-blue':
                case 'subdock-palette-yellow':
                case 'subdock-palette-orange':
                case 'subdock-palette-white':
                case 'subdock-palette-gray':
           
                    let newSelected = p5Scribble.select(`#${ev.target.id}`);
                    if (oldSelected) 
                        oldSelected.toggleClass('subdock-item-selected')
                        newSelected.elt.classList.add('subdock-item-selected');
               
                    scribblePenArgsMap.get(scribbleType).set("strokecolor", ev.target.id);
                    break
                default:
                    break;
            }
        })
        if (!oldSelected)
            red.elt.click()
        else
            oldSelected.elt.click();
        return palette;
    }
    pInst.draw = function () {
        if (!scribbling) return;
        mousePos.set(pInst.mouseX, pInst.mouseY);
        // if(scribbleType!=='handwrite'){
            pInst.clear();
            pInst.background('rgba(0,0,0, 0.1)');
        // }
        if (elementScribbling) elementScribbling.onScribbling(scribblingAnchor, mousePos.copy());

        drawableStack.forEach(drawable => {
            drawable.draw(pInst);
        });
    }

    function sketch_mousePressed(ev) {
        if (!scribbling) return;
        let args = scribblePenArgsMap.get(scribbleType);
        switch (scribbleType) {
            case scribbleType_handwrite:
                elementScribbling = new Path(mousePos.copy(), strokecolorMap.get(args.get('strokecolor')), strokeweightMap.get(args.get('strokeweight')));
                scribblingAnchor = mousePos.copy();
                drawableStack.push(elementScribbling);
                break;
            case scribbleType_rect:
                elementScribbling = new Rect(mousePos.copy(), 0, 0, strokecolorMap.get(args.get('strokecolor')), strokeweightMap.get(args.get('strokeweight')));
                scribblingAnchor = mousePos.copy();
                drawableStack.push(elementScribbling);
                break;
            case scribbleType_ellipse:
                elementScribbling = new Ellipse(mousePos.copy(), 0, 0, strokecolorMap.get(args.get('strokecolor')), strokeweightMap.get(args.get('strokeweight')));
                scribblingAnchor = mousePos.copy();
                drawableStack.push(elementScribbling);
                break;
            case scribbleType_arrow:
                elementScribbling = new Arrow(mousePos.copy(), mousePos.copy(), strokecolorMap.get(args.get('strokecolor')), strokeweightMap.get(args.get('strokeweight')));
                scribblingAnchor = mousePos.copy();
                drawableStack.push(elementScribbling);
                break;
            case scribbleType_line:
                elementScribbling = new Line(mousePos.copy(), mousePos.copy(), strokecolorMap.get(args.get('strokecolor')), strokeweightMap.get(args.get('strokeweight')));
                scribblingAnchor = mousePos.copy();
                drawableStack.push(elementScribbling);
                break;
            case scribbleType_text:
                new TagLikedText(mousePos.copy())
                break;
            default:
                break;
        }
        // arrowDragging = null;
        console.log(pInst.mouseX + ' ' + pInst.mouseY);
        //         return false;
    }

    //显示该 Element 的内容编辑框
    pInst.mousePressed = function (ev) {
        console.log('scribble board pressed');
        switch (ev.target.id) {
            case canvas.id():
                sketch_mousePressed(ev);
                break;
        }
    }

    function sketch_mouseReleased(ev) {
        if (!scribbling) return;
        switch (scribbleType) {
            case scribbleType_handwrite:
            case scribbleType_rect:
            case scribbleType_ellipse:
            case scribbleType_arrow:
            case scribbleType_line:
                elementScribbling = null;
                break;
            case scribbleType_text:
                break;
            default:
                break;
        }
        // arrowDragging = null;
        console.log(pInst.mouseX + ' ' + pInst.mouseY);
    }
    pInst.mouseReleased = function (ev) {
        switch (ev.target.id) {
            case canvas.id():
                sketch_mouseReleased(ev);
                break;
        }
    }

    pInst.doubleClicked = function (ev) {
        return false;
    }

}


export let p5Scribble = new p5(sketchScribble, 'scribbleSketchHolder');





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

