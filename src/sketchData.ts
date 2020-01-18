import { MDCRipple } from '@material/ripple';
import p5 = require('p5');
import { BoardDataElement, LBLink, LBNode, Array2D, ConnnectedGraph } from './elements';
import { Vector } from 'p5';
import { modeScribbling } from '.';
// import  './iconfont'
export let actionStack = new Array<Function>();
export let lastNodeTitle: number | string
lastNodeTitle = -1;
// let elementGroups = [];
export let links = new Set<LBLink>();//link 的两端可以是 Node，也可以是坐标。
export let mousePos: Vector;
export let elementHovering: BoardDataElement;//node and link
export let linkScribbling: LBLink
// Array2D 只要
export let elementsSelected = new Set<BoardDataElement>();
export let mainDock: p5.Element;
export let mainSketch: p5.Element;
export let canvas: p5.Element;

//用来显示插入 cursor icon 的 Element
export let insertingSVG: p5.Element;
export let insertingUse: p5.Element;
export let mainSketchHolder: p5.Element;
export let elements = new Array<BoardDataElement>();//屏幕上所有能看到的元素就是 Node.(Node Group 也是 Node)
export let inserting: string;
//sketch 维护着业务需要的全局状态
const sketchData = (pInst: p5) => {

  function validateQuickInsert(text: string): boolean | Array<string> | string {
    //todo 二维数组
    let t = text.trim();
    if ((t.charAt(0) == '[') && (t.charAt(t.length - 1) == ']'))
      t = t.substring(1, t.length - 1);
    else
      return false;
    let result: Array<string>;
    try {
      result = t.split(',');
    } catch (error) {
      return false;
    }
    if (result.length >= 20) return '线性表长度不得超过20~'
    return result;
  }
  pInst.setup = function () {
    canvas = pInst.createCanvas(1000, 1000);
    canvas.style('position', 'absolute');
    canvas.class('in-Sketch-Main');

    initMainDock()
    insertingSVG = pInst.select('#insertingIcon');
    insertingUse = pInst.select('#insertingIconUse')


    mainSketchHolder = pInst.select('#mainSketchHolder')
    //click 事件发生在 press 和 Release 之后，有很多不便之处，所以我们用 press 事件代替
    // mainSketchHolder.mouseClicked(sketch_mouseClicked);
    mainSketchHolder.doubleClicked(sketch_doubleClicked);
    mainSketchHolder.mousePressed(sketch_mousePressed)
    mainSketchHolder.mouseReleased(sketch_mouseReleased)

    mainSketchHolder.elt.addEventListener('paste', (ev: ClipboardEvent) => {
      let paste = (ev.clipboardData || window.clipboardData).getData('text');
      let result = validateQuickInsert(paste);
      if (!result) return;
      if (result instanceof Array) {
        ev.preventDefault();
      }
    })

    mousePos = pInst.createVector(pInst.width / 2, pInst.height / 2);
    pInst.strokeWeight(1.2);
    pInst.stroke(0, 0, 0);
    pInst.angleMode(pInst.DEGREES);
    pInst.textAlign(pInst.CENTER, pInst.CENTER);

    //正在插入的元素类型

    mainDock.mouseClicked((ev: MouseEvent) => {
      let target = ev.target;
      let type = (target as Element).getAttribute('data-tooltype');
      switch (type) {
        case 'cancel':
          if (actionStack.length !== 0)
            actionStack.pop()();
          break;
        case 'insert2DArray':
        case 'insertNode':
          //如果正在 insert 与点选的 type 一致，则取消
          if (inserting == type) inserting = null;
          else inserting = type;
        default:
          break;
      }
    })
  }


  function initMainDock() {
    // mainDock = pInst.select('#maindock');
    // (new MDCRipple(document.querySelector('.mdc-icon-button'))).unbounded=true;
  }

  pInst.draw = function () {
    mousePos.set(pInst.mouseX, pInst.mouseY);
    pInst.cursor(pInst.ARROW);
    pInst.background(255, 255, 255);
    elementHovering = null;
    linkScribbling = null;
    //分发 mouseIn mouseOut 以及 hover 事件
    elements.forEach((ele) => {
      let mouseWithin = ele.posHovering(mousePos);
      if (mouseWithin && !ele.mouseWithin) ele.mouseIn()
      if (!mouseWithin && ele.mouseWithin) ele.mouseOut();
      if (mouseWithin) {
        elementHovering = ele;
        ele.hover(mousePos)
        // return true;
      }
    })
    linkScribbling = null;
    links.forEach((link) => {
      if (link.onScribbling) {
        linkScribbling = link;
      }
    })

    // maintain(mousePos);
    {
      if (inserting) {
        insertingSVG.style('visibility', 'visible')
        insertingSVG.position(mousePos.x, mousePos.y);
        switch (inserting) {
          case 'insert2DArray':
            insertingUse.attribute('href', '#iconshulie');
            break;
          default:
            break;
        }
      } else {
        insertingSVG.style('visibility', 'hidden')
      }
    }

    //需要根据用户输入维护一些交互有关的状态。
    //处于编辑激活的动画中
    // if (inEditingStartedAnimation) {
    //   helperAngle -= 24;
    //   if (helperAngle <= -90) helperAngle = 90;
    //   elementEditing.setScale(1 + pInst.cos(helperAngle) / 8);
    // } else
    //   helperAngle = 90;



    chargeforce();
    elements.forEach((node) => {
      node.draw();
    })
    links.forEach((link) => {
      link.draw();
    })
    if(selectionBoxAnchor){
      let lettTopx = Math.min(selectionBoxAnchor.x, pInst.mouseX);
      let leftTopy = Math.min(selectionBoxAnchor.y, pInst.mouseY)

      let rightbottomx = Math.max(selectionBoxAnchor.x, pInst.mouseX);
      let rightbottomy = Math.max(selectionBoxAnchor.y, pInst.mouseY);
      pInst.push()
      pInst.fill(173, 216, 230,128)
      pInst.stroke(173, 216, 230,0)
      pInst.rect(lettTopx,leftTopy,rightbottomx-lettTopx,rightbottomy-leftTopy)
      pInst.pop();
    }
    // system.run(elementGroups);
    // system.run(elements);
  }
  let longPressTimeID: number



  function sketch_longPressed() {
    elements.some((ele) => {
      return ele.longPressed(mousePos);
    })
  }
  function sketch_mousePressed() {
    sketch_mouseClicked();
    longPressTimeID = window.setTimeout(() => {
      sketch_longPressed()
    }, 300);
    if (!elements.some((ele) => {
      return (ele.mousePress(mousePos));
    })) {
      mousePressDefault(mousePos)
    }
  }
  let selectionBoxAnchor: Vector | null;
  function mousePressDefault(pressPos: Vector) {
    //框选矩形的基准点
    selectionBoxAnchor = pressPos.copy();
  }
  function mouseReleaseDefault(releasePos: Vector) {
    //如果再是有个 link 正在涂画，那就删掉它
    // if (linkConnecting) {
    //   linkConnecting.onScribbling = false
    //   links.splice(links.indexOf(linkConnecting),1)
    // }

    if (selectionBoxAnchor) {

      let lettTopx = Math.min(selectionBoxAnchor.x, pInst.mouseX);
      let leftTopy = Math.min(selectionBoxAnchor.y, pInst.mouseY)
      let lefttop = pInst.createVector(lettTopx, leftTopy)
      let rightbottomx = Math.max(selectionBoxAnchor.x, pInst.mouseX);
      let rightbottomy = Math.max(selectionBoxAnchor.y, pInst.mouseY);
      let rightbottom = pInst.createVector(rightbottomx, rightbottomy)
      elementsSelected.clear();
      elements.forEach((ele) => {
        if (ele.inSelectionBox(lefttop, rightbottom))
          elementsSelected.add(ele);
      })
      selectionBoxAnchor = null;

    }
    if (linkScribbling) {
      linkScribbling.onScribbling = false;
      links.delete(linkScribbling);
    }
    elements.forEach((ele) => {
      ele.dragging = null;
    })
  }
  function sketch_mouseReleased() {
    clearTimeout(longPressTimeID);

    //元素消不消费事件与 pos 是不是在元素里没有关系 ，因此所有元素都不消费事件也不意味着这个点就在所谓的”空白区“ ，仅仅是当做一个坐标 然后由 board 层处理
    if (!elements.some((ele) => {
      return ele.mouseRelease(mousePos)
    })) {
      mouseReleaseDefault(mousePos)
    }
  }

  function removeSelectedElements() {

    if (elementsSelected) {//
      elementsSelected.forEach((ele) => {
        remove(ele);
      })
      let temp = elementsSelected;
      actionStack.push(function () {
        temp.forEach((ele) => {
          recover(ele);
        })
        elementsSelected = temp;
      })
      elementsSelected.clear();
    }
  }
  function recover(ele: BoardDataElement) {
    // if (ele instanceof LBNode) {
    //   let linksNearby = ele.linkmap.values();
    //   //遍历所有邻边 ，将Node 自己从对点的 linkmap 中删去，并（从 links）删去 link。
    //   for (let linkNearby of linksNearby) {
    //     let op;
    //     if (linkNearby.start !== ele)
    //       op = linkNearby.start;
    //     else if (linkNearby.end !== ele)
    //       op = linkNearby.end;
    //     if (op)
    //       op.linkmap.set(ele, linkNearby);
    //     links.add(linkNearby);
    //   }
    //   //最后再（从 Nodes 中）删掉 Node 自己
    //   elements.push(ele);
    //   ele.onRecover();
    // }
  }
  function remove(ele: BoardDataElement) {
    // if (ele instanceof LBNode) {
    //   let linksNearby = ele.linkmap.values();
    //   //遍历所有邻边 ，将Node 自己从对点的 linkmap 中删去，并（从 links）删去 link。
    //   for (let linkNearby of linksNearby) {
    //     let op;
    //     if (linkNearby.start !== ele)
    //       op = linkNearby.start;
    //     else if (linkNearby.end !== ele)
    //       op = linkNearby.end;
    //     if (op)
    //       op.linkmap.delete(ele);
    //     links.delete(linkNearby);
    //   }
    //   //最后再（从 Nodes 中）删掉 Node 自己
    //   elements.splice(elements.indexOf(ele), 1);
    //   ele.onDelete();
    // }
  }

  pInst.keyPressed = function () {
    if (modeScribbling) return;
    //优先由全局处理的逻辑
    switch (pInst.key) {
      case 'n':
        if (!elementHovering) {
          console.log('\'n\' typed, node created');
          createNode(mousePos);
        }
        return
        break;
      case 'd':
        removeSelectedElements();
        return
        break;
      case '1':
        if (!elementHovering)
          insertBinarytree(mousePos);
        return
        break;
      case '2':
        if (!elementHovering)
          insert2DArray(mousePos.copy());
        return
        break;
      case 'e':
        //有元素被选中并且 elementEditing不是该选中的元素或者 elementEditing为空
        //         if (elementsSelected && elementEditing !== elementsSelected) {
        //           elementEditing = elementsSelected;
        //           elementsSelected.enableEditing();
        //           return false;
        //         }

        break;

      default:
        break;
    }
    //分发给元素去处理
    elements.some((ele) => {
      return ele.keyPressed(pInst.keyCode)
    })

  }

  let clickTimeId: number;
  function mouseClickDefault(clickPos: Vector) {
    elementsSelected.clear();
  }
  function sketch_mouseClicked() {
    // if(longPressTimeID)

    clearTimeout(clickTimeId);
    clickTimeId = window.setTimeout(() => {
      if (inserting) {
        switch (inserting) {
          case 'insert2DArray':
            insert2DArray(mousePos.copy());
            inserting = null;
            break;
          default:
            break;
        }
      } else if (elements.some((ele) => {
        return ele.click(mousePos);
      })) {
        return;
      } else
        mouseClickDefault(mousePos);

      //       if (elementHovered.isSelectable(mousePos)) {
      //         //选中再选中就会取消选中
      //         if (elementHovered.select(mousePos))
      //           elementsSelected.push(elementHovered);
      //         else
      //           elementsSelected.splice(elementsSelected.indexOf(elementHovered), 1);
      //       }
    }, 200);
  }


  function sketch_doubleClicked() {

    clearTimeout(clickTimeId);
    if (elements.some((ele) => {
      return ele.doubleClick(mousePos.copy())
    }))
      return;
    // elementHovering.doubleClick(mousePos.copy());


    return false;

  }
  //分发事件


  // function windowResized() {
  //   centerCanvas();
  // }
}


