import p5 = require("p5");
import { Vector } from "p5";
import { accent_color, md500_red, md500_green, md500_amber } from "./global";
import * as BoardData from "./sketchData"
import * as BoardScribble from "./sketchScribble"

const imaginary_color = 'rgba(f,f,f,0.25)';
const selected_color = '#008000'
// '#0000ff'
// '#08c'

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
    // hover(mousePos: Vector): boolean//悬停效果，鼠标、阴影等

    // click(clickPos: Vector): boolean
    // doubleClick(clickPos: Vector): boolean
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

    // hover(mousePos: Vector): boolean {
    //     return false
    // }
    // click(clickPos: Vector): boolean {
    //     return false;
    // }
    // doubleClick(clickPos: Vector): boolean {
    //     return false;
    // }
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

    // hover(mousePos: Vector): boolean {
    //     let hoveringNow = this.posWithin(mousePos);
    //     if (hoveringNow && !this.within) this.mouseIn()
    //     if (!hoveringNow && this.within) this.mouseOut();
    //     this.within = hoveringNow;
    //     return this.within;
    // }
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

    mouseWithin: boolean
    // 表示自己是否被选中，即焦点

    selected: boolean
    editing: boolean
    //拖拽点与元素基准点的相对向量
    dragging: Vector = null;

    // mouseWithin: boolean;

    //检测某个点在不在该元素( 主要区域)内 决定了某个鼠标事件会不会分发到该元素来
    abstract posWithin(pos: Vector): boolean
    abstract posDraggable(pos: Vector): boolean

    //检测自己（的中心）是不是在某个矩形区域内
    abstract inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean


    abstract posSelectable(pos: Vector): boolean

    cancelSelect() {
        this.selected = false;
    }
    keyTyped() {
        return false;
    }
    mousePress(pressPos: Vector): boolean {
        //cmd ctrl 多选
        if (this.pInst.keyIsDown(91) || this.pInst.keyIsDown(17)) {
            if (this.posWithin) {
                this.selected = true;
                return true;
            }
        } else
            if (this.posDraggable(pressPos)) {
                //如果自己被选中 就和所有一起选中的元素移动
                if (this.selected)
                    // if (this.board.elementsSelected.has(this))
                    this.board.elements.forEach((ele) => {
                        if (ele.selected == true)
                            ele.dragging = p5.Vector.sub(ele.datumPoint, pressPos);
                    })

                // //如果自己没被选中 那就移动自己
                else
                //如果自己没被选中 就取消选中所有其他的元素
                {
                    this.board.elements.forEach((ele) => {
                        ele.selected = false
                    })
                    this.selected = true;
                    this.dragging = p5.Vector.sub(this.datumPoint, pressPos);
                }
                console.log('start dragging')
                //     
                return true;
            } else
                if (this.posSelectable(pressPos)) {
                    this.board.elements.forEach((ele) => {
                        ele.selected = false;
                    })
                    this.selected = true;
                    return true;
                }

        return false;
    }

    draw() {
        this.mouseWithin = this.posWithin(BoardData.mousePos);
    }

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
    radius = 15;
    // titleInput: p5.Element;
    titleContent: string | number;
    graphBelong: ConnnectedGraph;
    // linkmap = new Map<>();

    constructor(board: any, datumPoint: Vector, title?: string | number) {
        super(board, datumPoint);
        this.titleContent = title;
        // this.onRecover();
    }

    getCenter(): p5.Vector {
        return this.datumPoint
    }

    inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
        return this.datumPoint.x >= leftTop.x && this.datumPoint.y >= leftTop.y && this.datumPoint.x <= rightBottom.x && this.datumPoint.y <= rightBottom.y
    }

    posWithin(pos: Vector): boolean {
        return p5.Vector.dist(pos, this.datumPoint) < this.radius + 10;
    }
    //isPosSelectable
    posSelectable(mousePos: Vector) {
        return (p5.Vector.dist(mousePos, this.datumPoint) <= this.radius * 0.75)
    }

    posDraggable(mousePos: Vector) {
        if (!this.posWithin(mousePos)) return false;
        if (this.posSelectable(mousePos)) return false;
        return true;
    }

    posEditable(mousePos: Vector) {
        return this.posWithin(mousePos)
    }

    // longPressed(pressPos: Vector): boolean {
    //     console.log('node longpressed')
    //     if (!this.posWithin(pressPos)) return false
    //     if (!this.posSelectable(pressPos)) return false;
    //     //选中连通图内所有元素
    //     this.graphBelong.nodes.forEach((node) => {

    //     })
    //     return true;
    // }
    pressTime: number = 0;
    pressTimeoutID: number
    mousePress(pressPos: Vector): boolean {
        if (!this.mouseWithin) return false;

        console.log('node pressed')



        // if (this.pressTime == 1) {
        //     clearTimeout(this.pressTimeoutID)
        //     if (this.posEditable(pressPos)) {
        //         this.edit()
        //     }
        //     this.pressTime = 0;
        // } else {
        //     this.pressTime++;
        //     this.pressTimeoutID = window.setTimeout(() => {
        //         this.pressTime = 0;

                
        //     }, 150)
        // }


        //16 = shift
        if (this.pInst.keyIsDown(16)) {
            let linkCreating = new LBLink(this.board, this, this.board.mousePos, true)
            linkCreating.onScribbling = "end";
            // this.board.links.add(linkCreating);
            this.board.elements.push(linkCreating)
            return true;
        } 
        if (super.mousePress(pressPos)) return true;
        return true
    }
    keyTyped(): boolean {
        if (!this.selected) return false;
        if (this.pInst.keyCode == 13) return false;
        if (!this.editing) {
            this.edit();
            return true;
        }
        return false;
    }
    mouseRelease(releasePos: Vector) {
        console.log('node release')
        if (this.posWithin(releasePos)) {
            if (this.board.elements.some((ele) => {
                if (ele instanceof LBLink && ele.onScribbling) {
                    ele.onScribbling = null;
                    if (ele.start instanceof LBNode && ele.end instanceof LBNode)
                        this.board.union(ele.start, ele.end)
                    return true;
                }
            }))
                return true
        }
        return false;
    }


    // doubleClick(clickPos: Vector) {
    //     console.log('node double clicked')
    //     if (!this.posWithin(clickPos)) return false;
    //     if (this.posEditable(this.board.mousePos)) {

    //         //todo 在此访问全局 or 上层自己维护
    //         // elementsSelected.
    //     } else {
    //     }
    //     return true;
    // }

    edit() {
        if (!this.editing) {
            this.editing = true;
            let input = this.board.editInput;
            (input.elt as HTMLInputElement).maxLength = 6;
            input.elt.onkeypress = (ev: any) => {
                if (ev.keyCode === 13 || ev.which === 13) {
                    //只有按回车才能算编辑完成
                    this.titleContent = (input.elt as HTMLInputElement).value;
                    this.editing = false;
                    input.hide();
                    // (input.elt as HTMLInputElement).blur();
                }
            };
            window.setTimeout(() => {
                input.show()
                input.elt.focus();
                (input.elt as HTMLInputElement).onblur = () => {
                    this.editing = false;
                    input.hide()
                };
            }, 100)


            input.value(this.titleContent);
            (input.elt as HTMLInputElement).select()
            input.show();
            input.elt.focus();
            // this.titleInput.attribute('disabled', 'false');
            // this.titleInput.elt.focus();
            // this.titleInput.elt.select();
        }
    }
    draw() {
        super.draw();
        if (this.dragging) {
            this.datumPoint = p5.Vector.add(this.board.mousePos, this.dragging);
        }

        if (this.posDraggable(this.board.mousePos)) {
            this.pInst.cursor(this.pInst.MOVE);
        }
        // this.selected = this.board.elementsSelected.has(this)
        if (this.selected) {
            this.pInst.push();
            this.pInst.stroke(selected_color);
            this.pInst.strokeWeight(3.5);
            this.pInst.ellipse(this.datumPoint.x, this.datumPoint.y, (this.radius + 1) * 2, (this.radius + 1) * 2);
            this.pInst.pop();
        }
        {
            this.pInst.push();
            this.pInst.stroke(108, 108, 108);
            this.pInst.strokeWeight(1.25);
            this.pInst.ellipse(this.datumPoint.x, this.datumPoint.y, this.radius * 2, this.radius * 2);
            this.pInst.pop();
        }
        if (this.editing)
            BoardData.editInput.position(Math.floor(this.datumPoint.x - (BoardData.editInput.size() as Size).width / 2), this.datumPoint.y + (BoardData.editInput.size() as Size).height / 2)
        this.pInst.push()
        this.pInst.textAlign(this.pInst.CENTER, this.pInst.CENTER);
        this.pInst.strokeWeight(0.3)
        this.pInst.textFont('Roboto');
        this.pInst.text(this.titleContent, this.getCenter().x, this.getCenter().y)
        this.pInst.pop();

    }
}
export class LBLink extends BoardDataElement {
    posSelectable(pos: p5.Vector): boolean {
        return false
    }
    inSelectionBox(leftTop: p5.Vector, rightBottom: p5.Vector): boolean {
        let midx = (this.startV.x + this.endV.x) / 2
        let midy = (this.startV.y + this.endV.y) / 2
        return (midx >= leftTop.x && midx <= rightBottom.x && midy >= leftTop.y && midy <= rightBottom.y)
    }
    titleInput: p5.Element;
    title: string | number;
    onScribbling: 'start' | 'end';
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

