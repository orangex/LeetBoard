import p5 = require("p5");
import { Vector } from "p5";
import { accent_color, md500_red, md500_green, md500_amber } from "./global";
import * as BoardData from "./sketchData"
import * as BoardScribble from "./sketchScribble"


interface Coordinate {
    x: number;
    y: number;
}
interface Size {
    width: number
    height: number
}

interface EventConsumer {

    //return true/false 决定了会不会阻止浏览器默认行为??? 还是 return 该事件是否被消费
    hover(mousePos: Vector): boolean//悬停：比如改变指针样式
    click(clickPos: Vector): boolean
    doubleClick(clickPos: Vector): boolean
    mousePress(pressPos: Vector): boolean
    longPressed(pressPos: Vector): boolean
    mouseRelease(releasePos: Vector): boolean

    mouseIn(): boolean
    mouseOut(): boolean
}

interface Drawable {
    draw(): void
}
abstract class BaseElement implements Drawable {
    abstract draw(): void
}
abstract class ResponsiveElement extends BaseElement implements EventConsumer {
    hover(mousePos: Vector): boolean {
        return false;
    }
    click(clickPos: Vector): boolean {
        return false;
    }
    doubleClick(clickPos: Vector): boolean {
        return false;
    }
    mousePress(pressPos: Vector): boolean {
        return false;
    }
    longPressed(pressPos: Vector): boolean {
        return false;
    }
    mouseRelease(releasePos: Vector): boolean {
        return false;
    }
    mouseIn(): boolean {
        return false;
    }
    mouseOut(): boolean {
        return false;
    }

    keyPressed(keyCode: number): boolean {
        return false;
    }
}

export abstract class BoardDataElement extends ResponsiveElement {

    pInst: p5

    //传入 Vector 之前先 copy
    constructor(public board: typeof BoardData, public datumPoint: Vector) {
        super()
        this.pInst = board.pInst;
        this.velocity = this.pInst.createVector(0, 0);
        this.acceleration = this.pInst.createVector(0, 0);
    }


    getCenter(): Vector {
        return this.datumPoint
    }
    acceleration: Vector;
    velocity: Vector;
    move(displacement: Vector) {
        this.datumPoint.add(displacement);
    }
    moveTo(pos: Vector) {
        this.datumPoint = pos.copy();
    }
    addForce(force: Vector) {
        this.acceleration.add(force);
    }

    hovering: any
    // 表示自己是否被选中
    selected: boolean
    editing: any
    //拖拽点与元素基准点的相对向量
    dragging: Vector = null;

    mouseWithin: any;
    //检测某个点在不在该元素内 决定了某个鼠标事件会不会分发到该元素来
    abstract posHovering(pos: Vector): boolean
    abstract posDraggable(pos: Vector): boolean

    //检测自己（的中心）是不是在某个矩形区域内
    abstract inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean

    mousePress(pressPos: Vector): boolean {
        if (this.posDraggable(pressPos)) {
            //如果有包括自己在内的多个元素被选中 那么一起移动
            if (this.board.elementsSelected.has(this))
                this.board.elementsSelected.forEach((ele) => {
                    ele.dragging = p5.Vector.sub(ele.datumPoint, pressPos);
                })
            //如果自己没被选中 那就移动自己
            else
                this.dragging = p5.Vector.sub(this.datumPoint, pressPos);
            return true;
        }
        return false;
    }

    abstract draw(): void

}

export abstract class BoardScribbleElement extends BaseElement {
    pInst: p5;
    //图画的那个锚点
    onScribbling: Vector | boolean;
    constructor(public board: typeof BoardScribble, public datumPoint: Vector) {
        super();
        this.pInst = this.board.scribble_pInst;
    }

}

function textwidth(pInst: p5, fontsize: number, text: number | string) {
    pInst.push();
    pInst.textSize(fontsize);
    let contentWidth = pInst.textWidth(text.toString());
    pInst.pop();
    return contentWidth;
}
export class ConnnectedGraph {
    acceleration: Vector;
    velocity: Vector;
    // links:Array<LBLink>
    nodes = new Array<LBNode>();

    // get position() {

    //     return this.particle.position;
    // };
    constructor(nodes: Array<LBNode>) {
        // super(board, null)
        // this.position = this.pInst.createVector(0, 0);
        this.addNodes(nodes);
    }


    addNodes(nodes: Array<LBNode>) {

        this.nodes = this.nodes.concat(nodes);
        nodes.forEach((node) => {
            node.graphBelong = this;
        });
    }
}



export class LBNode extends BoardDataElement {

    static titleSize = 20;
    radius = 20;
    titleInput: p5.Element;
    titleContent: string | number;
    graphBelong: ConnnectedGraph;
    // linkmap = new Map<>();
    recoverTitleInput(title: string | number) {
        let input = this.pInst.createInput();
        // input.class('in-Sketch-Main');
        input.value(title);
        input.size(textwidth(this.pInst, LBNode.titleSize, title)+1);
        input.attribute('disabled', 'true');
        input.style('outline', 'none');
        input.style('border', 'none');
        input.style('backgroundColor', 'transparent');
        input.style('font-size', `${LBNode.titleSize}px`);
        input.attribute('maxLength', '20');
        // input.elt.style.width='AUTO';
        // input.size(p5.AUTO);
        // input.elt.styleborderWidth="1px"
        input.elt.onkeypress = function (ev: any) {
            if (ev.keyCode === 13) {
                input.elt.blur();
            }
            // input.size(myp5.textWidth(input.value()+'mm'));
        };
        input.elt.addEventListener("focusout", () => {
            input.attribute('disabled', 'true');
            // input.elt.disabled = true;
            this.editing = false;
            this.board.lastNodeTitle = input.value();
            this.titleContent = input.value();
        });
        // input.input(() => {
        //     let contentWidth = myp5.textWidth(input.value());
        //     input.size(Math.min(contentWidth, this.cellWidth - 8));
        // })
        input.elt.addEventListener("input", () => {
            let contentWidth = textwidth(this.pInst, LBNode.titleSize, input.value());
            contentWidth = Math.min(contentWidth, this.radius * 2 - 4);
            contentWidth = Math.max(contentWidth, 2);
            input.size(contentWidth);
        });
        this.titleInput = input;
    }
    onDelete() {
        this.titleInput.remove();
    }
    onRecover() {
        this.recoverTitleInput(this.titleContent);
    }
    constructor(board: any, datumPoint: Vector, title?: string | number) {
        super(board, datumPoint);
        this.titleContent = title;
        this.onRecover();
    }