function insert2DArray(pos: Vector, rowNum?: number, colNum?: number) {
  if (rowNum && colNum)
    insert2DArrayWithSize(pos, rowNum, colNum);
  else
    insert2DArrayWithSize(pos, 3, 4);
}

function insert2DArrayWithSize(pos: Vector, rowNum: number, colNum: number) {
  let array2D = new Array2D(exports, pos, rowNum, colNum);
  elements.push(array2D);
  // elementGroups.push(array2D);
}

function insertBinarytree(pos: Vector) {
  insertBinarytreeRandom(pos.x - 80, pos.x + 80, pos.y, 8);
}

function insertBinarytreeRandom(limitL: number, limitR: number, y: number, num: number) {
  if (num == 0) return null;
  let pos = pInst.createVector((limitL + limitR) / 2, y);
  let node = createNode(pos);
  //sketch.nodes.push(node)
  let lnum = Math.floor(Math.random() * num);
  let rnum = num - 1 - lnum;

  let left = insertBinarytreeRandom(limitL, pos.x, pos.y + 70, lnum);
  let right = insertBinarytreeRandom(pos.x, limitR, y + 70, rnum);
  if (left) {
    links.add(new LBLink(exports, node, left, true));
    union(node, left)
    // createLink(node, left, left);
  }
  if (right) {
    links.add(new LBLink(exports, node, right, true));
    union(node, right)
  }
  return node;
}