    posWithin(mousePos: Vector): boolean {
        //正在涂画时 不应视为 hovering
        // if (this.onScribbling) return false;
        //底
        let base = p5.Vector.sub(this.endV, this.startV);

        let v = p5.Vector.sub(mousePos, this.startV);
        // |a cross b|= |a||b|sina 求出高 也就是点到线距离
        let dist = Math.abs(p5.Vector.cross(base, v).mag()) / base.mag();
        // |a dot b|= |a||b|cosa 求出斜边在线上的投影
        let cast = p5.Vector.dot(base, v) / base.mag();

        return dist < 10 && cast >= -6 && cast <= base.mag() + 6;
    }

    posDraggableEnd(pos: Vector): 'start' | 'end' {
        if (p5.Vector.dist(pos, this.startV) < 12) return 'start'
        if (p5.Vector.dist(pos, this.endV) < 12) return 'end'
        return null
    }
    posChangeDirection(pos: Vector): boolean {
        if (!this.posWithin(pos)) return false;
        if (this.posDraggableEnd(pos)) return false;
        return true;
    }

    mousePress(pressPos: Vector): boolean {
        if (!this.mouseWithin) return false;
        if (super.mousePress(pressPos)) return true;
        if (this.posChangeDirection(pressPos)) {
            this.nextDirection();
            return true;
        }

        let whichEnd = this.posDraggableEnd(pressPos);
        switch (whichEnd) {
            case 'start':
            case 'end':
                this.onScribbling = whichEnd;
                return true;
            case null:
                return false;
        }
        return false;
    }
    // hover(mousePos: Vector): boolean {
    //     if(this.posChangeDirection(mousePos)){
    //         this.pInst.cursor(this.pInst.HAND)
    //         return true;
    //     }
    //     return false;
    // }

    nextDirection() {
        if (this.direction == true)
            this.direction = false
        else if (this.direction == false)
            this.direction = null;
        else if (this.direction == null)
            this.direction = true
    }
    // get directionTo(){

    // }
    draw() {
        super.draw();
        if (this.posChangeDirection(BoardData.mousePos)) {
            this.pInst.cursor(this.pInst.HAND)
        }
        if (this.onScribbling) {
            //鼠标拖动画线时  如果悬停在另外的 Node 上，应暂时显示 Node 与 Node 连线的效果
            //elementHovering重叠了 有多个

            if (this.board.nodeHovering) {
                if (this.onScribbling == 'start' && this.board.elementHovering !== this.end)
                    this.start = this.board.nodeHovering
                else if (this.onScribbling == 'end' && this.board.elementHovering !== this.start)
                    this.end = this.board.nodeHovering
            } else {
                if (this.onScribbling == 'start') this.start = this.board.mousePos.copy();
                else if (this.onScribbling == 'end') this.end = this.board.mousePos.copy();
            }

            // if (this.end instanceof LBNode)
            //     this.end = this.board.mousePos.copy()
            // else
            //     this.end.set(this.pInst.mouseX, this.pInst.mouseY);

        }


        this.pInst.push();
        this.pInst.stroke('black');
        this.pInst.strokeWeight(1.5);
        this.pInst.fill('black');

        //shape.draw();
        if (this.direction == true)
            this.board.drawArrow(this.startV, p5.Vector.sub(this.endV, this.startV));
        else if (this.direction == false)
            this.board.drawArrow(this.endV, p5.Vector.sub(this.startV, this.endV));
        else
            this.pInst.line(this.startV.x, this.startV.y, this.endV.x, this.endV.y);
        this.pInst.pop();
        if (this.mouseWithin && !this.onScribbling) {
            this.pInst.ellipse(this.startV.x, this.startV.y, 8, 8)
            this.pInst.ellipse(this.endV.x, this.endV.y, 8, 8)
        }


        let normalV = p5.Vector.sub(this.endV, this.startV).rotate(90).setMag(10);
        if (normalV.x < 0)
            normalV.rotate(180);
        //link 的中点+法向量=输入框的位置
        let temp = p5.Vector.add(this.startV, this.endV);
        let posV = temp.setMag(temp.mag() / 2).add(normalV);
        // this.pInst.text(this.titleInput, posV.x, posV.y);
    }

}