    getCenter(): p5.Vector {
        return this.datumPoint
    }

    inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
        return this.datumPoint.x >= leftTop.x && this.datumPoint.y >= leftTop.y && this.datumPoint.x <= rightBottom.x && this.datumPoint.y <= rightBottom.y
    }
    posHovering(pos: Vector): boolean {
        return p5.Vector.dist(pos, this.datumPoint) < this.radius + 8;
    }
    //isPosSelectable
    posSelectable(mousePos: Vector) {
        return (p5.Vector.dist(mousePos, this.datumPoint) <= this.radius * 0.75)
    }

    posDraggable(mousePos: Vector) {
        return this.posHovering(mousePos) && !this.posSelectable(mousePos);
    }

    posEditable(mousePos: Vector) {
        return this.posHovering(mousePos)
    }

    longPressed(pressPos: Vector): boolean {
        console.log('node longpressed')
        if (!this.posHovering(pressPos)) return false
        if(!this.posSelectable(pressPos)) return false;
        this.board.elementsSelected.clear()
        this.graphBelong.nodes.forEach((node) => {
            this.board.elementsSelected.add(node)
        })
        return true;
    }

    mousePress(pressPos: Vector): boolean {
        console.log('node pressed')
        if (super.mousePress(pressPos)) return true;
        if (this.posHovering(pressPos) && this.pInst.keyIsDown(67)) {
            let linkCreating = new LBLink(this.board, this, this.board.mousePos, true)
            linkCreating.onScribbling = true;
            this.board.links.add(linkCreating);
            return true;
        }
        return false
    }
    mouseRelease(releasePos: Vector) {
        console.log('node release')
        if (this.posHovering(releasePos)) {
            if (this.board.linkScribbling) {
                this.board.linkScribbling.onScribbling = false;
                //只有落下的那一刻才去维护更新图
                this.board.union(this.board.linkScribbling.start as LBNode, this);
                return true;
            }
        }
        return false;
    }

    hover(mousePos: Vector): boolean {
        if (!this.posHovering(mousePos)) return false;

        if (this.posDraggable(this.board.mousePos)) {
            this.pInst.cursor(this.pInst.MOVE);
        }
        return true;
    }
    click(clickPos: Vector) {
        console.log('node clicked')
        if (!this.posHovering(clickPos)) return false;

        if (this.posSelectable(this.board.mousePos)) {
            //mac 91:meta/cmd ,windows 17:control
            if (this.pInst.keyIsDown(91) || this.pInst.keyIsDown(17))
                this.board.elementsSelected.add(this)
            else {
                this.board.elementsSelected.clear();
                this.board.elementsSelected.add(this)
            }
            // this.selected = true;
            //todo 在此访问全局 or 上层自己维护
            // elementsSelected.
        } else {

        }
        return true;
    }
    doubleClick(clickPos: Vector) {
        console.log('node double clicked')
        if (!this.posHovering(clickPos)) return false;
        if (this.posEditable(this.board.mousePos)) {
            this.edit()
            //todo 在此访问全局 or 上层自己维护
            // elementsSelected.
        } else {
        }
        return true;
    }

    edit() {
        if (!this.editing) {
            this.editing = true;
            this.titleInput.attribute('disabled', 'false');
            this.titleInput.elt.focus();
            this.titleInput.elt.select();
        }
    }
    draw() {
        if(this.dragging ){
            this.datumPoint = p5.Vector.add(this.board.mousePos, this.dragging);
        }
        this.selected = this.board.elementsSelected.has(this)
        if (this.selected) {
            this.pInst.push();
            this.pInst.stroke(0, 0, 0);
            this.pInst.strokeWeight(3.5);
            this.pInst.ellipse(this.datumPoint.x, this.datumPoint.y, (this.radius + 1) * 2, (this.radius + 1) * 2);
            this.pInst.pop();
        } else {
            this.pInst.push();
            this.pInst.stroke(108, 108, 108);
            this.pInst.strokeWeight(1.25);
            this.pInst.ellipse(this.datumPoint.x, this.datumPoint.y, this.radius * 2, this.radius * 2);
            this.pInst.pop();
        }
        this.titleInput.position(Math.floor(this.datumPoint.x - (this.titleInput.size() as Size).width / 2), this.datumPoint.y - (this.titleInput.size() as Size).height / 2);
    }
}
export class LBLink extends BoardDataElement {
    inSelectionBox(leftTop: p5.Vector, rightBottom: p5.Vector): boolean {
        return false
    }
    titleInput: p5.Element;
    title: string | number;
    onScribbling = false;
    get startV() {
        let startV: Vector, endV: Vector;
        if (this.start instanceof LBNode) {
            startV = this.start.datumPoint.copy();
        } else {
            startV = this.start.copy();
        }

        if (this.end instanceof LBNode) {
            endV = this.end.datumPoint.copy();
        } else {
            endV = this.end.copy();
        }

        if (this.start instanceof LBNode) {
            startV.add(p5.Vector.sub(endV, startV).setMag(this.start.radius + 1));
        }

        if (this.end instanceof LBNode) {
            endV.add(p5.Vector.sub(startV, endV).setMag(this.end.radius + 1));
        }
        return startV;
    }
    get endV() {
        let startV: Vector, endV: Vector;
        if (this.start instanceof LBNode) {
            startV = this.start.datumPoint.copy();
        } else {
            startV = this.start.copy();
        }

        if (this.end instanceof LBNode) {
            endV = this.end.datumPoint.copy();
        } else {
            endV = this.end.copy();
        }

        if (this.start instanceof LBNode) {
            startV.add(p5.Vector.sub(endV, startV).setMag(this.start.radius + 1));
        }

        if (this.end instanceof LBNode) {
            endV.add(p5.Vector.sub(startV, endV).setMag(this.end.radius + 1));
        }
        return endV;
    }
    // direction:boolean  //正 反 无
    // TODO  directionTo 可能要一直改变
    constructor(board: any, public start: Vector | LBNode, public end: Vector | LBNode, public direction?: boolean) {
        super(board, start instanceof Vector ? start : start.datumPoint);
        this.title = '';
    }