export let pInst: p5 = new p5(sketchData, 'mainSketchHolder');
mainDock = pInst.select('#maindock');
// let scribble = new Scribble(p5Data);
// scribble.scribbleFillingCircle = function (x, y, r, gap, angle) {
//   let vertexV = p5Data.createVector(r, 0);
//   let base = p5Data.createVector(x, y);
//   let xCors = [];
//   let yCors = [];
//   for (let a = 0; a < 360; a += 9) {
//     let tempV = base.copy().add(vertexV.rotate(9));
//     xCors.push(tempV.x);
//     yCors.push(tempV.y);
//   }
//   this.scribbleFilling(xCors, yCors, gap, angle);
// }

export function drawArrow(base: Vector, line: Vector, myColor?: string): void {
  pInst.push();
  pInst.translate(base.x, base.y);
  pInst.line(0, 0, line.x, line.y);
  pInst.rotate(line.heading());
  let arrowSize = 7;
  pInst.translate(line.mag() - arrowSize, 0);
  pInst.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pInst.pop();
}

// p5Data.elementHovering=null; 

// namespace SketchData{
//   export let p5Data

// }
let graphs = new Set<ConnnectedGraph>();
export function union(nodeA: LBNode, nodeB: LBNode) {
  let graphA = nodeA.graphBelong;
  let graphB = nodeB.graphBelong;

  if (graphA == graphB) return;

  console.log('and the line attached');
  //添加进边集的同时维护邻接表
  // nodeA.linkmap.set(nodeB, l);
  // nodeB.linkmap.set(nodeA, l);
  //合并从属 graph
  graphA.addNodes(graphB.nodes);
  // =graphA.nodes.concat(graphB.nodes);
  // graphB.nodes.forEach(node => {
  //     node.graphBelong=graphA;
  // });
  graphs.delete(graphB)
  // elements.splice(elements.indexOf(graphB),1)
}
let lastTitle: string | number;
lastTitle = -1;