interface Selected_Column {
    kind: 'column';
    colIndex: number
}
interface Selected_Row {
    kind: 'row';
    rowIndex: number
}
interface Selected_Cell {
    kind: 'cell';
    rowIndex: number;
    colIndex: number
}
export class LBMap extends BoardDataElement {
    posSelectable(pos: p5.Vector): boolean {
        return false;
    }

    inSelectionBox(leftTop: p5.Vector, rightBottom: p5.Vector): boolean {
        let center = {
            x: this.leftTop.x + this.width / 2,
            y: this.leftTop.y + this.height / 2
        }
        return center.x >= leftTop.x && center.y >= leftTop.y && center.x <= rightBottom.x && center.y <= rightBottom.y
    }

    center: Vector;
    getCenter(): p5.Vector {
        return this.center.set(this.leftTop.x + this.width / 2, this.leftTop.y + this.height / 2);
    }

    // innerSelected: Array2D.Array2DPointer | { rowIndex: number; colIndex: number }

    //行号列号是绘制的结果，数据以 content[0][0]为左上定点。
    cellWidth = 30;
    cellHeight = 30;
    title: string | number;
    // cellContentInput: Array<Array<p5.Element>>;
    graphBelong: ConnnectedGraph;
    // children = [];
    innerSelected: Selected_Column | Selected_Cell
    get maxRadius() {

        return Math.max(this.height, this.width) / 2;
    }

    longtimeHover = false;
    longHoverTimeoutID: number;

    // colNum:number=4;
    keys = new Array<string>();
    values = new Array<string>();
    constructor(board: typeof BoardData, pos: Vector, public colNum: number = 4) {
        super(board, pos);
        this.center = this.pInst.createVector();
        this.keys.length = colNum;
        this.keys.fill('');
        this.values.length = colNum;
        this.values.fill('');
    }

    // posWhich(mousePos: Vector): 'LTHA' | 'Anchor' | Array2D.Array2DPointer | { rIndex: number; cIndex: number } | 'DragArea' {
    //     return;
    // }