    posDraggable(pos: Vector): boolean {
        return false
    }

    posHovering(mousePos: Vector): boolean {
        //正在涂画时 不应视为 hovering
        if (this.onScribbling) return false;
        let base = p5.Vector.sub(this.endV, this.startV);
        let v = p5.Vector.sub(mousePos, this.startV);
        // |a cross b|= |a||b|sina 求出高 也就是点到线距离
        let dist = p5.Vector.cross(base, v).mag() / base.mag();
        // |a dot b|= |a||b|cosa 求出斜边在线上的投影
        let cast = p5.Vector.dot(base, v) / base.mag();
        return dist < 2 && cast >= 0 && cast <= v.mag();
    }
    click(clickPos: Vector): boolean {
        if (!this.posHovering(clickPos)) {
            return false;
        }
        this.nextDirection();
        return true;

    }

    hover(mousePos: Vector): boolean {
        if (!this.posHovering(mousePos)) return false
        return true;
    }

    nextDirection() {
        if (this.direction)
            this.direction = false
        else if (!this.direction)
            this.direction = null;
        else if (this.direction == null)
            this.direction = true
    }
    // get directionTo(){

    // }
    draw() {
        if (this.onScribbling) {

            //鼠标拖动画线时  如果悬停在另外的 Node 上，应暂时显示 Node 与 Node 连线的效果
            if (this.board.elementHovering && this.board.elementHovering instanceof LBNode && this.board.elementHovering !== this.start) {
                this.end = this.board.elementHovering
                this.direction = true;
            } else {
                if (this.end instanceof LBNode)
                    this.end = this.board.mousePos.copy()
                else
                    this.end.set(this.pInst.mouseX, this.pInst.mouseY);
            }
        }
        this.pInst.push();
        this.pInst.stroke('black');
        this.pInst.strokeWeight(3);
        this.pInst.fill('black');

        //shape.draw();
        if (!(this.end instanceof LBNode) || this.direction == true)
            this.board.drawArrow(this.startV, p5.Vector.sub(this.endV, this.startV));
        else if (!(this.start instanceof LBNode) || this.direction == false)
            this.board.drawArrow(this.endV, p5.Vector.sub(this.startV, this.endV));
        else
            this.pInst.line(this.startV.x, this.startV.y, this.endV.x, this.endV.y);
        this.pInst.pop();

        let normalV = p5.Vector.sub(this.endV, this.startV).rotate(90).setMag(10);
        if (normalV.x < 0)
            normalV.rotate(180);
        //link 的中点+法向量=输入框的位置
        let temp = p5.Vector.add(this.startV, this.endV);
        let posV = temp.setMag(temp.mag() / 2).add(normalV);
        // this.pInst.text(this.titleInput, posV.x, posV.y);
    }

}

