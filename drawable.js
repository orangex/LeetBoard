

class NodeGroup {
    nodes = [];
    position;//取中点
    maxRadius = 0;//平均值？
    particle;
    uiState;
    // get position() {

    //     return this.particle.position;
    // };
    constructor(nodes) {
        this.position = this.pInst.createVector(0, 0);

        this.addNodes(nodes);
        this.particle = new Particle();
    }
    moveTo(pos) {
        let sub = p5.Vector.sub(pos, this.position);
        this.move(sub);
    }
    move(vector) {
        this.position.add(vector);
        this.nodes.forEach((node) => {
            node.move(vector);
        })
    }
    addForce(forceVector) {
        this.particle.acceleration.add(forceVector);
    }
    addNodes(nodes) {

        this.nodes = this.nodes.concat(nodes);
        nodes.forEach(node => {
            node.groupBelong = this;
            this.position.add(node.position);

        });
        if (nodes.length == this.nodes.length)
            this.position.setMag(this.position.mag() / (nodes.length));
        else
            this.position.setMag(this.position.mag() / (nodes.length + 1));

        nodes.forEach(node => {
            this.maxRadius += p5.Vector.dist(node.position, this.position) + node.maxRadius;
        });
        if (nodes.length == this.nodes.length)
            this.maxRadius /= (nodes.length);
        else
            this.maxRadius /= (nodes.length + 1);
    }
}

function textwidth(fontsize, text) {
    this.pInst.push();
    this.pInst.textSize(fontsize);
    let contentWidth = this.pInst.textWidth(text);
    this.pInst.pop();
    return contentWidth;
}

class Node {
    static titleSize = 20;
    id;
    // type;
    shape;
    titleInput;
    titleContent;
    groupBelong;
    // children = [];
    linkmap = new Map();
    get maxRadius() {
        return this.shape.maxRadius;
    }
    particle;
    position;

    scale;
    selected = false;
    //或者 dragging
    hovering;
    editing = false;

    get isSelected() {
        return this.selected;
    }

    recoverTitleInput(title) {
        let input = this.pInst.createInput();
        input.class('in-Sketch-Main');
        input.value(title);
        input.size(textwidth(Node.titleSize, title));
        input.attribute('disabled', 'true');
        input.style('outline', 'none');
        input.style('border', 'none');
        input.style('backgroundColor', 'transparent');
        input.style('font-size', '20px');
        input.attribute('maxLength', '20');
        // input.elt.style.width='AUTO';

        // input.size(p5.AUTO);
        // input.elt.styleborderWidth="1px"
        input.elt.onkeypress = function (e) {
            if (e.keyCode === 13) {
                input.elt.blur();
            }
            // input.size(myp5.textWidth(input.value()+'mm'));
        };
        input.elt.addEventListener("focusout", () => {
            input.elt.disabled = true;
            this.editing = false;
            lastTitle = input.value();
            this.titleContent = input.value();
            // this.selected=null;
            //             elementEditing = null;
        });
        // input.input(() => {
        //     let contentWidth = myp5.textWidth(input.value());
        //     input.size(Math.min(contentWidth, this.cellWidth - 8));
        // })
        input.elt.addEventListener("input", () => {
            let contentWidth = textwidth(Node.titleSize, input.value());
            contentWidth = Math.min(contentWidth, this.shape.maxRadius * 2 - 4);
            contentWidth = Math.max(contentWidth, 2);
            input.size(contentWidth);

        });
        this.titleInput = input;
    }
    constructor(pos, title) {
        this.id = lastElementID++;
        this.position = pos;
        this.particle = new Particle();
        this.shape = new Shape();
        this.titleContent = title;
        this.onRecover();

    }
    addForce(forceVector) {
        this.particle.acceleration.add(forceVector);
    }
    checkHover(mousePos) {

        let b = this.shape.checkHover(mousePos, this.position);

        if (b && this.isDraggable(mousePos)) {
            this.pInst.cursor(this.pInst.MOVE);
        }
        this.hovering = b;
        return b;
    }
    moveTo(pos) {
        this.position = pos.copy();
    }
    move(velocity) {
        this.position.add(velocity);
    }
    draw() {
        this.pInst.randomSeed(this.id);
        switch (this.shape.type) {
            case 'scribble_circle':
                if (this.selected) {
                    this.pInst.push();
                    this.pInst.stroke(0, 0, 0);
                    this.pInst.strokeWeight(3.5);
                    this.pInst.ellipse(this.position.x, this.position.y, (this.shape.radius + 1) * 2, (this.shape.radius + 1) * 2);
                    // scribble.scribbleEllipse();
                    this.pInst.pop();
                } else {
                    this.pInst.push();
                    this.pInst.stroke(108, 108, 108);
                    this.pInst.strokeWeight(1.25);
                    this.pInst.ellipse(this.position.x, this.position.y, this.shape.radius * 2, this.shape.radius * 2);
                    this.pInst.pop();
                }

                // if (this.selected) {
                //     this.pInst.push();
                //     this.pInst.stroke(255, 0, 0);
                //     this.pInst.strokeWeight(1.5);
                //     scribble.scribbleFillingCircle(this.position.x, this.position.y, this.shape.radius - 2, 2, 60);
                //     this.pInst.pop();
                // }
                //                 this.pInst.push();
                //                 this.pInst.strokeWeight(1.5);
                //                 // this.pInst.text(this.content, this.position.x - (this.pInst.textWidth(this.content) / 2), this.position.y + ((this.pInst.textAscent() + this.pInst.textDescent()) / 4));
                //                 this.pInst.text(this.content, this.position.x, this.position.y);
                //                 this.pInst.pop();

                this.titleInput.position(Math.floor(this.position.x - this.titleInput.size().width / 2), this.position.y - this.titleInput.size().height / 2);
                break;
            default:
                break;
        }
    }
    setScale(s) {
        this.scale = s;
    }