    get width(): number {
        return this.colNum * this.cellWidth;
    }
    get height(): number {
        return 2 * this.cellHeight;
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

        super.draw()
        if (this.dragging) {
            this.datumPoint = p5.Vector.add(this.board.mousePos, this.dragging);
        }
        let rIndex = Math.floor((BoardData.mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((BoardData.mousePos.x - this.leftTop.x) / this.cellWidth);
        // this.pInst.randomSeed(this.id);
        // this.selected = this.board.elementsSelected.has(this);
        if (this.mouseWithin && !this.dragging) {
            this.pInst.push();
            this.pInst.stroke('rgba(0,0,0,0.5)');
            // this.pInst.strokeWeight(1)
            this.pInst.line(this.leftTop.x + this.width, this.leftTop.y, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y)
            this.pInst.line(this.leftTop.x + this.width + this.cellWidth, this.leftTop.y, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y + this.height)
            this.pInst.line(this.leftTop.x + this.width, this.leftTop.y + this.height, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y + this.height)
            let tempX = this.leftTopOfCell(1, this.colNum).x + this.cellWidth / 2
            let tempY = this.leftTop.y + this.cellHeight;
            this.pInst.line(tempX - this.cellWidth * 0.25, tempY, tempX + this.cellWidth * 0.25, tempY)
            this.pInst.line(tempX, tempY - this.cellWidth * 0.25, tempX, tempY + this.cellWidth * 0.25)
            this.pInst.pop();
        }

        if (this.posAddColumn(BoardData.mousePos))
            this.pInst.cursor(this.pInst.HAND)
        if (this.posSelectColumn(BoardData.mousePos) !== null) {
            this.pInst.cursor('s-resize')
        }
        if (this.posDraggable(BoardData.mousePos)) {
            this.pInst.cursor(this.pInst.MOVE)
        }


        // this.pInst.line(this.leftTop.x+this.width+this.cellWidth,this.leftTop.y,this.leftTop.x+this.width+this.cellWidth,this.leftTop.y+this.height)



        for (let i = 0; i <= 2; i++) {
            this.pInst.line(this.leftTop.x, this.leftTop.y + i * this.cellHeight, this.leftTop.x + this.width, this.leftTop.y + i * this.cellHeight);
        }
        for (let i = 0; i <= this.colNum; i++) {
            this.pInst.line(this.leftTop.x + i * this.cellWidth, this.leftTop.y, this.leftTop.x + i * this.cellWidth, this.leftTop.y + this.height);
        }
        // this.pInst.line(this.leftTop.x+this.width,this.leftTop.y,this.leftTop.x+this.width+this.cellWidth,this.leftTop.y)



        this.pInst.push();
        this.pInst.stroke(selected_color);
        this.pInst.strokeWeight(2.8);
        this.pInst.noFill();
        if (this.selected)
            this.pInst.rect(this.leftTop.x, this.leftTop.y, this.width, this.height);
        //todo 换个颜色
        if (this.innerSelected) {
            switch (this.innerSelected.kind) {

                case 'cell':
                    let cellLeftTop = this.leftTopOfCell(this.innerSelected.rowIndex, this.innerSelected.colIndex)
                    this.pInst.rect(cellLeftTop.x, cellLeftTop.y, this.cellWidth, this.cellHeight);
                    break;
                case 'column':
                    let temp = this.leftTopOfCell(0, this.innerSelected.colIndex)
                    this.pInst.rect(temp.x, temp.y, this.cellWidth, this.cellHeight * 2);
            }
        }


        this.pInst.pop();

        this.pInst.push()
        this.pInst.strokeWeight(0.3)
        this.pInst.textFont('Roboto');
        this.pInst.textAlign(this.pInst.CENTER, this.pInst.CENTER);
        for (let i = 0; i < this.keys.length; i++) {
            let tl = this.leftTopOfCell(0, i);
            this.pInst.text(this.keys[i], tl.x, tl.y, this.cellWidth, this.cellHeight)
            tl = this.leftTopOfCell(1, i);
            this.pInst.text(this.values[i], tl.x, tl.y, this.cellWidth, this.cellHeight)

        }
        this.pInst.textAlign(this.pInst.RIGHT, this.pInst.CENTER);
        let tl = this.leftTopOfCell(0, 0);
        this.pInst.text("Keys", tl.x - 2, tl.y + this.cellHeight / 2);
        tl = this.leftTopOfCell(1, 0);
        this.pInst.text("Values", tl.x - 2, tl.y + this.cellHeight / 2);
        this.pInst.pop()
        // this.titleInput.position(titleX - Math.floor((this.titleInput.size() as Size).width / 2), titleY - (this.titleInput.size() as Size).height / 2);
    }
    posSelectColumn(pos: Vector): number {
        if (!this.mouseWithin) return null;
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex == -1 && cIndex >= 0 && cIndex < this.colNum) return cIndex
        return null;
    }
    posAddColumn(pos: Vector): boolean {
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        return (cIndex == this.colNum && (rIndex == 0 || rIndex == 1))
    }

    keyTyped(): boolean {
        if (this.pInst.keyCode == 13) return false;
        if (!this.innerSelected) return false;
        if (this.editing) return false;
        if (this.innerSelected.kind == 'cell') {
            this.edit(this.innerSelected.rowIndex, this.innerSelected.colIndex);
            return true;
        }
        return false;
    }
    //进入编辑状态
    edit(rIndex: number, cIndex: number) {
        // this.selected=false;

        this.editing = true;
        this.innerSelected = {
            kind: 'cell',
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        let input = this.board.editInput;
        (input.elt as HTMLInputElement).maxLength = 6;
        input.elt.onkeypress = (ev: any) => {
            if (ev.keyCode === 13 || ev.which === 13) {
                //只有按回车才能算编辑完成
                if (rIndex == 0) this.keys[cIndex] = (input.elt as HTMLInputElement).value;
                if (rIndex == 1) this.values[cIndex] = (input.elt as HTMLInputElement).value;
                this.editing = false;
                input.hide();
                // (input.elt as HTMLInputElement).blur();
            }
        };
        window.setTimeout(() => {
            input.show()
            input.elt.focus();
            (input.elt as HTMLInputElement).onblur = () => {
                this.editing = false;
                input.hide()
            };
        }, 100)
        // (input.elt as HTMLInputElement).onblur = () => {
        //     this.editing = false;
        //     input.hide();
        // };
        if (rIndex == 0)
            input.value(this.keys[cIndex]);
        else
            input.value(this.values[cIndex]);
        (input.elt as HTMLInputElement).select()
        input.show();
        input.elt.focus();

        let lt = this.leftTopOfCell(rIndex, cIndex);
        this.board.editInput.position(lt.x + this.cellWidth / 2 - Math.floor((input.size() as any).width / 2), lt.y + this.cellHeight + 2)

    }
    //判定选中 return 该 pos上是否成功选中
    selectCell(mousePos: Vector) {
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= 2 || cIndex < 0 || cIndex >= this.colNum) return false;

        this.board.elements.forEach((ele) => {
            ele.cancelSelect();
        })
        //否则选中的是当前 cell
        this.innerSelected = {
            kind: 'cell',
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        return true;
    }

    cancelSelect() {
        super.cancelSelect();
        this.innerSelected = null;
    }

    //判定能否开始拖拽
    drag(mousePos: Vector) {
        if (!this.posDraggable(mousePos)) return false;
        return true;
    }
    moveSelected(key: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') {
        if (this.editing) return false;
        if (!this.innerSelected || this.innerSelected.kind !== 'cell') return false;

        switch (key) {
            case 'up':
                this.innerSelected.rowIndex = Math.max(this.innerSelected.rowIndex - 1, 0);
                break;
            case 'down':
            case 'enter':
                // this.cellContentInput[this.innerSelected.rowIndex][this.innerSelected.colIndex].elt.blur();
                this.innerSelected.rowIndex = Math.min(this.innerSelected.rowIndex + 1, 2 - 1);
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
        // if (this.posAnchor(mousePos)) return false;
        if (!this.mouseWithin) return false;
        let c = 6;
        return (Math.abs(mousePos.x - this.leftTop.x) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.x - this.leftTop.x - this.width) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.y - this.leftTop.y) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)
            || (Math.abs(mousePos.y - this.leftTop.y - this.height) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)

    }

    // private posAnchor(mousePos: Vector): boolean {
    //     if (Math.abs(mousePos.x - this.leftTop.x) <= 6 && Math.abs(mousePos.y - this.leftTop.y) <= 6) {
    //         return true;
    //     }
    //     return false;
    // }

    posWithin(mousePos: Vector) {
        let c = this.cellWidth / 2;
        let mainArea = (mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + (this.mouseWithin ? this.cellWidth : 0) + this.width + c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
        return mainArea
        // || this.addtionArea.posHovering(mousePos);
    }

    pressTime: number = 0;
    pressTimeoutID: number

    mousePress(pressPos: Vector) {
        if (!this.mouseWithin) return false;

        // if (this.pressTime == 1) {
        //     clearTimeout(this.pressTimeoutID)
        //     this.doubleClick(pressPos)
        //     this.pressTime = 0;
        // } else {
        //     this.pressTime++;
        //     this.pressTimeoutID = window.setTimeout(() => {
        //         this.pressTime = 0;

        //     }, 120)
        // }

        if (super.mousePress(pressPos)) return true;
        if (this.posAddColumn(pressPos)) {
            this.colNum++
            this.keys.push('');
            this.values.push('');
            return true;
        }
        if (this.posSelectColumn(pressPos) !== null) {
            this.innerSelected = {
                kind: 'column',
                colIndex: this.posSelectColumn(pressPos)
            }
            this.selected = false;
            return true;
        }
        if (this.posDraggable(pressPos)) return true;

        return this.selectCell(pressPos);
        return true;

    }


    doubleClick(mousePos: Vector) {
        if (!this.posWithin(mousePos)) return false;
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= 2 || cIndex < 0 || cIndex >= this.colNum) return false;

        this.edit(rIndex, cIndex)
        return true;
    }

    keyPressed(keyCode: number) {

        switch (keyCode) {
            //暂时回车和 down 做一样处理
            case 40://arrow down 
                return this.moveSelected('down')
            case 39://arrow right
                return this.moveSelected('right')
            case 38://arrow up
                return this.moveSelected('up')
            case 37://arrow left
                return this.moveSelected('left')
            case 13://arrow enter
                return this.moveSelected('enter')
            case 9://arrow left
                return this.moveSelected('tab')
            case 8://backspace

                if (this.innerSelected && this.innerSelected.kind == 'column') {
                    this.keys.splice(this.innerSelected.colIndex, 1)
                    this.values.splice(this.innerSelected.colIndex, 1)
                    this.colNum--;
                }
            default:
                return false;
                break;
            //   }
            // }
        }

    }

}
export class LBTable extends BoardDataElement {
    posSelectable(pos: p5.Vector): boolean {
        return false;
    }
    inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
        let center = {
            x: this.leftTop.x + this.width / 2,
            y: this.leftTop.y + this.height / 2
        }
        return center.x >= leftTop.x && center.y >= leftTop.y && center.x <= rightBottom.x && center.y <= rightBottom.y
    }