export class Array2D extends BoardDataElement {
    inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
        let center = {
            x: this.leftTop.x + this.width / 2,
            y: this.leftTop.y + this.height / 2
        }
        return center.x >= leftTop.x && center.y >= leftTop.y && center.x <= rightBottom.x && center.y >= rightBottom.y
    }

    center: Vector;
    getCenter(): p5.Vector {
        return this.center.set(this.leftTop.x + this.width / 2, this.leftTop.y + this.height / 2);
    }


    // innerSelected: Array2D.Array2DPointer | { rowIndex: number; colIndex: number }
    innerSelected: any
    //行号列号是绘制的结果，数据以 content[0][0]为左上定点。
    pointersByCell = new Array<Array<Array<Array2D.Array2DPointer>>>();
    cellWidth = 60;
    cellHeight = 60;
    title: string | number;
    titleInput: p5.Element
    cellContentInput: Array<Array<p5.Element>>;
    cellContent = new Array<Array<string | number>>();
    graphBelong: ConnnectedGraph;
    addtionArea: Array2D.Array2DAdditionArea;
    pointersCount = 0;
    // children = [];
    get maxRadius() {
        return Math.max(this.height, this.width) / 2;
    }

    longtimeHover = false;
    longHoverTimeoutID: number;

    constructor(board: typeof BoardData, pos: Vector, public rowNum: number, public colNum: number) {
        super(board, pos);
        this.center = this.pInst.createVector();
        for (let i = 0; i < rowNum; i++) {
            let currRowContent = new Array<string | number>();
            let currRowPointers = new Array<Array<Array2D.Array2DPointer>>();
            for (let j = 0; j < colNum; j++) {
                // this.pointersByCell[i][j]=new Array<Array2D.Array2DPointer>();
                currRowContent.push(' ');
                currRowPointers.push(new Array<Array2D.Array2DPointer>());
            }
            this.cellContent.push(currRowContent);
            this.pointersByCell.push(currRowPointers);
        }
        this.recover();

        this.addtionArea = new Array2D.Array2DAdditionArea(board, pos, this)
    }
    //dom 元素必须删 ，但如果撤销了就得恢复。
    recover() {
        this.cellContentInput = new Array<Array<p5.Element>>();
        for (let i = 0; i < this.rowNum; i++) {
            let currRowContentInput = new Array<p5.Element>();
            for (let j = 0; j < this.colNum; j++) {
                let input = this.pInst.createDiv();
                input.attribute('contenteditable', 'true');
                input.attribute('spellcheck', 'false');
                // input.class('in-Sketch-Main');
                input.value(this.cellContent[i][j]);
                input.style('max-width', `${this.cellWidth - 4}px`);
                input.style('min-width', `2px`);
                input.style('min-height', `20px`);
                input.style('max-height', `${this.cellHeight - 4}px`);
                input.style('overflow', 'auto')
                input.elt.disabled = true;
                input.elt.classList.add('transparentInput');

                input.elt.onkeypress = function (e: { keyCode: number; }) {
                    if (e.keyCode === 13) {
                        input.elt.blur();
                    }
                };
                input.elt.addEventListener("focusout", () => {
                    input.attribute('contenteditable', 'false');
                    this.editing = false;
                });
                currRowContentInput.push(input);
            }
            this.cellContentInput.push(currRowContentInput);
        }

        {
            this.titleInput = this.pInst.createInput();
            this.titleInput.value(this.title);
            this.titleInput.size(80);
            // this.title.elt.disabled = true;
            this.titleInput.style('outline', 'none');
            this.titleInput.style('border', 'none');
            this.titleInput.style('font-size', '18px');
            this.titleInput.style('backgroundColor', 'transparent');
            this.titleInput.attribute('maxLength', '20');
            this.titleInput.attribute('placeholder', '未命名');
            this.titleInput.elt.addEventListener("input", () => {
                // this.title.elt.style.size=this.title.value().length;
                let contentWidth = textwidth(this.pInst, 20, this.titleInput.value());
                this.pInst.push();
                this.pInst.textSize(18);
                // input.size()
                contentWidth = Math.min(contentWidth, this.width - 12);
                if (contentWidth == 0) contentWidth = 80;
                // contentWidth=Math.max(contentWidth, 2);// TODO 容纳 placeholer 的最小宽度
                this.titleInput.size(contentWidth);
                this.pInst.pop();
            });
            this.titleInput.elt.onkeypress = function (e: { keyCode: number; }) {
                if (e.keyCode === 13) {
                    this.blur();
                }
                // input.size(myp5.textWidth(input.value()+'mm'));
            };
            //取巧的做法，不想让这个 input 被纳入到 select-edit 规则中
            this.titleInput.elt.addEventListener("focus", () => {
                //标题正在编辑那么元素本体就视为选中
                this.selected = true;
                this.editing = true;
            });
            this.titleInput.elt.addEventListener("focusout", () => {
                this.editing = false;
                this.title = this.titleInput.value();
            });
        }

    }
    posWhich(mousePos: Vector): 'LTHA' | 'Anchor' | Array2D.Array2DPointer | { rIndex: number; cIndex: number } | 'DragArea' {
        return;
    }
    mouseIn(): boolean {
        if (this.pointersCount < 3)//pointer 暂时最多三个
            this.longHoverTimeoutID = window.setTimeout(() => this.addtionArea.show(), 1000);
        return false;
    }
    mouseOut() {
        this.addtionArea.hide()
        clearTimeout(this.longHoverTimeoutID);
        return false;
    }
    hover(mousePos: Vector): boolean {
        // this.hovering = true;
        if (this.addtionArea.posHovering(mousePos)) {
            this.addtionArea.hover(mousePos);
            return true;
        } else
            if (this.posAnchor(mousePos))
                this.pInst.cursor(this.pInst.HAND)
            else if (this.posDraggable(mousePos)) {
                this.pInst.cursor(this.pInst.MOVE);
            }
        // return hover;
    }

    get width(): number {
        return this.colNum * this.cellWidth;
    }
    get height(): number {
        return this.rowNum * this.cellHeight;
    }
    get leftTop(): Coordinate {
        return this.datumPoint;
    }
    leftTopOfCell(row: number, col: number): Coordinate {
        return {
            x: this.leftTop.x + col * this.cellWidth,
            y: this.leftTop.y + row * this.cellHeight,
        }
    }

    // get isSelected() {
    //     return this.selected;
    // }

    draw() {
        // this.pInst.randomSeed(this.id);
        this.selected = this.board.elementsSelected.has(this);
        if (this.dragging) {
            this.datumPoint = p5.Vector.add(this.board.mousePos, this.dragging);
        }

        for (let i = 0; i <= this.rowNum; i++) {
            this.pInst.line(this.leftTop.x, this.leftTop.y + i * this.cellHeight, this.leftTop.x + this.width, this.leftTop.y + i * this.cellHeight);
        }
        for (let i = 0; i <= this.colNum; i++) {
            this.pInst.line(this.leftTop.x + i * this.cellWidth, this.leftTop.y, this.leftTop.x + i * this.cellWidth, this.leftTop.y + this.height);
        }
        let pointersCount = [];
        for (let r = 0; r < this.rowNum; r++) {
            pointersCount.push([]);
        }
        for (let i = 0; i < this.rowNum; i++) {
            for (let j = 0; j < this.colNum; j++) {
                this.pointersByCell[i][j].forEach((pointer) => {
                    pointer.draw();
                })
            }
        }
        this.pInst.push();
        this.pInst.stroke(accent_color);
        this.pInst.strokeWeight(2.8);
        this.pInst.noFill();
        if (this.selected)
            this.pInst.rect(this.leftTop.x, this.leftTop.y, this.width, this.height);
        //todo 换个颜色
        if (this.innerSelected && !(this.innerSelected instanceof Array2D.Array2DPointer)) {
            let cellLeftTop = this.leftTopOfCell(this.innerSelected.rowIndex, this.innerSelected.colIndex)
            this.pInst.rect(cellLeftTop.x, cellLeftTop.y, this.cellWidth, this.cellHeight);
        }
        this.pInst.pop();


        for (let i = 0; i < this.rowNum; i++)
            for (let j = 0; j < this.colNum; j++) {
                let input = this.cellContentInput[i][j];
                let x = this.leftTop.x + j * this.cellWidth + this.cellWidth / 2;
                let y = this.leftTop.y + i * this.cellHeight + this.cellHeight / 2;
                // input.size(myp5.textWidth(input.value()));
                let xOffset = Math.floor(Math.min((input.size() as Size).width, this.cellWidth) / 2);
                let yOffset = Math.min((input.size() as Size).height, this.cellHeight) / 2;
                input.position(x - xOffset, y - yOffset);
            }

        //行号
        for (let i = 0; i < this.rowNum; i++) {
            let x = this.leftTop.x - this.cellWidth / 2;
            let y = this.leftTop.y + i * this.cellHeight + this.cellHeight / 2;
            this.pInst.text(i, x, y);
            // myp5.rect(x,y,1,1);
        }
        //列号
        for (let i = 0; i < this.colNum; i++) {
            let x = this.leftTop.x + i * this.cellWidth + this.cellWidth / 2;
            let y = this.leftTop.y - this.cellHeight / 2;
            this.pInst.text(i, x, y);
            // myp5.rect(x,y,1,1);
        }
        this.pInst.ellipse(this.leftTop.x, this.leftTop.y, 8, 8);
        let titleX = this.leftTop.x + this.width / 2;
        let titleY = this.leftTop.y + this.height + 18;
        this.titleInput.position(titleX - Math.floor((this.titleInput.size() as Size).width / 2), titleY - (this.titleInput.size() as Size).height / 2);
    }

    //进入编辑状态
    edit(rIndex: number, cIndex: number) {
        this.editing = true;
        this.innerSelected = {
            rowIndex: rIndex,
            colIndex: cIndex,
        }

        let input = this.cellContentInput[rIndex][cIndex];
        input.attribute('contenteditable', 'true');
        // input.elt.disabled = false;
        input.elt.focus();
        let range = window.getSelection();//创建range
        range.selectAllChildren(input.elt);//range 选择obj下所有子内容
        range.collapseToEnd();//光标移至最后
        // // 获取选定对象
        // let selection = getSelection()
        // // 设置最后光标对象
        // lastEditRange = selection.getRangeAt(0)
        // input.elt.click();
        // input.elt.select();
        // input.elt.selectionStart = 0;
        // input.elt.selectionEnd = input.value().length;

    }
    //判定选中 return 该 pos上是否成功选中
    selectCell(mousePos: Vector) {
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;

        //否则选中的是当前 cell
        this.innerSelected = {
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        return true;
    }
    // cancelSelect() {
    //     this.selected = null;
    // }
    //判定能否开始拖拽
    drag(mousePos: Vector) {
        if (!this.posDraggable(mousePos)) return false;
        return true;
    }
    moveSelected(key: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') {
        if (!this.innerSelected) return false;
        if (this.editing && key !== 'enter' && key !== 'tab') {
            return false;
        }

        if (!(this.innerSelected instanceof Array2D.Array2DPointer)) {
            this.cellContentInput[this.innerSelected.rowIndex][this.innerSelected.colIndex].elt.blur();
        }
        switch (key) {
            case 'up':
                this.innerSelected.rowIndex = Math.max(this.innerSelected.rowIndex - 1, 0);
                break;
            case 'down':
            case 'enter':
                this.cellContentInput[this.innerSelected.rowIndex][this.innerSelected.colIndex].elt.blur();
                this.innerSelected.rowIndex = Math.min(this.innerSelected.rowIndex + 1, this.rowNum - 1);
                break;
            case 'left':
                this.innerSelected.colIndex = Math.max(this.innerSelected.colIndex - 1, 0);
                break;
            case 'right':
            case 'tab':
                this.innerSelected.colIndex = Math.min(this.innerSelected.colIndex + 1, this.colNum - 1);
                break;

            default:
                break;
        }
        return true;
    }

    // private posCellSelectable(mousePos: Vector) {
    //     if (this.posDraggable(mousePos)) return false;
    //     return (mousePos.x >= this.leftTop.x && mousePos.x <= this.leftTop.x + this.width && mousePos.y >= this.leftTop.y && mousePos.y <= this.leftTop.y + this.height);
    // }
    //其实应该剔除左上角的那个 anchor
    posDraggable(mousePos: Vector) {
        if (this.posAnchor(mousePos)) return false;
        let c = 6;
        return (Math.abs(mousePos.x - this.leftTop.x) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.x - this.leftTop.x - this.width) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.y - this.leftTop.y) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)
            || (Math.abs(mousePos.y - this.leftTop.y - this.height) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)
        // return (
        //     (( || Math.abs(mousePos.x - this.leftTop.x - this.width) <= c) && (mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c))
        //     || ((Math.abs(mousePos.y - this.leftTop.y) <= c || Math.abs(mousePos.y - this.leftTop.y - this.height) <= c) && (mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c))
        // );
    }

    private posAnchor(mousePos: Vector): boolean {
        if (Math.abs(mousePos.x - this.leftTop.x) <= 6 && Math.abs(mousePos.y - this.leftTop.y) <= 6) {
            return true;
        }
        return false;
    }

    // isLongtimeHoverAreaClickable(mousePos: { x: number; y: number; }) {
    //     let tempx = mousePos.x - this.leftTop.x - this.width - this.xLHAOffset;
    //     let tempy = mousePos.y - this.leftTop.y
    //     if (tempx >= 0 && tempx <= 30 && tempy >= 0 && tempy <= 40) return 1;
    // }
    posHovering(mousePos: Vector) {
        let c = 6;
        let mainArea = (mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
        return mainArea || this.addtionArea.posHovering(mousePos);
    }
    click(mousePos: Vector) {
        if (!this.posHovering(mousePos)) return false;
        //todo 整合一下，select 直接返回 posSelectable的结果。现在不能整合的原因是，改变指针样式时只需要判定 isxxxable 。
        if (this.posAnchor(mousePos)) {
            //按住 ctrl/cmd 多选元素
            if (this.pInst.keyIsDown(91) || this.pInst.keyIsDown(17))
                this.board.elementsSelected.add(this)
            else {
                this.board.elementsSelected.clear();
                this.board.elementsSelected.add(this)
            }
            return true;
        }
        if (this.posDraggable(mousePos)) return true;

        if (this.addtionArea.posHovering(mousePos)) {
            this.addtionArea.click(mousePos);
            return true;
        }
        for (let i = 0; i < this.rowNum; i++) {
            for (let j = 0; j < this.colNum; j++) {
                if (this.pointersByCell[i][j].some((pointer: Array2D.Array2DPointer, index: number) => {
                    if (pointer.posHovering(mousePos)) {
                        pointer.click(mousePos);
                        return true;
                    }
                }))
                    return true;

            }
        }
        // let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        // let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        // if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;

        return this.selectCell(mousePos);
    }
    // selectPointer(thePointer: Array2D.Array2DPointer) {
    //     this.pointers.forEach((pointer) => {
    //         if (pointer !== thePointer)
    //             pointer.selected = false
    //         else
    //             pointer.selected = !pointer.selected;
    //     })
    // }

    doubleClick(mousePos: Vector) {
        if (!this.posHovering(mousePos)) return false;
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;

        this.edit(rIndex, cIndex)
        return true;
    }

    keyPressed(keyCode: number) {
        // if(this.selected instanceof)
        // if (this.board.elementsSelected.size == 1) {
        // let ele = this.board.elementsSelected.values().next().value;

        if (this.selectCell)
            // if (ele instanceof Array2D) { 
            switch (keyCode) {
                //暂时回车和 down 做一样处理
                case 40://arrow down 
                    if (this.moveSelected('down'))
                        return false;
                case 39://arrow right
                    if (this.moveSelected('right'))
                        return false;
                case 38://arrow up
                    if (this.moveSelected('up'))
                        return false;
                case 37://arrow left
                    if (this.moveSelected('left'))
                        return false;
                    break;
                //           case 13://arrow enter
                //             if (ele.moveSelected('enter'))
                //               return false;
                //             break;
                case 9://arrow left
                    if (this.moveSelected('tab'))
                        return false;
                    break;
                default:
                    break;
                //   }
                // }
            }

    }

    onDelete() {
        for (let i = 0; i < this.rowNum; i++) {
            for (let j = 0; j < this.colNum; j++) {
                this.cellContentInput[i][j].remove();
            }
        }
    }

}
export namespace Array2D {
    //到底是 Array2d 持有 pointers，每个 pointer 都是Array2DPointer， 还是 Array2d持有Array2dPointers,Array2dPointers 持有 pointers
    export class Array2DPointer extends BoardDataElement {
        posDraggable(pos: Vector): boolean {
            return false
        }
        inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
            return false;
        }