    //isPosSelectable
    isSelectable(mousePos) {
        if (p5.Vector.dist(mousePos, this.position) <= this.shape.radius * 0.75) return true;
        return false;
    }
    // select(mousePos) {
    //     this.selected = !this.selected;
    //     //返回选后的状态
    //     return this.selected;
    // }
    // cancelSelect() {
    //     this.selected = false;
    // }   //Draggable=Hover-Selectable
    isDraggable(mousePos) {
        return !this.isSelectable(mousePos);
    }
    drag(mousePos) {

    }
    click(mousePos) {
        if (this.isSelectable(mousePos)) {
            this.selected = !this.selected;
            //todo 在此访问全局 or 上层自己维护
            // elementsSelected.
        } else {

        }
    }
    doubleClick(mousePos) {
        if (this.isEditable(mousePos)) {
            this.edit()
            //todo 在此访问全局 or 上层自己维护
            // elementsSelected.
        } else {

        }
    }
    isEditable(mousePos) {
        return true;
    }
    edit() {
        if (!this.editing) {
            this.editing = true;
            let input = this.titleInput;
            input.elt.disabled = false;
            input.elt.focus();
            input.elt.select();
        }
        // input.elt.selectionStart = 0;
        // input.elt.selectionEnd = input.value().length;
    }

    onDelete() {
        this.titleInput.remove();
    }
    onRecover() {
        this.recoverTitleInput(this.titleContent);
    }
}
class Link {
    id;
    start;//可以是个 node 也可以是个坐标
    end;//实际上 link 具有方向，start 与 end 是等价的。
    shape; /*   'linkshape_straight' , */
    directionTo;// 指向
    hover;
    uiState;
    title;