    center: Vector;
    getCenter(): p5.Vector {
        return this.center.set(this.leftTop.x + this.width / 2, this.leftTop.y + this.height / 2);
    }

    // innerSelected: Array2D.Array2DPointer | { rowIndex: number; colIndex: number }
    innerSelected: Selected_Row | Selected_Column | Selected_Cell
    //行号列号是绘制的结果，数据以 content[0][0]为左上定点。
    // pointersByCell = new Array<Array<Array<LBTable.Array2DPointer>>>();
    cellWidth = 45;
    cellHeight = 45;
    title: string | number;
    titleInput: p5.Element
    // cellContentInput: Array<Array<p5.Element>>;

    graphBelong: ConnnectedGraph;
    // addtionArea: LBTable.Array2DAdditionArea;
    pointersCount = 0;
    // children = [];
    get maxRadius() {
        return Math.max(this.height, this.width) / 2;
    }

    longtimeHover = false;
    longHoverTimeoutID: number;
    rowNum: number
    colNum: number
    constructor(board: typeof BoardData, pos: Vector, public cellContent: Array<Array<string>>) {
        super(board, pos);
        this.center = this.pInst.createVector();
        if (cellContent) {
            this.rowNum = cellContent.length;
            let maxCol = 1;
            cellContent.forEach((row) => {
                if (row.length > maxCol) maxCol = row.length;
            })
            this.colNum = maxCol;
        } else {
            this.cellContent = new Array<Array<string>>();
            this.rowNum = 1;
            this.colNum = 3;
            // this.cellContent.length = this.rowNum;
            for (let i = 0; i < this.rowNum; i++) {
                let currRowContent = new Array<string>();
                currRowContent.length = this.colNum;
                currRowContent.fill('');

                // let currRowPointers = new Array<Array<LBTable.Array2DPointer>>();
                // for (let j = 0; j < colNum; j++) {
                //     // this.pointersByCell[i][j]=new Array<Array2D.Array2DPointer>();
                //     currRowContent.push(' ');
                //     currRowPointers.push(new Array<LBTable.Array2DPointer>());
                // }
                this.cellContent.push(currRowContent);
            }
        }

        // this.recover();

        // this.addtionArea = new LBTable.Array2DAdditionArea(board, pos, this)
    }