        posHovering(pos: Vector) {
            let rIndex = Math.floor((pos.y - this.array2D.leftTop.y) / this.array2D.cellHeight);
            let cIndex = Math.floor((pos.x - this.array2D.leftTop.x) / this.array2D.cellWidth);
            if (rIndex < 0 || rIndex >= this.array2D.rowNum || cIndex < 0 || cIndex >= this.array2D.colNum) return false;
            if (rIndex !== this.rowIndex || cIndex !== this.colIndex) return false;
            let assumeIndex = (pos.y - this.array2D.leftTopOfCell(rIndex, cIndex).y) / (this.height + 2);
            return assumeIndex == this.array2D.pointersByCell[rIndex][cIndex].indexOf(this);
            // for (let i = 0; i <= this.array2D.rowNum; i++) {
            //     for (let j = 0; j <= this.array2D.colNum; j++) {
            //         this.array2D.pointersByCell[i][j].some((pointer: Array2D.Array2DPointer, index: number) => {
            //             if (pointer == this) return true;
            //             if (pointer.rowIndex == this.rowIndex && pointer.colIndex == this.colIndex)
            //                 count++;
            //         })
            //     }
            // }

        }
        click(clickPos: Vector): boolean {
            // if(this.posClickable(clickPos))
            // this.array2D.pointers.some((pointer) => {
            //     if (pointer.select(mousePos, rIndex, cIndex)) {
            //         pointerSelected = true;
            //         this.selected = pointer;
            //         return true;
            //     }
            // })
            if (!this.posHovering(clickPos)) return false;
            this.array2D.innerSelected = this;
            // for (let i = 0; i <= this.array2D.rowNum; i++) {
            //     for (let j = 0; j <= this.array2D.colNum; j++) {
            //         this.array2D.pointersByCell[i][j].forEach((pointer) => {
            //             if (pointer == this.array2D.innerSelected)
            //             pointer.selected = true;A
            //             else
            //                 pointer.selected = false;
            //         })
            //     }
            // }
            return true;
        }