    get startV() {
        let startV, endV;
        if (this.start instanceof Node) {
            startV = this.start.position.copy();
        } else {
            startV = this.start.copy();
        }

        if (this.end instanceof Node) {
            endV = this.end.position.copy();
        } else {
            endV = this.end.copy();
        }

        if (this.start instanceof Node) {
            startV.add(p5.Vector.sub(endV, startV).setMag(this.start.maxRadius + 1));
        }

        if (this.end instanceof Node) {
            endV.add(p5.Vector.sub(startV, endV).setMag(this.end.maxRadius + 1));
        }
        return startV;
    }
    get endV() {
        let startV, endV;
        if (this.start instanceof Node) {
            startV = this.start.position.copy();
        } else {
            startV = this.start.copy();
        }

        if (this.end instanceof Node) {
            endV = this.end.position.copy();
        } else {
            endV = this.end.copy();
        }

        if (this.start instanceof Node) {
            startV.add(p5.Vector.sub(endV, startV).setMag(this.start.maxRadius + 1));
        }

        if (this.end instanceof Node) {
            endV.add(p5.Vector.sub(startV, endV).setMag(this.end.maxRadius + 1));
        }
        return endV;
    }
    constructor(id, start, end, directionTo) {

        this.id = id;

        this.start = start;
        this.end = end;

        this.shape = 'linkshape_straight';
        this.uiState = {
            hover: false,
            selected: false,
            pressed: false,
        }
        this.title = '';
        this.directionTo = directionTo;
    }
    draw() {
        // myp5.randomSeed(this.id);

        this.pInst.push();
        this.pInst.stroke('black');
        this.pInst.strokeWeight(3);
        this.pInst.fill('black');
        let startV, endV;
        //shape.draw();

        if (!(this.end instanceof Node) || this.directionTo == this.end)
            this.pInst.drawArrow(this.startV, p5.Vector.sub(this.endV, this.startV));
        else if (!(this.start instanceof Node) || this.directionTo == this.start)
            this.pInst.drawArrow(this.endV, p5.Vector.sub(this.startV, this.endV));
        else
            this.pInst.line(this.startV.x, this.startV.y, this.endV.x, this.endV.y);


        this.pInst.pop();

        let normalV = p5.Vector.sub(this.endV, this.startV).rotate(90).setMag(10);
        if (normalV.x < 0)
            normalV.rotate(180);
        //link 的中点+法向量=输入框的位置
        let temp = p5.Vector.add(this.startV, this.endV);
        let posV = temp.setMag(temp.mag() / 2).add(normalV);
        this.pInst.text(this.title, posV.x, posV.y);
    }
    checkHover(pos) {
        // return false;
        let a = p5.Vector.sub(this.endV, this.startV);
        let b = p5.Vector.sub(pos, this.startV);
        return p5.Vector.cross(a, b).mag() / a.mag() < 2;
    }
    click(mousePos) {

    }
    nextDirection() {
        if (this.directionTo)
            if (this.directionTo == this.end)
                this.directionTo = null;
            else
                this.directionTo = this.end;
        else
            this.directionTo = this.start;


        // //两端必须是 Node 而不是坐标 才允许更改 link 方向
        // if (!this.start instanceof Node || !this.end instanceof Node) return;
        // //改变 link 方向的同时更新邻接表
        // switch (this.directionTo) {
        //     case 0:
        //         if (this.start.children.indexOf(this.end) < 0) this.start.children.push(this.end);
        //         this.end.children.filter((child) => {
        //             return child != this.start;
        //         })
        //         break;
        //     case 1:
        //         if (this.start.children.indexOf(this.end) < 0) this.start.children.push(this.end);
        //         if (this.end.children.indexOf(this.start) < 0) this.end.children.push(this.start);
        //         break;
        //     case 2:
        //         this.start.children.filter((child) => {
        //             return child != this.end;
        //         })
        //         if (this.end.children.indexOf(this.start) < 0) this.end.children.push(this.start);
        //         break;
        //     default:
        //         break;
        // }
    }
}
class Shape {
    /*   shapes:
        'scribble_circle'
        'scribble_rect'
         */
    type;
    createAsScribbleCircle() {
        this.type = 'scribble_circle';
        this.radius = 20;
    }