    // posWhich(mousePos: Vector): 'LTHA' | 'Anchor' | LBTable.Array2DPointer | { rIndex: number; cIndex: number } | 'DragArea' {
    //     return;
    // }
    mouseIn(): boolean {
        // if (this.pointersCount < 3)//pointer 暂时最多三个
        //     this.longHoverTimeoutID = window.setTimeout(() => this.addtionArea.show(), 1000);
        return true;
    }
    mouseOut() {
        // this.addtionArea.hide()
        clearTimeout(this.longHoverTimeoutID);
        return true;
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
    posSelectColumn(pos: Vector): number {
        if (!this.mouseWithin) return null;
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        if (cIndex < 0 || cIndex >= this.colNum || rIndex !== -1) return null;
        return cIndex;
    }
    posSelectRow(pos: Vector): number {
        if (!this.mouseWithin) return null;
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex !== -1) return null;
        return rIndex;
    }
    posAddColumn(pos: Vector): boolean {
        if (!this.mouseWithin) return false;
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex !== this.colNum) return false;
        return true
    }
    posAddRow(pos: Vector): boolean {
        if (!this.mouseWithin) return false;
        let rIndex = Math.floor((pos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((pos.x - this.leftTop.x) / this.cellWidth);
        if (cIndex < 0 || cIndex >= this.colNum || rIndex !== this.rowNum) return false;
        return true
    }

    draw() {
        super.draw()
        // this.pInst.randomSeed(this.id);
        // this.selected = this.board.elementsSelected.has(this);

        if (this.mouseWithin) {
            // if (this.posAnchor(BoardData.mousePos))
            //     this.pInst.cursor(this.pInst.HAND)
            // else 
            if (this.posDraggable(BoardData.mousePos)) {
                this.pInst.cursor(this.pInst.MOVE);
            } else if (this.posSelectColumn(BoardData.mousePos) !== null) {
                this.pInst.cursor('s-resize')
            } else if (this.posSelectRow(BoardData.mousePos) !== null) {
                this.pInst.cursor('e-resize')
            } else if (this.posAddRow(BoardData.mousePos)) {
                this.pInst.cursor(this.pInst.HAND)
            } else if (this.posAddColumn(BoardData.mousePos)) {
                this.pInst.cursor(this.pInst.HAND)
            }
        }


        if (this.mouseWithin && !this.dragging) {
            this.pInst.push();
            this.pInst.stroke('rgba(0,0,0,0.5)');
            // this.pInst.strokeWeight(1)
            this.pInst.line(this.leftTop.x + this.width, this.leftTop.y, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y)
            this.pInst.line(this.leftTop.x + this.width + this.cellWidth, this.leftTop.y, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y + this.height)
            this.pInst.line(this.leftTop.x + this.width, this.leftTop.y + this.height, this.leftTop.x + this.width + this.cellWidth, this.leftTop.y + this.height)
            let tempX = this.leftTop.x + this.width + this.cellWidth / 2
            let tempY = this.leftTop.y + this.height / 2;
            this.pInst.line(tempX - this.cellWidth * 0.25, tempY, tempX + this.cellWidth * 0.25, tempY)
            this.pInst.line(tempX, tempY - this.cellWidth * 0.25, tempX, tempY + this.cellWidth * 0.25)

            this.pInst.line(this.leftTop.x, this.leftTop.y + this.height, this.leftTop.x, this.leftTop.y + this.height + this.cellHeight)
            this.pInst.line(this.leftTop.x, this.leftTop.y + this.height + this.cellHeight, this.leftTop.x + this.width, this.leftTop.y + this.height + this.cellHeight)
            this.pInst.line(this.leftTop.x + this.width, this.leftTop.y + this.height, this.leftTop.x + this.width, this.leftTop.y + this.height + this.cellHeight)
            tempX = this.leftTop.x + this.width / 2
            tempY = this.leftTop.y + this.height + this.cellHeight / 2;

            this.pInst.line(tempX - this.cellHeight * 0.25, tempY, tempX + this.cellHeight * 0.25, tempY)
            this.pInst.line(tempX, tempY - this.cellHeight * 0.25, tempX, tempY + this.cellHeight * 0.25)
            this.pInst.pop();
        }

        if (this.dragging) {
            this.datumPoint = p5.Vector.add(this.board.mousePos, this.dragging);
        }

        this.pInst.push();
        this.pInst.stroke(128, 128, 128, 128);
        this.pInst.strokeWeight(1)

        for (let i = 0; i <= this.rowNum; i++) {
            this.pInst.line(this.leftTop.x, this.leftTop.y + i * this.cellHeight, this.leftTop.x + this.width, this.leftTop.y + i * this.cellHeight);
        }
        for (let i = 0; i <= this.colNum; i++) {
            this.pInst.line(this.leftTop.x + i * this.cellWidth, this.leftTop.y, this.leftTop.x + i * this.cellWidth, this.leftTop.y + this.height);
        }
        this.pInst.pop();
        // let pointersCount = [];
        // for (let r = 0; r < this.rowNum; r++) {
        //     pointersCount.push([]);
        // }
        // for (let i = 0; i < this.rowNum; i++) {
        //     for (let j = 0; j < this.colNum; j++) {
        //         this.pointersByCell[i][j].forEach((pointer) => {
        //             pointer.draw();
        //         })
        //     }
        // }
        this.pInst.push();
        this.pInst.stroke(selected_color);
        this.pInst.strokeWeight(2.8);
        this.pInst.noFill();
        if (this.selected) {
            this.pInst.rect(this.leftTop.x, this.leftTop.y, this.width, this.height);
        }
        //todo 换个颜色
        if (this.innerSelected) {
            // this.pInst.stroke(selected_color);
            switch (this.innerSelected.kind) {
                case 'cell':
                    let cellLeftTop = this.leftTopOfCell(this.innerSelected.rowIndex, this.innerSelected.colIndex)
                    this.pInst.rect(cellLeftTop.x, cellLeftTop.y, this.cellWidth, this.cellHeight);
                    break;
                case 'row':
                    this.pInst.rect(this.leftTop.x, this.leftTop.y + this.innerSelected.rowIndex * this.cellHeight, this.width, this.cellHeight);
                    break;
                case 'column':
                    this.pInst.rect(this.leftTop.x + this.innerSelected.colIndex * this.cellWidth, this.leftTop.y, this.cellWidth, this.height)
                    break;
            }
        }

        this.pInst.pop();

        this.pInst.push()
        this.pInst.strokeWeight(0.4)
        this.pInst.textFont('Roboto');
        this.pInst.textSize(14);
        this.pInst.textAlign(this.pInst.CENTER, this.pInst.CENTER);

        for (let i = 0; i < this.rowNum; i++)
            for (let j = 0; j < this.colNum; j++) {
                let tl = this.leftTopOfCell(i, j);
                // this.pInst.text('The quick brown fox jumped over the lazy dog.', tl.x, tl.y, 50, 60)
                this.pInst.text(this.cellContent[i][j].toString(), tl.x, tl.y, this.cellWidth, this.cellHeight)

                // let input = this.cellContentInput[i][j];
                // let x = this.leftTop.x + j * this.cellWidth + this.cellWidth / 2;
                // let y = this.leftTop.y + i * this.cellHeight + this.cellHeight / 2;
                // // input.size(myp5.textWidth(input.value()));
                // let xOffset = Math.floor(Math.min((input.size() as Size).width, this.cellWidth) / 2);
                // let yOffset = Math.min((input.size() as Size).height, this.cellHeight) / 2;
                // input.position(x - xOffset, y - yOffset);
            }
        this.pInst.pop()

        //行号
        // if (this.mouseWithin && !this.dragging) 
        {
            this.pInst.push()
            this.pInst.strokeWeight(0.4)
            this.pInst.textFont('Roboto');
            this.pInst.fill(128, 128, 128);
            this.pInst.textAlign(this.pInst.CENTER, this.pInst.CENTER);
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
            this.pInst.pop()
        }

        // this.pInst.ellipse(this.leftTop.x, this.leftTop.y, 8, 8);
        let titleX = this.leftTop.x + this.width / 2;
        let titleY = this.leftTop.y + this.height + 18;
        // this.titleInput.position(titleX - Math.floor((this.titleInput.size() as Size).width / 2), titleY - (this.titleInput.size() as Size).height / 2);
    }
    keyTyped(): boolean {
        if (this.pInst.keyCode == 13) return false;
        if (!this.innerSelected) return false;
        if (this.editing) return false;
        if (this.innerSelected.kind == 'cell') {
            this.edit(this.innerSelected.rowIndex, this.innerSelected.colIndex);
            return true;
        }
        return false;
    }
    //进入编辑状态
    edit(rIndex: number, cIndex: number) {
        this.editing = true;
        this.innerSelected = {
            kind: 'cell',
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        let input = this.board.editInput;
        (input.elt as HTMLInputElement).maxLength = 6;
        input.elt.onkeypress = (ev: any) => {
            if (ev.keyCode === 13 || ev.which === 13) {
                //只有按回车才能算编辑完成
                this.cellContent[rIndex][cIndex] = (input.elt as HTMLInputElement).value;
                this.editing = false;
                input.hide()
                // (input.elt as HTMLInputElement).blur();
            }
        };
        window.setTimeout(() => {
            input.show()
            input.elt.focus();
            (input.elt as HTMLInputElement).onblur = () => {
                this.editing = false;
                input.hide()
            };
        }, 100)


        input.value(this.cellContent[rIndex][cIndex]);
        (input.elt as HTMLInputElement).select()
        input.show()
        input.elt.focus();

        let lt = this.leftTopOfCell(rIndex, cIndex);
        input.position(lt.x + this.cellWidth / 2 - Math.floor((input.size() as any).width / 2), lt.y + this.cellHeight + 2)

    }

    cancelSelect() {
        super.cancelSelect();
        this.innerSelected = null;
    }
    //判定选中 return 该 pos上是否成功选中
    selectCell(mousePos: Vector) {
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;
        this.board.elements.forEach((ele) => {
            ele.cancelSelect();
        })
        //否则选中的是当前 cell
        this.innerSelected = {
            kind: "cell",
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        return true;
    }

    //判定能否开始拖拽
    drag(mousePos: Vector) {
        if (!this.posDraggable(mousePos)) return false;
        return true;
    }
    moveSelected(key: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') {
        if (this.editing) return false;
        if (!this.innerSelected || this.innerSelected.kind !== 'cell') return false;


        switch (key) {
            case 'up':
                this.innerSelected.rowIndex = Math.max(this.innerSelected.rowIndex - 1, 0);
                break;
            case 'down':
            case 'enter':
                // this.cellContentInput[this.innerSelected.rowIndex][this.innerSelected.colIndex].elt.blur();
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
        // if (this.posAnchor(mousePos)) return false;
        let c = 6;
        return (Math.abs(mousePos.x - this.leftTop.x) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.x - this.leftTop.x - this.width) <= c && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c)
            || (Math.abs(mousePos.y - this.leftTop.y) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)
            || (Math.abs(mousePos.y - this.leftTop.y - this.height) <= c && mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c)
    }

    // private posAnchor(mousePos: Vector): boolean {
    //     if (Math.abs(mousePos.x - this.leftTop.x) <= 6 && Math.abs(mousePos.y - this.leftTop.y) <= 6) {
    //         return true;
    //     }
    //     return false;
    // }

    posWithin(mousePos: Vector) {
        let c = this.cellWidth / 2;
        let mainArea = (mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c + (this.mouseWithin ? this.cellWidth : 0) && mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c + (this.mouseWithin ? this.cellHeight : 0))
        return mainArea
        // || this.addtionArea.posHovering(mousePos);
    }
    pressTime: number = 0;
    pressTimeoutID: number

    mousePress(pressPos: Vector) {
        if (!this.mouseWithin) return false;

        // if (this.pressTime == 1) {
        //     clearTimeout(this.pressTimeoutID)
        //     this.doubleClick(pressPos)
        //     this.pressTime = 0;
        // } else {
        //     this.pressTime++;
        //     this.pressTimeoutID = window.setTimeout(() => {
        //         this.pressTime=0;

        //     }, 150)
        // }

        if (super.mousePress(pressPos)) return true;
        //选择列
        if (this.posSelectColumn(pressPos) !== null) {
            this.innerSelected = {
                kind: 'column',
                colIndex: this.posSelectColumn(pressPos)
            }
            this.selected = false;
            return true;
        }
        //选择行
        if (this.posSelectRow(pressPos) !== null) {
            this.innerSelected = {
                kind: 'row',
                rowIndex: this.posSelectRow(pressPos)
            }
            this.selected = false;
            return true;
        }
        if (this.posAddColumn(pressPos)) {
            for (let index = 0; index < this.cellContent.length; index++) {
                const row = this.cellContent[index];
                row.push('');
                // row.length++;
            }
            this.colNum++;
            return true;
        }
        if (this.posAddRow(pressPos)) {
            let newRow = new Array<string>();
            newRow.length = this.colNum;
            newRow.fill('');
            this.cellContent.push(newRow);
            this.rowNum++;
            return true;
        }




        // if (this.addtionArea.posHovering(mousePos)) {
        //     this.addtionArea.click(mousePos);
        //     return true;
        // }
        // for (let i = 0; i < this.rowNum; i++) {
        //     for (let j = 0; j < this.colNum; j++) {
        //         if (this.pointersByCell[i][j].some((pointer: LBTable.Array2DPointer, index: number) => {
        //             if (pointer.posHovering(mousePos)) {
        //                 pointer.click(mousePos);
        //                 return true;
        //             }
        //         }))
        //             return true;

        //     }
        // }

        return this.selectCell(pressPos);
        return true;

    }
    doubleClick(mousePos: Vector) {
        if (!this.posWithin(mousePos)) return false;
        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;

        this.edit(rIndex, cIndex)
        return true;
    }

    keyPressed(keyCode: number) {

        switch (keyCode) {
            //暂时回车和 down 做一样处理
            case 40://arrow down 
                return this.moveSelected('down')
            case 39://arrow right
                return this.moveSelected('right')
            case 38://arrow up
                return this.moveSelected('up')
            case 37://arrow left
                return this.moveSelected('left')
            case 13://arrow enter
                return this.moveSelected('enter')
            case 9://arrow left
                return this.moveSelected('tab')
            case 8://backspace
                if (this.innerSelected && this.innerSelected.kind == 'column') {
                    this.colNum--;
                    for (let index = 0; index < this.cellContent.length; index++) {
                        const row = this.cellContent[index];
                        row.splice(this.innerSelected.colIndex, 1)
                        // row.length--; 
                    }
                }
                if (this.innerSelected && this.innerSelected.kind == 'row') {
                    this.cellContent.splice(this.innerSelected.rowIndex, 1)
                    this.rowNum--;
                }
            default:
                return false;
                break;
            //   }
            // }
        }

    }

    // onDelete() {
    //     for (let i = 0; i < this.rowNum; i++) {
    //         for (let j = 0; j < this.colNum; j++) {
    //             this.cellContentInput[i][j].remove();
    //         }
    //     }
    // }

}
// export namespace LBTable {
//     //到底是 Array2d 持有 pointers，每个 pointer 都是Array2DPointer， 还是 Array2d持有Array2dPointers,Array2dPointers 持有 pointers
//     export class Array2DPointer extends BoardDataElement {
//         posDraggable(pos: Vector): boolean {
//             return false
//         }
//         inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
//             return false;
//         }

//         posHovering(pos: Vector) {
//             let rIndex = Math.floor((pos.y - this.array2D.leftTop.y) / this.array2D.cellHeight);
//             let cIndex = Math.floor((pos.x - this.array2D.leftTop.x) / this.array2D.cellWidth);
//             if (rIndex < 0 || rIndex >= this.array2D.rowNum || cIndex < 0 || cIndex >= this.array2D.colNum) return false;
//             if (rIndex !== this.rowIndex || cIndex !== this.colIndex) return false;
//             let assumeIndex = (pos.y - this.array2D.leftTopOfCell(rIndex, cIndex).y) / (this.height + 2);
//             return assumeIndex == this.array2D.pointersByCell[rIndex][cIndex].indexOf(this);
//             // for (let i = 0; i <= this.array2D.rowNum; i++) {
//             //     for (let j = 0; j <= this.array2D.colNum; j++) {
//             //         this.array2D.pointersByCell[i][j].some((pointer: Array2D.Array2DPointer, index: number) => {
//             //             if (pointer == this) return true;
//             //             if (pointer.rowIndex == this.rowIndex && pointer.colIndex == this.colIndex)
//             //                 count++;
//             //         })
//             //     }
//             // }

//         }
//         click(clickPos: Vector): boolean {
//             // if(this.posClickable(clickPos))
//             // this.array2D.pointers.some((pointer) => {
//             //     if (pointer.select(mousePos, rIndex, cIndex)) {
//             //         pointerSelected = true;
//             //         this.selected = pointer;
//             //         return true;
//             //     }
//             // })
//             if (!this.hovering) return false;
//             this.array2D.innerSelected = this;
//             // for (let i = 0; i <= this.array2D.rowNum; i++) {
//             //     for (let j = 0; j <= this.array2D.colNum; j++) {
//             //         this.array2D.pointersByCell[i][j].forEach((pointer) => {
//             //             if (pointer == this.array2D.innerSelected)
//             //             pointer.selected = true;A
//             //             else
//             //                 pointer.selected = false;
//             //         })
//             //     }
//             // }
//             return true;
//         }

//         // array2D:Array2D;
//         // rowIndex: any;
//         // colIndex: any;
//         // selected=false;
//         height: number;
//         color: any;
//         constructor(board: typeof BoardData, pos: Vector, private array2D: LBTable, private rowIndex: number, private colIndex: number, color: any) {
//             super(board, pos);
//             this.color = color;
//             this.height = this.array2D.cellHeight / 3 - 2;
//         }
//         draw() {
//             this.selected = this.array2D.innerSelected == this;
//             let index = this.array2D.pointersByCell[this.rowIndex][this.colIndex].indexOf(this);
//             let cellLeftTop = this.array2D.leftTopOfCell(this.rowIndex, this.colIndex);
//             this.pInst.push();
//             if (this.selected) {
//                 this.pInst.strokeWeight(1.5);
//             } else {
//                 this.pInst.strokeWeight(0);
//             }
//             this.pInst.stroke(accent_color);
//             this.pInst.fill(this.color);
//             this.pInst.rect(cellLeftTop.x + 2, 2 + cellLeftTop.y + index * (this.height + 1), this.array2D.cellWidth - 4, this.height);
//             this.pInst.pop();
//         }
//     }
//     //二维表格右边的一个一列，矩形区域
//     export class Array2DAdditionArea extends BoardDataElement {
//         posDraggable(pos: Vector): boolean {
//             return false;
//         }
//         inSelectionBox(leftTop: Vector, rightBottom: Vector): boolean {
//             return false;
//         }
//         width = 60;
//         height: number;
//         hide() {
//             this.hidden = true;
//         }
//         show(): void {
//             this.hidden = false;
//         }

//         posHovering(mousePos: Vector): boolean {
//             let tempx = mousePos.x - this.array2D.leftTop.x - this.array2D.width;
//             let tempy = mousePos.y - this.array2D.leftTop.y;
//             if (tempx >= 0 && tempx <= this.width && tempy >= 0 && tempy <= this.height) {
//                 return true
//             }
//             return false;
//         }
//         xLHAOffset = 16;
//         hidden = true;
//         constructor(board: typeof BoardData, pos: Vector, private array2D: LBTable) {
//             super(board, pos);
//             this.height = this.array2D.height;
//         }
//         click(mousePos: Vector): boolean {
//             let index = this.posClickable(mousePos);
//             if (index == 1) {
//                 // this.longtimeHover=false;
//                 if (this.array2D.pointersByCell.length == 0)
//                     this.array2D.pointersByCell[0][0].push(new LBTable.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_red))
//                 else if (this.array2D.pointersByCell.length == 1)
//                     this.array2D.pointersByCell[0][0].push(new LBTable.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_green))
//                 else if (this.array2D.pointersByCell.length == 2)
//                     this.array2D.pointersByCell[0][0].push(new LBTable.Array2DPointer(this.board, null, this.array2D, 0, 0, md500_amber))
//                 this.array2D.pointersCount++;
//             }
//             return true;
//             // if(this.posClickable(this.board.mousePos))
//         }
//         hover(mousePos: Vector): boolean {
//             if (this.posHovering(mousePos)) {
//                 if (this.posClickable(mousePos)) this.pInst.cursor(this.pInst.HAND);
//                 return true;
//             }
//             return false
//         }
//         private posClickable(mousePos: Vector) {
//             let tempx = mousePos.x - this.array2D.leftTop.x - this.array2D.width - this.xLHAOffset;
//             let tempy = mousePos.y - this.array2D.leftTop.y
//             let index: number;
//             if (tempx >= 0 && tempx <= 30 && tempy >= 0 && tempy <= 40)
//                 index = 1;
//             return index;
//         }

//         draw(): void {
//             if (!this.hidden) {
//                 let xOffset = this.xLHAOffset;
//                 let w = 25;
//                 let h = 25;
//                 let hh = 12;
//                 this.pInst.push()
//                 this.pInst.stroke(24, 24, 24);
//                 this.pInst.fill(255, 0, 0);

//                 this.pInst.beginShape();
//                 this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset, this.array2D.leftTop.y);
//                 this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w, this.array2D.leftTop.y);
//                 this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w, this.array2D.leftTop.y + h);
//                 this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset + w / 2, this.array2D.leftTop.y + h + hh);
//                 this.pInst.vertex(this.array2D.leftTop.x + this.array2D.width + xOffset, this.array2D.leftTop.y + h);
//                 this.pInst.endShape(this.pInst.CLOSE);
//                 this.pInst.fill(255, 255, 255);
//                 let cx = this.array2D.leftTop.x + this.array2D.width + xOffset + w - 4;
//                 let cy = this.array2D.leftTop.y + h + hh / 2;
//                 let r = 8
//                 let l = 5
//                 this.pInst.ellipse(cx, cy, 2 * r, 2 * r);
//                 this.pInst.line(cx - l, cy, cx + l, cy);
//                 this.pInst.line(cx, cy - l, cx, cy + l);
//                 this.pInst.pop()
//             }
//             {
//                 this.pInst.push()
//                 this.pInst.stroke(24, 24, 24);
//                 this.pInst.fill(accent_color);
//                 this.pInst.ellipse(this.array2D.leftTop.x, this.array2D.leftTop.y, 8, 8);
//                 this.pInst.pop()
//             }
//         }
//     }
// }
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
        this.pInst.beginShape();
        for (let i = 0; i < this.stamps.length; i++) {
            // const stamp = this.stamps[i];
            // const lastStamp = this.stamps[i - 1];
            // this.pInst.line(lastStamp.x, lastStamp.y, stamp.x, stamp.y);
            this.pInst.curveVertex(this.stamps[i].x, this.stamps[i].y);
        }
        this.pInst.endShape();
        this.pInst.pop();
    }
    //如果正在画
    // onScribbling(anchor: any, mousePos: any) {

    // }
}
export class Ellipse extends BoardScribbleElement {
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
    static topTriangleSideLength = 6;
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
        let vector1 = vAxis.copy().rotate(90).setMag(0.4);
        let vector2 = vAxis.copy().rotate(90).setMag(1.5);
        let vector3 = vAxis.copy().rotate(90).setMag(4);

        let v1 = this.trapezoidBottomMidpoint.copy().add(vector1);
        let v2 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(5))).add(vector2);
        let v3 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(6))).add(vector3);
        let v4 = this.thePoint;
        let v5 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(6))).add(vector3.rotate(180));
        let v6 = this.trapezoidBottomMidpoint.copy().add(vAxis.copy().sub(vAxis.copy().setMag(5))).add(vector2.rotate(180));
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