        // array2D:Array2D;
        // rowIndex: any;
        // colIndex: any;
        // selected=false;
        height: number;
        color: any;
        constructor(board: typeof BoardData, pos: Vector, private array2D: Array2D, private rowIndex: number, private colIndex: number, color: any) {
            super(board, pos);
            this.color = color;
            this.height = this.array2D.cellHeight / 3 - 2;
        }
        draw() {
            this.selected = this.array2D.innerSelected == this;
            let index = this.array2D.pointersByCell[this.rowIndex][this.colIndex].indexOf(this);
            let cellLeftTop = this.array2D.leftTopOfCell(this.rowIndex, this.colIndex);
            this.pInst.push();
            if (this.selected) {
                this.pInst.strokeWeight(1.5);
            } else {
                this.pInst.strokeWeight(0);
            }
            this.pInst.stroke(accent_color);
            this.pInst.fill(this.color);
            this.pInst.rect(cellLeftTop.x + 2, 2 + cellLeftTop.y + index * (this.height + 1), this.array2D.cellWidth - 4, this.height);
            this.pInst.pop();
        }
    }
    //二维表格右边的一个一列，矩形区域
    export class Array2DAdditionArea extends BoardDataElement {
        posDraggable(pos: Vector): boolean {
            return false;
        }
        inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
            return false;
        }
        width = 60;
        height: number;
        hide() {
            this.hidden = true;
        }
        show(): void {
            this.hidden = false;
        }

        posHovering(mousePos: Vector): boolean {
            let tempx = mousePos.x - this.array2D.leftTop.x - this.array2D.width;
            let tempy = mousePos.y - this.array2D.leftTop.y;
            if (tempx >= 0 && tempx <= this.width && tempy >= 0 && tempy <= this.height) {
                return true
            }
            return false;
        }
        xLHAOffset = 16;
        hidden = true;
        constructor(board: typeof BoardData, pos: Vector, private array2D: Array2D) {
            super(board, pos);
            this.height = this.array2D.height;
        }
        click(mousePos: Vector): boolean {
            let index = this.posClickable(mousePos);
            if (index == 1) {
                // this.longtimeHover=false;
                if (this.array2D.pointersByCell.length == 0)
                    this.array2D.pointersByCell[0][0].push(new Array2D.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_red))
                else if (this.array2D.pointersByCell.length == 1)
                    this.array2D.pointersByCell[0][0].push(new Array2D.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_green))
                else if (this.array2D.pointersByCell.length == 2)
                    this.array2D.pointersByCell[0][0].push(new Array2D.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_amber))
                this.array2D.pointersCount++;
            }
            return true;
            // if(this.posClickable(this.board.mousePos))
        }
        hover(mousePos: Vector): boolean {
            if (this.posHovering(mousePos)) {
                if (this.posClickable(mousePos)) this.pInst.cursor(this.pInst.HAND);
                return true;
            }
            return false
        }
        private posClickable(mousePos: Vector) {
            let tempx = mousePos.x - this.array2D.leftTop.x - this.array2D.width - this.xLHAOffset;
            let tempy = mousePos.y - this.array2D.leftTop.y
            let index: number;
            if (tempx >= 0 && tempx <= 30 && tempy >= 0 && tempy <= 40)
                index = 1;
            return index;
        }

        draw(): void {
            if (!this.hidden) {
                let xOffset = this.xLHAOffset;
                let w = 25;
                let h = 25;
                let hh = 12;
                this.pInst.push()
                this.pInst.stroke(24, 24, 24);
                this.pInst.fill(255, 0, 0);

                this.pInst.beginShape();
                this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset, this.array2D.leftTop.y);
                this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w, this.array2D.leftTop.y);
                this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w, this.array2D.leftTop.y + h);
                this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w / 2, this.array2D.leftTop.y + h + hh);
                this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset, this.array2D.leftTop.y + h);
                this.pInst.endShape(this.pInst.CLOSE);
                this.pInst.fill(255, 255, 255);
                let cx = this.array2D.leftTop.x + this.array2D.width + xOffset + w - 4;
                let cy = this.array2D.leftTop.y + h + hh / 2;
                let r = 8
                let l = 5
                this.pInst.ellipse(cx, cy, 2 * r, 2 * r);
                this.pInst.line(cx - l, cy, cx + l, cy);
                this.pInst.line(cx, cy - l, cx, cy + l);
                this.pInst.pop()
            }
            {
                this.pInst.push()
                this.pInst.stroke(24, 24, 24);
                this.pInst.fill(accent_color);
                this.pInst.ellipse(this.array2D.leftTop.x, this.array2D.leftTop.y, 8, 8);
                this.pInst.pop()
            }
        }
    }
}
export class Line extends BoardScribbleElement {