    constructor(type) {
        if (type) {
            this.type = type;
        } else
            this.createAsScribbleCircle();
    }
    checkHover(mousePos, pos) {
        switch (this.type) {
            case 'scribble_circle':
                return p5.Vector.dist(mousePos, pos) < this.radius + 8;
                break;
            default:
                return false;
        }
    }
    get maxRadius() {
        switch (this.type) {
            case 'scribble_circle':
                return this.radius;
                break;
            default:
                return 20;
                break;
        }
    }
}
class Array2DPointer {
    pInst;
    array2D;
    rowIndex;
    colIndex;
    // selected=false;
    height;
    color;
    constructor(pInst, array2D, rowIndex, colIndex, color) {
        this.pInst = pInst;
        this.array2D = array2D;
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.color = color;
        this.height = this.array2D.cellHeight / 3 - 2;
    }
    select(mousePos, rIndex, cIndex) {


        if (this.rowIndex !== rIndex || this.colIndex !== cIndex) return false;
        //同格内按次序往下垒
        let count = 0;
        this.array2D.pointers.some((pointer) => {
            if (pointer == this) return true;
            if (pointer.rowIndex == this.rowIndex && pointer.colIndex == this.colIndex)
                count++;
        })


        let cellLeftTop = this.array2D.leftTopOfCell(rIndex, cIndex);
        if ((mousePos.y - cellLeftTop.y) >= count * this.height && (mousePos.y - cellLeftTop.y) <= (count + 1) * this.height) {
            return true;
        }
        return false;
    }
    draw() {
        let count = 0;
        this.array2D.pointers.some((pointer) => {
            if (pointer == this) return true;
            if (pointer.rowIndex == this.rowIndex && pointer.colIndex == this.colIndex)
                count++;
        })
        let cellLeftTop = this.array2D.leftTopOfCell(this.rowIndex, this.colIndex);
        this.pInst.push();
        if (this.array2D.selected == this) {
            this.pInst.strokeWeight(1.5);
        } else {
            this.pInst.strokeWeight(0);
        }

        this.pInst.stroke(accent_color);
        this.pInst.fill(this.color);
        this.pInst.rect(cellLeftTop.x + 2, 2 + cellLeftTop.y + count * (this.height + 1), this.array2D.cellWidth - 4, this.height);

        this.pInst.pop();
    }
}
class Array2D {
    pInst;
    //行号列号是绘制的结果，数据以 content[0][0]为左上定点。
    pointers = [];
    cellWidth = 60;
    cellHeight = 60;
    xLHAOffset = 16;
    rowNum;
    colNum;
    content = [];
    groupBelong;
    // children = [];
    get maxRadius() {
        return Math.max(this.height, this.width) / 2;
    }
    particle;
    position;
    // uiState;

    editing;//true or false
    selected;//pointer、{rindex,cindex}、this
    hoverring = false;

    colTitle;
    rowTitle;

    draggable = false;
    selectable = false;

