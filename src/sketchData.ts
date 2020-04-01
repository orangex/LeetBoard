import { MDCRipple } from '@material/ripple';
import { MDCDialog } from '@material/dialog';
import p5 = require('p5');
import { BoardDataElement, LBLink, LBNode, LBTable, ConnnectedGraph, LBMap, LBText } from './elements';
import { Vector } from 'p5';

import { dataSketchContainer, boardToolbar, modeScribbling, buttonSwitchScribbleMode, switchScribbleMode, dataBoardContainer } from './crx_index';

// import  './iconfont'
export let recoverStack = new Array<Function>();
export let lastNodeTitle: number | string
lastNodeTitle = -1;
// let elementGroups = [];
// let links = new Set<LBLink>();//link 的两端可以是 Node，也可以是坐标。
export let mousePos: Vector;
export let elementHovering: BoardDataElement;//node and link
export let nodeHovering: LBNode;
// export let linkScribbling: LBLink
// Array2D 只要
// let elementsSelected;
export let mainSketch: p5.Element;
export let canvas: p5.Element;

//用来显示插入 cursor icon 的 Element
export let insertingSVG: p5.Element;
export let insertingUse: p5.Element;

export let elements = new Array<BoardDataElement>();//屏幕上所有能看到的元素就是 Node.(Node Group 也是 Node)
//todo  function化
// export let inserting: 'insert2DArray' | "insertNode" | 'insertMap' | 'insertLink';
// export let inserting: typeof insertNode | typeof insertTable | typeof insertMap | Function
export let inserting: (pos: Vector) => void

export let editInput: p5.Element;

let dialogInsertasArrayorLinkedListEle: p5.Element;
let dialogInsertasArrayorLinkedList: MDCDialog