    strokecolor: string;
    strokeweight: number;
    constructor(board: typeof BoardScribble, public endV1: Vector, public endV2: Vector, strokecolor: string, strokeweight: number) {
        super(board, endV1)
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
        if (this.onScribbling) this.endV2.set(this.pInst.mouseX, this.pInst.mouseY);
        this.pInst.push();
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.line(this.endV1.x, this.endV1.y, this.endV2.x, this.endV2.y);
        this.pInst.pop();
    }

}
export class Rect extends BoardScribbleElement {

    // leftTop: { x: number; y: number; };
    width: number;
    height: number;
    strokecolor: string;
    strokeweight: number;

    constructor(board: typeof BoardScribble, pos: Vector, width: number, height: number, strokecolor: string, strokeweight: number) {
        super(board, pos);
        this.width = width;
        this.height = height;
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
        if (this.onScribbling && this.onScribbling instanceof Vector) {


            let lettTopx = Math.min(this.onScribbling.x, this.pInst.mouseX);
            let leftTopy = Math.min(this.onScribbling.y, this.pInst.mouseY)
            let rightbottomx = Math.max(this.onScribbling.x, this.pInst.mouseX);
            let rightbottomy = Math.max(this.onScribbling.y, this.pInst.mouseY);

            this.datumPoint.set(
                lettTopx,
                leftTopy
            )
            this.width = rightbottomx - lettTopx;
            this.height = rightbottomy - leftTopy;
        }

        this.pInst.push();
        this.pInst.noFill()
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.rect(this.datumPoint.x, this.datumPoint.y, this.width, this.height);
        this.pInst.pop();
    }

    // //如果正在画
    // onScribbling(anchor: { x: number; y: number; }, mousePos: { x: number; y: number; }) {
    //     this.leftTop.x = Math.min(anchor.x, mousePos.x);
    //     this.leftTop.y = Math.min(anchor.y, mousePos.y);
    //     let rightbottomx = Math.max(anchor.x, mousePos.x);
    //     let rightbottomy = Math.max(anchor.y, mousePos.y);

    // }
}
export class Path extends BoardScribbleElement {