    longtimeHover = false;
    longHoverTimeoutID;
    get width() {
        return this.colNum * this.cellWidth;
    }
    get height() {
        return this.rowNum * this.cellHeight;
    }
    get leftTop() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
        }
    }
    leftTopOfCell(row, col) {
        return {
            x: this.leftTop.x + col * this.cellWidth,
            y: this.leftTop.y + row * this.cellHeight,
        }
    }

    get isSelected() {
        return this.selected;
    }
    constructor(pInst, mousePos, rowNum, colNum) {
        this.pInst = pInst;
        this.rowNum = rowNum;
        this.colNum = colNum;
        //         this.id = lastElementID++;
        this.position = this.pInst.createVector(mousePos.x + this.width / 2, mousePos.y + this.height / 2);
        for (let i = 0; i < rowNum; i++) {
            let currRowContent = [];
            for (let j = 0; j < colNum; j++) {

                // let input = this.pInst.createInput();
                let input = this.pInst.createDiv();
                input.attribute('contenteditable', 'true');
                input.attribute('spellcheck', 'false');

                // input.class('in-Sketch-Main');
                input.value('  ');
                input.style('max-width', `${this.cellWidth - 4}px`);
                input.style('min-width', `2px`);
                input.style('min-height', `20px`);
                input.style('max-height', `${this.cellHeight - 4}px`);
                // input.style('padding-top',`4px`);
                // input.style('padding-bottom',`4px`);
                input.style('overflow', 'auto')
                // input.size(10);
                input.elt.disabled = true;
                input.elt.classList.add('transparentInput');
                // input.elt.maxLength = 20;
                // input.elt.style.width='AUTO';

                // input.size(p5.AUTO);
                // input.elt.styleborderWidth="1px"
                input.elt.onkeypress = function (e) {
                    if (e.keyCode === 13) {
                        input.elt.blur();
                    }
                    // input.size(myp5.textWidth(input.value()+'mm'));
                };

                input.elt.addEventListener("focusout", () => {
                    // input.elt.disabled = true;
                    input.attribute('contenteditable', 'false');
                    this.editing = false;
                    //                     elementEditing = null;
                });
                // input.input(() => {
                //     let contentWidth = myp5.textWidth(input.value());
                //     input.size(Math.min(contentWidth, this.cellWidth - 8));
                // })
                //input自动拓宽
                // input.elt.addEventListener("input", () => {
                //     let contentWidth = this.pInst.textWidth(input.value());
                //     contentWidth = Math.min(contentWidth, this.cellWidth - 8);
                //     contentWidth = Math.max(contentWidth, 2);
                //     input.size(contentWidth);
                // });

                currRowContent.push(input);
            }
            this.content.push(currRowContent);
        }
        this.particle = new Particle();

        // this.colTitle = myp5.createInput();
        // this.rowTitle = myp5.createInput();
        this.title = this.pInst.createInput();
        this.title.value('');
        this.title.size(80);
        // this.title.elt.disabled = true;
        this.title.elt.style.outline = 'none';
        this.title.style('border', 'none');
        this.title.style('font-size', '18px');
        this.title.elt.style.backgroundColor = 'transparent';
        this.title.elt.maxLength = 20;
        this.title.elt.placeholder = '未命名';
        this.title.elt.addEventListener("input", () => {
            // this.title.elt.style.size=this.title.value().length;
            this.pInst.push();
            this.pInst.textSize(18);
            let contentWidth = this.pInst.textWidth(this.title.value());
            // input.size()
            contentWidth = Math.min(contentWidth, this.width - 12);
            if (contentWidth == 0) contentWidth = 80;
            // contentWidth=Math.max(contentWidth, 2);// TODO 容纳 placeholer 的最小宽度
            this.title.size(contentWidth);
            this.pInst.pop();
        });
        this.title.elt.onkeypress = function (e) {
            if (e.keyCode === 13) {
                this.blur();
            }
            // input.size(myp5.textWidth(input.value()+'mm'));
        };
        //取巧的做法，不想让这个 input 被纳入到 select-edit 规则中
        this.title.elt.addEventListener("focus", () => {
            // elementSelected = null;
            // this.selected=null;
            this.editing = true;
        });
        this.title.elt.addEventListener("focusout", () => {
            // elementSelected = null;
            // this.selected=null;
            this.editing = false;
        });

    }
    addForce(forceVector) {
        this.particle.acceleration.add(forceVector);
    }


    //checkhover 时顺带改变指针样式
    checkHover(mousePos) {
        let hover = false;
        //当悬停区域出现后，判定该对象的悬停需要加入新的区域
        if (this.longtimeHover) hover |= this.checkLongTimeHoverAreaHover(mousePos);
        //取巧 hover=selectable+draggable
      
        if (this.isSelectable(mousePos)) {
            hover = true;
        } else if (this.isDraggable(mousePos)) {
            if(!this.isAnchor(mousePos))
                this.pInst.cursor(this.pInst.MOVE);
            hover = true;
        }
        if (!this.hoverring && hover && this.pointers.length < 3)
            this.longHoverTimeoutID = setTimeout(() => this.longtimeHover = true, 1000);

        if (this.hoverring && !hover) {
            clearTimeout(this.longHoverTimeoutID);
        }

        if (!hover || this.pointers.length >= 3) this.longtimeHover = false;
        this.hoverring = hover;
        return hover;
    }
    moveTo(pos) {
        this.position = pos.copy();
    }
    move(velocity) {
        this.position.add(velocity);
    }
    draw() {
        this.pInst.randomSeed(this.id);
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
        this.pointers.forEach((pointer) => {
            pointer.draw();
        })
        //pointer的 selected 由它自己绘制
        if (this.selected && !(this.selected instanceof Array2DPointer)) {
            this.pInst.push();
            this.pInst.stroke(accent_color);
            this.pInst.strokeWeight(2.8);
            this.pInst.noFill();
            if (this.selected == this) {
                this.pInst.rect(this.leftTop.x, this.leftTop.y, this.width, this.height);
            } else {
                let cellLeftTop = this.leftTopOfCell(this.selected.rowIndex, this.selected.colIndex)
                // if (this.selected instanceof Array2DPointer) {
                // } else
 
                this.pInst.rect(cellLeftTop.x, cellLeftTop.y, this.cellWidth, this.cellHeight);

            }
            this.pInst.pop();

        }
        // if (this.editing) {

        //     myp5.push();
        //     myp5.stroke(0, 255, 0);
        //     myp5.strokeWeight(2);
        //     let cellLeft = this.leftTop.x + this.editing.colIndex * this.cellSize;
        //     let cellTop = this.leftTop.y + this.editing.rowIndex * this.cellSize

        //     myp5.rect(cellLeft, cellTop, this.cellSize, this.cellSize);
        //     myp5.pop();
        //     editingInput.position(cellLeft, cellTop + this.cellSize + 2);
        // }

        for (let i = 0; i < this.rowNum; i++)
            for (let j = 0; j < this.colNum; j++) {
                let input = this.content[i][j];
                let x = this.leftTop.x + j * this.cellWidth + this.cellWidth / 2;
                let y = this.leftTop.y + i * this.cellHeight + this.cellHeight / 2;
                // input.size(myp5.textWidth(input.value()));
                let xOffset = Math.floor(Math.min(input.size().width, this.cellWidth) / 2);
                let yOffset = Math.min(input.size().height, this.cellHeight) / 2;
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

        let titleX = this.leftTop.x + this.width / 2;
        let titleY = this.leftTop.y + this.height + 18;
        this.title.position(titleX - Math.floor(this.title.size().width / 2), titleY - this.title.size().height / 2);

        if (this.longtimeHover) {
            let xOffset = this.xLHAOffset;
            let w = 25;
            let h = 25;
            let hh = 12;
            this.pInst.push()
            this.pInst.stroke(24, 24, 24);
            this.pInst.fill(255, 0, 0);

            this.pInst.beginShape();
            this.pInst.vertex(this.leftTop.x + this.width + xOffset, this.leftTop.y);
            this.pInst.vertex(this.leftTop.x + this.width + xOffset + w, this.leftTop.y);
            this.pInst.vertex(this.leftTop.x + this.width + xOffset + w, this.leftTop.y + h);
            this.pInst.vertex(this.leftTop.x + this.width + xOffset + w / 2, this.leftTop.y + h + hh);
            this.pInst.vertex(this.leftTop.x + this.width + xOffset, this.leftTop.y + h);
            this.pInst.endShape(this.pInst.CLOSE);
            this.pInst.fill(255, 255, 255);
            let cx = this.leftTop.x + this.width + xOffset + w - 4;
            let cy = this.leftTop.y + h + hh / 2;
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
            this.pInst.ellipse(this.leftTop.x, this.leftTop.y, 8, 8);
            this.pInst.pop()
        }
        
    }
    setScale(s) {
        this.scale = s;
    }
    //进入编辑状态
    edit(mousePos) {

        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;
        this.selected = {
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        this.editing = true;
        let input = this.content[rIndex][cIndex];
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
    //判定选中
    select(mousePos) {
        // if (!this.isSelectable(mousePos)) return false;
        let pointerSelected = false;

        let rIndex = Math.floor((mousePos.y - this.leftTop.y) / this.cellHeight);
        let cIndex = Math.floor((mousePos.x - this.leftTop.x) / this.cellWidth);
        if (rIndex < 0 || rIndex >= this.rowNum || cIndex < 0 || cIndex >= this.colNum) return false;

        this.pointers.some((pointer) => {
            if (pointer.select(mousePos, rIndex, cIndex)) {
                pointerSelected = true;
                this.selected = pointer;
                return true;
            }
        })

        if (pointerSelected) {

            return true;
        }
        //否则选中的是当前 cell
        this.selected = {
            rowIndex: rIndex,
            colIndex: cIndex,
        }
        return true;
    }
    cancelSelect() {
        this.selected = null;
    }
    //判定能否开始拖拽
    drag(mousePos) {
        if (!this.isDraggable(mousePos)) return false;
        return true;
    }
    moveSelected(key) {
        if (!this.selected) return false;
        if (this.editing && key !== 'enter') {

            return false;
        }
        if (!(this.selected instanceof Array2DPointer)) {
            this.content[this.selected.rowIndex][this.selected.colIndex].elt.blur();
        }
        switch (key) {
            case 'up':
                this.selected.rowIndex = Math.max(this.selected.rowIndex - 1, 0);
                break;
            case 'down':
            case 'enter':
                this.content[this.selected.rowIndex][this.selected.colIndex].elt.blur();
                this.selected.rowIndex = Math.min(this.selected.rowIndex + 1, this.rowNum - 1);
                break;
            case 'left':
                this.selected.colIndex = Math.max(this.selected.colIndex - 1, 0);
                break;
            case 'right':
            case 'tab':
                this.selected.colIndex = Math.min(this.selected.colIndex + 1, this.colNum - 1);
                break;

            default:
                break;
        }
        return true;
    }

    isSelectable(mousePos) {
        if (this.isDraggable(mousePos)) return false;
        return (mousePos.x >= this.leftTop.x && mousePos.x <= this.leftTop.x + this.width && mousePos.y >= this.leftTop.y && mousePos.y <= this.leftTop.y + this.height);
    }
    isDraggable(mousePos) {
        let c = 6;
        return (((Math.abs(mousePos.x - this.leftTop.x) <= c || Math.abs(mousePos.x - this.leftTop.x - this.width) <= c) && (mousePos.y >= this.leftTop.y - c && mousePos.y <= this.leftTop.y + this.height + c))
            || ((Math.abs(mousePos.y - this.leftTop.y) <= c || Math.abs(mousePos.y - this.leftTop.y - this.height) <= c) && (mousePos.x >= this.leftTop.x - c && mousePos.x <= this.leftTop.x + this.width + c))
        );
    }
    checkLongTimeHoverAreaHover(mousePos) {
        let tempx = Math.abs(mousePos.x - this.leftTop.x - this.width);
        let tempy = Math.abs(mousePos.y - this.leftTop.y);
        if (tempx >= 0 && tempx <= 60 && tempy >= 0 && tempy <= this.height) {
            if (this.isLongtimeHoverAreaClickable(mousePos)) this.pInst.cursor(this.pInst.HAND);
            return true
        }
    }
    isAnchor(mousePos){
        if(Math.abs(mousePos.x-this.leftTop.x)<=6&&Math.abs(mousePos.y-this.leftTop.y)<=6){
            return true;
        }
        return false;
    }
    //return anchor、cell、LHA
    checkClick(mousePos){
        if(this.isAnchor(mousePos)){
            return 'anchor';
        }
        if(this.isSelectable(mousePos)){
            return 'cell'
        }
        if(this.longtimeHover &&this.isLongtimeHoverAreaClickable(mousePos)){
            return 'LHA'
        }
    }
    isLongtimeHoverAreaClickable(mousePos) {
        let tempx = mousePos.x - this.leftTop.x - this.width - this.xLHAOffset;
        let tempy = mousePos.y - this.leftTop.y
        if (tempx >= 0 && tempx <= 30 && tempy >= 0 && tempy <= 40) return 1;
    }

    click(mousePos) {
        //todo 整合一下，select 直接返回 isSelectable的结果。现在不能整合的原因是，改变指针样式时只需要判定 isxxxable 。
        switch (this.checkClick(mousePos)) {
            case 'anchor':
                if(this.selected!==this)
                    this.selected=this;
                else 
                    this.selected=null;
                break;
            case 'cell':
                this.select(mousePos);
                break;
            case 'LHA':
                this.clickLongtimeHoverArea(mousePos)
                break;
            default:
                break;
        }
    }
    doubleClick(mousePos) {
        this.edit(mousePos)
    }
    //

    clickLongtimeHoverArea(mousePos) {
        let tempx = mousePos.x - this.leftTop.x - this.width - this.xLHAOffset;
        let tempy = mousePos.y - this.leftTop.y
        let index;

        if (tempx >= 0 && tempx <= 30 && tempy >= 0 && tempy <= 40) 
            index= 1;
        if (index == 1) {
            // this.longtimeHover=false;
            if (this.pointers.length == 0)
                this.pointers.push(new Array2DPointer(this.pInst, this, 0, 0, md500_red))
            else if (this.pointers.length == 1)
                this.pointers.push(new Array2DPointer(this.pInst, this, 0, 0, md500_green))
            else if (this.pointers.length == 2)
                this.pointers.push(new Array2DPointer(this.pInst, this, 0, 0, md500_amber))
        }
    }
    onDelete() {

    }

}

class Line {
    pInst;
    endV1;
    endV2;
    strokecolor;
    strokeweight;
    constructor(pInst, endV1, endV2, strokecolor, strokeweight) {
        this.pInst = pInst;
        this.endV1 = endV1;
        this.endV2 = endV2;
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
        this.pInst.push();
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.line(this.endV1.x, this.endV1.y, this.endV2.x, this.endV2.y);
        this.pInst.pop();
    }
    //如果正在画
    onScribbling(anchor, mousePos) {
        this.endV1 = anchor
        this.endV2 = mousePos;
    }
}
class Rect {
    leftTop;
    width;
    height;
    constructor(leftTop, width, height, strokecolor, strokeweight) {
        this.leftTop = leftTop;
        this.width = width;
        this.height = height;
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
        this.pInst.push();
        this.pInst.noFill()
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.rect(this.leftTop.x, this.leftTop.y, this.width, this.height);
        this.pInst.pop();
    }
    //如果正在画
    onScribbling(anchor, mousePos) {
        this.leftTop.x = Math.min(anchor.x, mousePos.x);
        this.leftTop.y = Math.min(anchor.y, mousePos.y);
        let rightbottomx = Math.max(anchor.x, mousePos.x);
        let rightbottomy = Math.max(anchor.y, mousePos.y);
        this.width = rightbottomx - this.leftTop.x;
        this.height = rightbottomy - this.leftTop.y;
    }
}
class Path {
    stamps = [];
    leftTop;
    width;
    height;
    constructor(start, strokecolor, strokeweight) {
        this.stamps.push(start);
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
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
    onScribbling(anchor, mousePos) {
        this.stamps.push(mousePos);
    }
}
class Ellipse {
    center;
    width;
    height;
    constructor(center, width, height, strokecolor, strokeweight) {
        this.center = center;
        this.width = width;
        this.height = height;
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    draw() {
        this.pInst.push();
        this.pInst.noFill()
        this.pInst.stroke(this.strokecolor);
        this.pInst.strokeWeight(this.strokeweight);
        this.pInst.ellipse(this.center.x, this.center.y, this.width, this.height);
        this.pInst.pop();
    }
    //如果正在画
    onScribbling(anchor, mousePos) {
        let leftTopx = Math.min(anchor.x, mousePos.x);
        let leftTopy = Math.min(anchor.y, mousePos.y);
        let rightbottomx = Math.max(anchor.x, mousePos.x);
        let rightbottomy = Math.max(anchor.y, mousePos.y);
        this.width = rightbottomx - leftTopx;
        this.height = rightbottomy - leftTopy;

        this.center.x = (leftTopx + rightbottomx) / 2;
        this.center.y = (leftTopy + rightbottomy) / 2;
    }
}

class Arrow {
    static topTriangleSideLength = 20;
    trapezoidBottomMidpoint;//梯形底部中点
    thePoint;//箭头顶点
    trapezoidBottomWidth;
    trapezoidTopWidthWidth;
    constructor(trapezoidBottomMidpoint, thePoint, strokecolor, strokeweight) {
        this.trapezoidBottomMidpoint = trapezoidBottomMidpoint;
        this.thePoint = thePoint;
        this.strokecolor = strokecolor;
        this.strokeweight = strokeweight;
    }
    onScribbling(anchor, mousePos) {
        this.trapezoidBottomMidpoint = anchor;
        this.thePoint = mousePos;
    }
    draw() {
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

class TagLikedText {
    text;
    textarea;
    constructor(leftTop, color, weight) {

        this.textarea = p5Scribble.createDiv();
        this.textarea.attribute('contenteditable', 'true');
        this.textarea.html('')
        this.textarea.class('tagLikedTextarea');
        this.textarea.position(leftTop.x, leftTop.y)
        this.textarea.elt.focus();
        this.textarea.elt.select();

    }
    onScribbling(anchor, mousePos) {
        this.trapezoidBottomMidpoint = anchor;
        this.thePoint = mousePos;
    }
    draw() {


    }


}