function createNode(pos: Vector) {
  let node: LBNode;
  // var re = /^[0-9]+.?[0-9]*/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/;
  if (typeof lastTitle == 'number') {
    lastTitle++;
    node = new LBNode(exports, pos.copy(), lastTitle);
    // node.content = lastTitle;
  } else
    node = new LBNode(exports, pos.copy());
  elements.push(node);

  let graph = new ConnnectedGraph([node]);
  node.graphBelong = graph;
  graphs.add(graph);
  return node;
}

let constant_charge = 400;
let coefficient_forceback = 0.1;

function chargeforce() {

  let particles = elements.filter((ele) => {
    if (ele instanceof LBLink) return false
    // if (ele instanceof LBNode) return false
    return true
  })

  for (var i = 0; i < particles.length; i++) {
    for (var j = i + 1; j < particles.length; j++) {
      let pi = particles[i];
      let pj = particles[j];
      //联通图内各点间无作用力 或者说叫内部力 抵消了
      if (pi instanceof LBNode && pj instanceof LBNode && pi.graphBelong === pj.graphBelong) continue;

      let dist = p5.Vector.dist(pi.getCenter(), pj.getCenter());
      let force = p5.Vector.sub(pi.getCenter(), pj.getCenter()).setMag((constant_charge) / (dist * dist + 1));

      //边界约束

      // if (dist < pi.maxRadius + pj.maxRadius + Math.min(pi.maxRadius, pj.maxRadius) / 2) {
      //   dist = dist - pi.maxRadius - pj.maxRadius;
      //   dist = Math.max(dist, 20);
      //   force = p5.Vector.sub(pi.position, pj.position).setMag((chargeC ? chargeC : this.constant_charge) / (dist * dist + 1));
      // } else
      //   force = p5Data.createVector(0, 0);


      if (pi instanceof LBNode) {
        pi.graphBelong.nodes.forEach((node) => {
          node.addForce(force)
        })
      } else
        pi.addForce(force)


      let antiForce = force.copy().rotate(180);

      if (pj instanceof LBNode) {
        pj.graphBelong.nodes.forEach((node) => {
          node.addForce(antiForce)
        })
      } else
        pj.addForce(antiForce)
    }
  }
  for (let i = 0; i < particles.length; i++) {
    // if(nodes[i].groupBelong) continue;
    let particle = particles[i];
    particle.velocity.mult(coefficient_forceback);
    particle.velocity.add(particle.acceleration);
    particles[i].move(particle.velocity);
    particle.acceleration.mult(0);
  }
}

// declare let exports: any; 
let thisModule = exports;
// export let boardData = {
//   pInst: p5Data,
//   elements: elements,
//   links,
//   actionStack,
//   elementHovering: elementHovering,
//   mousePos,
//   union
// }