    stamps = new Array<Vector>();
    leftTop: any;
    width: any;
    height: any;
    constructor(board: typeof BoardScribble, start: Vector, public strokecolor: string, public strokeweight: number) {
        super(board, start)
        this.stamps.push(start);
    }
    draw() {
        if (this.onScribbling) {
            this.stamps.push(this.board.mousePos.copy());
        }
        this.pInst.push();
        this.pInst.noFill()
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        for (let i = 1; i < this.stamps.length; i++) {
            const stamp = this.stamps[i];
            const lastStamp = this.stamps[i - 1];
            this.pInst.line(lastStamp.x, lastStamp.y, stamp.x, stamp.y);
        }
        this.pInst.pop();
    }
    //如果正在画
    // onScribbling(anchor: any, mousePos: any) {

    // }
}
export class Ellipse extends BoardScribbleElement {
    inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
        return false
    }
    // center: { x: number; y: number; };
    constructor(board: typeof BoardScribble, pos: Vector, public width: number, public height: number, public strokecolor: string, public strokeweight: number) {
        super(board, pos)
        // this.center = center;
    }
    get center(): Coordinate {
        return {
            x: this.datumPoint.x + this.width / 2,
            y: this.datumPoint.y + this.height / 2
        }
    }
    draw() {
        if (this.onScribbling && this.onScribbling instanceof Vector) {

            let lettTopx = Math.min(this.onScribbling.x, this.pInst.mouseX);
            let leftTopy = Math.min(this.onScribbling.y, this.pInst.mouseY)
            let rightbottomx = Math.max(this.onScribbling.x, this.pInst.mouseX);
            let rightbottomy = Math.max(this.onScribbling.y, this.pInst.mouseY);

            this.datumPoint.set(
                lettTopx,
                leftTopy
            )
            this.width = rightbottomx - lettTopx;
            this.height = rightbottomy - leftTopy;
        }
        this.pInst.push();
        this.pInst.noFill()
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.ellipse(this.center.x, this.center.y, this.width, this.height);
        this.pInst.pop();
    }

}

export class Arrow extends BoardScribbleElement {
    static topTriangleSideLength = 20;
    trapezoidBottomMidpoint: Vector;//梯形底部中点
    thePoint: Vector;//箭头顶点
    trapezoidBottomWidth: number;
    trapezoidTopWidthWidth: number;

    constructor(board: typeof BoardScribble, trapezoidBottomMidpoint: Vector, thePoint: Vector, public strokecolor: string, public strokeweight: number) {
        super(board, trapezoidBottomMidpoint);
        this.trapezoidBottomMidpoint = trapezoidBottomMidpoint;
        this.thePoint = thePoint;

    }
    // onScribbling(anchor: any, mousePos: any) {
    //     this.trapezoidBottomMidpoint = anchor;
    //     this.thePoint = mousePos;
    // }
    draw() {

        if (this.onScribbling) {
            this.thePoint.set(this.pInst.mouseX, this.pInst.mouseY)
        }
        let vAxis = p5.Vector.sub(this.thePoint, this.trapezoidBottomMidpoint);
        let vector1 = vAxis.copy().rotate(90).setMag(1.5);
        let vector2 = vAxis.copy().rotate(90).setMag(6);
        let vector3 = vAxis.copy().rotate(90).setMag(15);

        let v1 = this.trapezoidBottomMidpoint.copy().add(vector1);
        let v2 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(19))).add(vector2);
        let v3 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(21))).add(vector3);
        let v4 = this.thePoint;
        let v5 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(21))).add(vector3.rotate(180));
        let v6 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(19))).add(vector2.rotate(180));
        let v7 = this.trapezoidBottomMidpoint.copy().add(vector1.rotate(180));

        this.pInst.push();
        this.pInst.fill(this.strokecolor)
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.beginShape();
        this.pInst.vertex(v1.x, v1.y);
        this.pInst.vertex(v2.x, v2.y);
        this.pInst.vertex(v3.x, v3.y);
        this.pInst.vertex(v4.x, v4.y);
        this.pInst.vertex(v5.x, v5.y);
        this.pInst.vertex(v6.x, v6.y);
        this.pInst.vertex(v7.x, v7.y);

        this.pInst.endShape(this.pInst.CLOSE);
        this.pInst.pop();
    }
}

export class TagLikedText extends BoardScribbleElement {

    text: any;
    textarea: p5.Element;
    width: number;
    height: number;

    constructor(board: typeof BoardScribble, lefttoppos: Vector, color: string, weight: number) {
        super(board, lefttoppos);
        this.textarea = this.pInst.createDiv();
        this.textarea.attribute('contenteditable', 'true');
        this.textarea.html('')
        this.textarea.class('tagLikedTextarea');
        this.textarea.position(this.datumPoint.x, this.datumPoint.y)
        this.textarea.elt.focus();
        this.textarea.elt.select();
    }

    draw() {
        if (this.onScribbling && this.onScribbling instanceof Vector) {

            let lettTopx = Math.min(this.onScribbling.x, this.pInst.mouseX);
            let leftTopy = Math.min(this.onScribbling.y, this.pInst.mouseY)
            let rightbottomx = Math.max(this.onScribbling.x, this.pInst.mouseX);
            let rightbottomy = Math.max(this.onScribbling.y, this.pInst.mouseY);

            this.datumPoint.set(
                lettTopx,
                leftTopy
            )
            this.width = rightbottomx - lettTopx;
            this.height = rightbottomy - leftTopy;
        }
        this.textarea.position(this.datumPoint.x, this.datumPoint.y)
        this.textarea.style('min-width', `${this.width}px`);
        this.textarea.style('min-height', `${this.height}px`);

    }
}

// let drawArrow = function (base:Vector, line:Vector, myColor?:string):void {
//     p5Data.push();
//     p5Data.translate(base.x, base.y);
//     p5Data.line(0, 0, line.x, line.y);
//     p5Data.rotate(line.heading());
//     let arrowSize = 7;
//     p5Data.translate(line.mag() - arrowSize, 0);
//     p5Data.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
//     p5Data.pop();
//   }