//sketch 维护着业务需要的全局状态
const sketchData = (pInst: p5) => {

  function validateQuickInsert(text: string) {
    //todo 二维数组
    let t = text.trim();
    if (t.startsWith("\"") && t.endsWith("\""))
      t = t = t.substr(1, t.length - 2).trim();
    let table = new Array<Array<string>>();
    if (t.startsWith("[") && t.endsWith("]")) {
      t = t.substr(1, t.length - 2).trim();
      let sArr: string[];
      if (t.startsWith("[") && t.endsWith("]")) {
        t = t.substr(1, t.length - 2).trim();
        sArr = t.split("],[")
        sArr.forEach((s: string) => {
          let currArr = s.split(',').map((str: string) => {
            if (str.startsWith('\"') && str.endsWith('\"'))
              return str.substr(1, str.length - 2).trim();
            return str.trim();
          })
          table.push(currArr);
        })
        inserting = (pos: Vector) => {
          insertTableWithContent(pos, table);
        }
      }
      else {
        sArr = t.split(',').map((str: string) => {
          if (str.startsWith('\"') && str.endsWith('\"'))
            return str.substr(1, str.length - 2).trim();
          return str.trim();
        })
        dialogInsertasArrayorLinkedList.listen('MDCDialog:closed', (evt: any) => {
          switch (evt.detail.action) {
            case 'array':
              table.push(sArr);
              inserting = (pos: Vector) => {
                insertTableWithContent(pos, table);
              }
              break;
            case 'linkedlist':
              inserting = (pos: Vector) => {
                insertLinkedListWithArray(pos, sArr)
              }
              break;
            case 'binarytree':
              inserting = (pos: Vector) => {
                insertBinarytreeWithArray(pos, sArr)
              }
              break;
            case 'close':
              break;
          }
        })
        dialogInsertasArrayorLinkedList.open();
      }
    } else {
      let sArr = t.split('');
      table.push(sArr);
      inserting = (pos: Vector) => {
        insertTableWithContent(pos, table);
      }
    }
  }
  pInst.setup = function () {
    canvas = pInst.createCanvas(1920, 1080);
    canvas.id('data-canvas')
    canvas.parent(dataSketchContainer);

    // (canvas.elt as HTMLElement).focus();
    {
      dialogInsertasArrayorLinkedListEle = pInst.createElement('div', `
    <div class="mdc-dialog__container">
      <div class="mdc-dialog__surface">

        <div class="mdc-dialog__content" id="dialog-insertlinearlist-content">
        请选择可视化该字符串的形式
        </div>
        <footer class="mdc-dialog__actions">
          <button type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="array">
            <svg class="mdc-button__icon" aria-hidden="true">
              <use href="#iconyihangsilie"></use>
            </svg>
            <span class="mdc-button__label">数组</span>
          </button>
          <button type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="linkedlist">
            <svg class="mdc-button__icon" aria-hidden="true">
              <use href="#iconlianjie"></use>
            </svg>
            <span class="mdc-button__label">链表</span>
          </button>

          <button type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="binarytree">
            <svg class="mdc-button__icon" aria-hidden="true">
              <use href="#iconchuizhishu"></use>
            </svg>
          <span class="mdc-button__label">二叉树</span>
        </button>
        </footer>
      </div>
    </div>
    <div class="mdc-dialog__scrim"></div>
    `)
    }

    dialogInsertasArrayorLinkedListEle.addClass("mdc-dialog")
    dialogInsertasArrayorLinkedListEle.attribute('role', "alertdialog")
    dialogInsertasArrayorLinkedListEle.attribute('aria-modal', "true")
    // dialogInsertasArrayorLinkedListEle.attribute('aria-labelledby', "my-dialog-title")
    dialogInsertasArrayorLinkedListEle.attribute('aria-describedby', "insertlinearlist")
    dialogInsertasArrayorLinkedListEle.style('z-index', '9999')
    dialogInsertasArrayorLinkedListEle.id('dialogInsertasArrayorLinkedList')

    dialogInsertasArrayorLinkedList = new MDCDialog(dialogInsertasArrayorLinkedListEle.elt);
    dialogInsertasArrayorLinkedList.close();
    editInput = pInst.createInput();
    editInput.parent(dataSketchContainer);

    insertingSVG = pInst.select('#insertingIcon');
    insertingUse = pInst.select('#insertingIconUse')
    //click 事件发生在 press 和 Release 之后，有很多不便之处，所以我们用 press 事件代替
    // mainSketchHolder.mouseClicked(sketch_mouseClicked);

    pInst.mouseReleased = () => {
      mouseReleaseDefault(mousePos.copy())
    }
    canvas.doubleClicked(() => {
      return false;
    });

    canvas.mousePressed(sketch_mousePressed)
    canvas.mouseReleased(sketch_mouseReleased)

    dataSketchContainer.elt.addEventListener('paste', (ev: ClipboardEvent) => {
      let paste = (ev.clipboardData).getData('text');
      // let result = 
      validateQuickInsert(paste);
      // if (!result) return;
      // if (result instanceof Array) {
      //   ev.preventDefault();
      // }
    })

    mousePos = pInst.createVector(pInst.width / 2, pInst.height / 2);

    pInst.stroke(0, 0, 0);
    pInst.angleMode(pInst.DEGREES);
    // pInst.textAlign(pInst.CENTER, pInst.CENTER);

    //正在插入的元素类型
  }



  pInst.doubleClicked = () => {

  }

  pInst.keyTyped = () => {
    if (modeScribbling) return
    if(document.activeElement!==dataBoardContainer.elt && !(dataBoardContainer.elt as HTMLElement).contains(document.activeElement) && !document.activeElement.contains((dataBoardContainer.elt as HTMLElement))) return;
    elements.some((ele) => {
      return ele.keyTyped()
    })
  }
  
  pInst.draw = function () {
    mousePos.set(pInst.mouseX, pInst.mouseY);
    pInst.cursor(pInst.ARROW);
    pInst.background(255, 255, 255);
    if (selectionBoxAnchor) {
      let lettTopx = Math.min(selectionBoxAnchor.x, pInst.mouseX);
      let leftTopy = Math.min(selectionBoxAnchor.y, pInst.mouseY)
      let lefttop = pInst.createVector(lettTopx, leftTopy)
      let rightbottomx = Math.max(selectionBoxAnchor.x, pInst.mouseX);
      let rightbottomy = Math.max(selectionBoxAnchor.y, pInst.mouseY);
      let rightbottom = pInst.createVector(rightbottomx, rightbottomy)

      elements.forEach((ele) => {
        if (ele.inSelectionBox(lefttop, rightbottom))
          ele.selected = true;
      })
    }

    elementHovering = null;
    // linkScribbling = null;
    nodeHovering = null;

    elements.forEach((ele) => {
      if (ele.posWithin(mousePos)) {
        elementHovering = ele;
        if (ele instanceof LBNode)
          nodeHovering = ele;
      }

    })
    // linkScribbling = null;
    // links.forEach((link) => {
    //   if (link.onScribbling) {
    //     linkScribbling = link;
    //   }
    // })

    // maintain(mousePos);
    {
      if (inserting) {
        // pInst.cursor('./cursor_add.jpeg')
        canvas.style('cursor', 'copy');
        // insertingSVG.style('visibility', 'visible')
        // insertingSVG.position(mousePos.x, mousePos.y);
        // switch (inserting) {
        //   case 'insert2DArray':
        //     insertingUse.attribute('href', '#iconshulie');
        //     break;
        //   default:
        //     break;
        // }
      } else {
        // insertingSVG.style('visibility', 'hidden')
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



    // chargeforce();
    elements.forEach((node) => {
      node.draw();
    })

    if (selectionBoxAnchor) {
      let lettTopx = Math.min(selectionBoxAnchor.x, pInst.mouseX);
      let leftTopy = Math.min(selectionBoxAnchor.y, pInst.mouseY)

      let rightbottomx = Math.max(selectionBoxAnchor.x, pInst.mouseX);
      let rightbottomy = Math.max(selectionBoxAnchor.y, pInst.mouseY);
      pInst.push()
      pInst.fill(173, 216, 230, 128)
      pInst.stroke(173, 216, 230, 0)
      pInst.rect(lettTopx, leftTopy, rightbottomx - lettTopx, rightbottomy - leftTopy)
      pInst.pop();
    }
    // system.run(elementGroups);
    // system.run(elements);
  }
  let longPressTimeID: number



  // function sketch_longPressed(pressPos: Vector) {
  //   elements.some((ele) => {
  //     return ele.longPressed(pressPos);
  //   })
  // }
  function sketch_mousePressed() {

    // sketch_mouseClicked(mousePos.copy());
    // longPressTimeID = window.setTimeout(() => {
    //   sketch_longPressed(mousePos.copy())
    // }, 300);
    if (inserting) {
      inserting(mousePos.copy())
      inserting = null;
      return
    }
    console.log('mousePressed')
    if (elements.some((ele) => {
      return (ele instanceof LBLink && ele.mousePress(mousePos.copy()));
    }))
      return;
    else if (elements.some((ele) => {
      return (!(ele instanceof LBLink) && ele.mousePress(mousePos.copy()));
    }))
      return;
    {
      mousePressDefault(mousePos.copy())
    }
  }
  let selectionBoxAnchor: Vector | null;
  function mousePressDefault(pressPos: Vector) {


    if (
      // inserting == 'insertLink' || 
      //按下 shift键
      pInst.keyIsDown(16)) {

      let linkCreating = new LBLink(exports, mousePos.copy(), mousePos.copy(), 'toEnd')
      linkCreating.onScribbling = "end";
      // links.add(linkCreating);
      elements.push(linkCreating)
      inserting = null;
    } else {
      elements.forEach((ele) => {
        ele.cancelSelect();
      })
      //框选矩形的基准点
      selectionBoxAnchor = pressPos.copy();
    }

  }
  function mouseReleaseDefault(releasePos: Vector) {
    //如果再是有个 link 正在涂画，那就删掉它
    // if (linkConnecting) {
    //   linkConnecting.onScribbling = false
    //   links.splice(links.indexOf(linkConnecting),1)
    // }

    elements.forEach((ele) => {
      ele.dragging = null;
    })
    if (elements.some((ele) => {
      if (ele instanceof LBLink && ele.onScribbling) {
        ele.onScribbling = null;
        return true
      }
    }))
      return

    if (selectionBoxAnchor) {

      selectionBoxAnchor = null;
      return
    }

    // if (linkScribbling) {
    //   linkScribbling.onScribbling = null;
    //   // links.delete(linkScribbling);
    // }

  }
  function sketch_mouseReleased() {
    clearTimeout(longPressTimeID);

    // window.setTimeout(() => {

    //   console.log('cancel dragging')
    // }, 300)

    //元素消不消费事件与 pos 是不是在元素里没有关系 ，因此所有元素都不消费事件也不意味着这个点就在所谓的”空白区“ ，仅仅是当做一个坐标 然后由 board 层处理
    elements.some((ele) => {
      return ele.mouseRelease(mousePos.copy())
    })
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
    if (document.activeElement !== dataBoardContainer.elt) return;
    //ctrl+z /cmd+z
    if (pInst.keyCode == 90 && (pInst.keyIsDown(91) || pInst.keyIsDown(17))) {
      cancelDeletion()
      return;
    }
    //优先由全局处理的逻辑
    switch (pInst.keyCode) {
      case pInst.BACKSPACE:
        //todo mac 的左 ctrl
        if (pInst.keyIsDown(17)) {
          deleteSelected()
          return false;
        }
        break;
      default:
        break;
    }
    //分发给元素去处理
    elements.some((ele) => {
      return ele.keyPressed(pInst.keyCode)
    })
    // return false;
  }

  let clickTimeId: number;
  function mouseClickDefault(clickPos: Vector) {
    //取消选中
    elements.forEach((ele) => {
      ele.selected = false;
    })

  }
  // function sketch_mouseClicked(clickPos: Vector) {
  //   // if(longPressTimeID)

  //   clearTimeout(clickTimeId);
  //   clickTimeId = window.setTimeout(() => {

  //     if (inserting) {
  //       inserting(clickPos.copy())
  //       inserting = null;
  //     }
  //     else if (elements.some((ele) => {
  //       return (ele instanceof LBLink && ele.click(clickPos));
  //     })) {
  //       return;
  //     } else if (elements.some((ele) => {
  //       return (!(ele instanceof LBLink) && ele.click(clickPos));
  //     })) {
  //       return;
  //     } else
  //       mouseClickDefault(clickPos);

  //     //       if (elementHovered.isSelectable(mousePos)) {
  //     //         //选中再选中就会取消选中
  //     //         if (elementHovered.select(mousePos))
  //     //           elementsSelected.push(elementHovered);
  //     //         else
  //     //           elementsSelected.splice(elementsSelected.indexOf(elementHovered), 1);
  //     //       }
  //   }, 200);
  // }


  // function sketch_doubleClicked() {

  //   clearTimeout(clickTimeId);
  //   if (elements.some((ele) => {
  //     return ele.doubleClick(mousePos.copy())
  //   }))
  //     return;
  //   // elementHovering.doubleClick(mousePos.copy());


  //   return false;

  // }
  //分发事件


  // function windowResized() {
  //   centerCanvas();
  // }
}

function deleteSelected() {
  let elementsToDelete = elements.filter((ele) => {
    return (ele.selected == true)
  })

  elements = elements.filter((ele) => {
    return (ele.selected == false)
  })
  elementsToDelete.forEach((ele)=>{
    ele.onDelete();
  })
  recoverStack.push(() => {
    elements = elements.concat(elementsToDelete);
    elementsToDelete.forEach((ele)=>{
      ele.onRecover();
    })
  })
}

interface buildItem {
  node: LBNode;
  left: number;
  right: number;
  y: number;
}
function insertBinarytreeWithArray(pos: Vector, contents: Array<string>) {
  if(contents==null||contents.length==0) return;
  let lastFloor: Array<buildItem> = new Array<buildItem>();
  let currFloor: Array<buildItem> ;

  let width = (contents.length / 2) * 70;

  let index=0;
  lastFloor.push({
    node:insertNode(pos.copy(),contents[0]),
    left:pos.x-width/2,
    right:pos.x+width/2,
    y:pos.y,
  });

  while (true) {
    currFloor= new Array<buildItem>();
    for (let i = 0; i < lastFloor.length; i++) {
      index++;
      if (index >= contents.length) return;
      let fatherItem = lastFloor[i];
      let fatherx = fatherItem.node.datumPoint.x;
      let fathery = fatherItem.node.datumPoint.y;

      if (contents[index] != 'null') {
        let midx = (fatherx + fatherItem.left) / 2;
        let currNode = insertNode(pInst.createVector(midx, fathery + 70), contents[index])
        currFloor.push({
          node: currNode,
          left: fatherItem.left,
          right: fatherx,
          y: fathery + 80,
        })
        union(fatherItem.node, currNode);
        let link = new LBLink(exports, fatherItem.node, currNode, 'toEnd')
        elements.push(link)
      }

      index++;
      if (index >= contents.length) return;
      if (contents[index] != 'null') {
        let midx = (fatherx + fatherItem.right) / 2;
        let currNode = insertNode(pInst.createVector(midx, fathery + 70), contents[index])
        currFloor.push({
          node: currNode,
          left: fatherx,
          right: fatherItem.right,
          y: fathery + 80,
        })
        union(fatherItem.node, currNode);
        let link = new LBLink(exports, fatherItem.node, currNode, 'toEnd')
        elements.push(link)
      }

    }
    lastFloor=currFloor;
  }
}

// function build(depth: number, index: number, contents: Array<string>, left: number, right: number, y: number): LBNode {
  

// }
// function build(index: number, contents: Array<string>, left: number, right: number, y: number): LBNode {
//   if (index >= contents.length) return null;
//   let content = contents[index];
//   if (content == 'null') return null;
//   indexInCurrFloor


//   let midx = (left + right) / 2;
//   let currNode = insertNode(pInst.createVector(midx, y), content);
//   let leftChild = build(index * 2 + 1, contents, left, midx, y + 80);
//   let rightChild = build(index * 2 + 2, contents, midx, right, y + 80);
//   if (leftChild !== null) {
//     union(currNode, leftChild)
//     let link = new LBLink(exports, currNode, leftChild, 'toEnd')
//     elements.push(link)
//   }
//   if (rightChild !== null) {
//     union(currNode, rightChild)
//     let link = new LBLink(exports, currNode, rightChild, 'toEnd')
//     elements.push(link)
//   }
//   return currNode;
// }
function insertLinkedListWithArray(pos: Vector, content: Array<string>) {
  content.push('null')
  let posCurr = pos.copy()
  let offset = pInst.createVector(80, 0);
  let lastNode = insertNode(posCurr, content[0]);
  for (let index = 1; index < content.length; index++) {
    posCurr.add(offset);
    let currNode = insertNode(posCurr, content[index]);
    union(lastNode, currNode)
    let link = new LBLink(exports, lastNode, currNode, 'toEnd')
    // links.add(link);
    elements.push(link)
    lastNode = currNode;
  }
}

function insertTableWithContent(pos: Vector, content: Array<Array<string>>) {
  let array2D = new LBTable(exports, pos, content);
  elements.push(array2D);
}
function insertTable(pos: Vector) {
  insertTableWithContent(pos, null);
}


function insertBinarytree(pos: Vector) {
  insertBinarytreeRandom(pos.x - 80, pos.x + 80, pos.y, 8);
}

function insertBinarytreeRandom(limitL: number, limitR: number, y: number, num: number) {
  if (num == 0) return null;
  let pos = pInst.createVector((limitL + limitR) / 2, y);
  let node = insertNode(pos);
  //sketch.nodes.push(node)
  let lnum = Math.floor(Math.random() * num);
  let rnum = num - 1 - lnum;

  let left = insertBinarytreeRandom(limitL, pos.x, pos.y + 70, lnum);
  let right = insertBinarytreeRandom(pos.x, limitR, y + 70, rnum);
  if (left) {
    elements.push(new LBLink(exports, node, left, 'toEnd'));
    union(node, left)
    // createLink(node, left, left);
  }
  if (right) {
    elements.push(new LBLink(exports, node, right, 'toEnd'));
    union(node, right)
  }
  return node;
}

export let pInst: p5 = new p5(sketchData, document.getElementById("dataSketch-container"));
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

function insertNodeAtPos(pos: Vector) {
  insertNode(pos);
}
function insertNode(pos: Vector, title?: string) {
  let node: LBNode;
  if (title) {
    node = new LBNode(exports, pos.copy(), title);
  } else
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

function insertMap(pos: Vector) {
  let map = new LBMap(exports, pos)
  elements.push(map);
}
function insertText(pos:Vector){

  window.setTimeout(()=>{
    let text=new LBText(exports,pos)
    elements.push(text);
  },50)

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

function cancelDeletion() {
  if (recoverStack.length !== 0)
    recoverStack.pop()();
}
export let onToolbarClicked = function (ev: MouseEvent) {
  if (modeScribbling) return;
  let target = ev.target;
  let type = (target as Element).getAttribute('data-tooltype');
  switch (type) {
    case 'cancel':
      cancelDeletion();
      break;
    case 'empty':
      let eles = elements.slice(0, elements.length);
      elements.splice(0, elements.length)
      recoverStack.push(() => {
        elements = elements.concat(eles);
      })
      break;
    case 'insert2DArray':
      if (inserting == insertTable) inserting = null;
      else inserting = insertTable;
      break
    case 'insertNode':
      if (inserting == insertNode) inserting = null
      else inserting = insertNode;
      break
    case 'insertMap':
      if (inserting == insertMap) inserting = null
      else inserting = insertMap
      //如果正在 insert 与点选的 type 一致，则取消
      break
    case 'insertText':
      if (inserting == insertText) inserting = null
      else inserting = insertText
      break;
    default:
      break;
  }
}


