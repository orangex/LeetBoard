let system;


let firstclick = false;
let secondclick = false;
let editingInput;

let inEditingStartedAnimation = false;

let lastTitle = -1;
//sketch 维护着业务需要的全局状态
const sketchData = (pInst) => {

  let actionStack = [];
  let lastLinkID = 0;


  let elements = [];//屏幕上所有能看到的元素就是 Node.(Node Group 也是 Node)
  let elementGroups = [];
  let links = [];//link 的两端可以是 Node，也可以是坐标。

  let mousePos;
  let linkConnecting;
  let elementDragging;//node
  let mouseToElementAnchor; //开始拖动 Node 时，指针与 Node 中心的偏移量，此后拖动时 Node 就在指针的位置上加上该偏移量就行。
  let elementEditing;//node and link 
  let elementHovered;//node and link

  let elementsSelected = new Set();

  let dock;
  let scribbledock;
  let mainSketch;
  let scribbleSketch;

  let canvas;
  let inserting;

  let insertingSVG;
  let insertingUse;
 let mainSketchHolder;


  function validateQuickInsert(text) {
    let t=text.trim();
    if(t.charAt(0)=='[') t=t.substring(1);
    if(t.charAt(t.length-1)==']') t=t.substring(0,t.length-1);
    let result;
    try {
      result=t.split(',');
    } catch (error) {
      return false;
    }
    if(result.length>=20) return '线性表长度不得超过20~'
    return result;
  }
  pInst.setup = function () {


    canvas = pInst.createCanvas(1000, 1000);
    canvas.style('position', 'absolute');
    canvas.class('in-Sketch-Main');
    mainSketchHolder=pInst.select('#mainSketchHolder')
    mainSketchHolder.mouseClicked((ev)=>{sketch_mouseClicked(ev)});
    mainSketchHolder.doubleClicked((ev)=>{sketch_doubleClicked(ev)});
    mainSketchHolder.elt.addEventListener('paste',(ev)=>{
      let paste = (ev.clipboardData || window.clipboardData).getData('text');
      let result=validateQuickInsert(paste);
      if(!result) return ;
      if(result instanceof Array ){
        
        ev.preventDefault();
      }
      
    })
    mousePos = pInst.createVector(pInst.width / 2, pInst.height);
    pInst.strokeWeight(1.2);
    pInst.stroke(0, 0, 0);
    pInst.angleMode(pInst.DEGREES);
    system = new ChargeForceSystem();

        initInsertingPics();

    pInst.textAlign(pInst.CENTER, pInst.CENTER);

    dock = pInst.select('#maindock');
    scribbledock = pInst.select('#scribbledock');
    mainSketch = pInst.select('#mainSketchHolder');
    scribbleSketch = pInst.select('#scribbleSketchHolder');

    onSwitchScribbleMode();

    let scribbleSwitch = pInst.select('#scribble-switch');
    scribbleSwitch.mouseClicked((ev) => {
      scribbleSwitch.toggleClass('dark-primary-text-color');
      scribbleSwitch.toggleClass('accent-text-color');
      scribbling = !scribbling;
      onSwitchScribbleMode();
    })

    dock.mouseClicked((ev) => {
      let target = ev.target;
      let type = target.getAttribute('data-tooltype');
      switch (type) {
        case 'cancel':
          if (actionStack.length !== 0)
            actionStack.pop()();
          break;
        case 'insert2DArray':
        case 'insertNode':
          if (inserting == type) inserting = null;
          else inserting = type;
        default:
          break;
      }

      // if (type == scribbleType) return false;

      // let old = pInst.select(`#scribble-${scribbleType}`, 'div');
      // // scribbledock.elt.querySelector(`svg[data-scribbletype=${scribbleType}]`);
      // if (old) {
      //     old.toggleClass('dark-primary-text-color');
      //     old.toggleClass('accent-text-color');
      // }
      // let n;
      // scribbleType = type;
      // n = pInst.select(`#scribble-${type}`, 'div');
      // if (n) {
      //     n.toggleClass('dark-primary-text-color');
      //     n.toggleClass('accent-text-color');
      // }
    })


  }
 function initInsertingPics() {
  insertingSVG=pInst.select('#insertingIcon');

    // insertingSVG = pInst.createElement('svg');
    // insertingSVG.style('z-index',4);
    // insertingSVG.style('font-size',"2em");
    // insertingSVG.style('color','#000000')
    // insertingSVG.attribute('width',"64");
    // insertingSVG.attribute('height',"64");
    // insertingDiv.class('tool')
    // insertingSVG.attribute('aria-hidden', true);
    // insertingSVG.class('icon')
    // insertingSVG.position(200,200);
    // insertingUse=document.createElement('use')
    // insertingSVG.elt.appendChild(insertingUse);
    // insertingUse.setAttribute('href','#iconchexiao');
  insertingUse=pInst.select('#insertingIconUse')
    // insertingUse = pInst.createElement('use');
    // insertingSVG.child(insertingUse);
    // insertingUse.attribute('href', '#iconchexiao');

  }
  function onSwitchScribbleMode() {
    if (scribbling) {
      p5Scribble.loop();
      p5Data.noLoop();
      scribbleSketch.style('visibility', 'visible');
      scribbledock.style('visibility', 'visible');
      dock.style('visibility', 'hidden');
    } else {
      scribbleSketch.style('visibility', 'hidden');
      p5Scribble.noLoop();
      p5Data.loop();
      scribbledock.style('visibility', 'hidden');
      dock.style('visibility', 'visible');
    }
  }
  //显示该 Element 的内容编辑框
  function showTextInput(ele) {
    editingInput.size(pInst.AUTO, pInst.AUTO);
    if (ele instanceof Node) {
      editingInput.position(elementEditing.position.x - editingInput.size().width / 2, elementEditing.position.y + elementEditing.maxRadius + 1);

    }
    if (ele instanceof Link) {
      //找到偏右的法向量    
      let normalV = p5.Vector.sub(ele.endV, ele.startV).rotate(90).setMag(5);
      if (normalV.x < 0)
        normalV.rotate(180);
      //link 的中点+法向量=输入框的位置
      let temp = p5.Vector.add(ele.startV, ele.endV);
      let posV = temp.setMag(temp.mag() / 2).add(normalV);
      editingInput.position(posV.x, posV.y + 15);
    }
  }
  function maintain(mousePos) {
    elementHovered = null;
    //遍历查找 hover 的元素
    elements.some((ele) => {
      if (ele.checkHover(mousePos)) {
        elementHovered = ele;
        return true;
      }
    });
    elementsSelected.clear();
    elements.forEach((ele) => {
      if (ele.isSelected) elementsSelected.add(ele);
    })
    if (!elementHovered)
      links.some((link) => {
        if (link.checkHover(mousePos)) {
          elementHovered = link;
          return true;
        }
      })
  }

  pInst.draw = function () {
    pInst.cursor(p5.ARROW);
    // p.cursor('MOVE');

    pInst.background(255, 255, 255);

    mousePos.set(pInst.mouseX, pInst.mouseY);
    maintain(mousePos);

    if (inserting) {
      insertingSVG.style('visibility', 'visible')
      insertingSVG.position(mousePos.x,mousePos.y);
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
      // insertingSVG.style('visibility', 'none')

    //需要根据用户输入维护一些交互有关的状态。
    //处于编辑激活的动画中
    // if (inEditingStartedAnimation) {
    //   helperAngle -= 24;
    //   if (helperAngle <= -90) helperAngle = 90;
    //   elementEditing.setScale(1 + pInst.cos(helperAngle) / 8);
    // } else
    //   helperAngle = 90;


    //1.维护是否在画线的状态，该状态的产生条件是：从 node 发生了拖动，并同时按住 C 键
    if (linkConnecting) {
      //鼠标拖动画线时  如果悬停在另外的 Node 上，应暂时显示 Node 与 Node 连线的效果
      if (elementHovered && elementHovered instanceof Node && elementHovered !== linkConnecting.start) {
        linkConnecting.end = elementHovered;
        linkConnecting.directionTo = elementHovered;
      } else
        linkConnecting.end = mousePos;
      linkConnecting.draw();
      //如果正在画箭头 松开了左键或者键盘 C 键 ,则连线结束
      if (!pInst.keyIsDown(67) || !pInst.mouseIsPressed) {
        console.log('stop connecting');
        //如果结束的点是个 Node 并且，两点之间本无连线
        if (elementHovered && elementHovered instanceof Node
          // && elementHovered !== linkConnecting.start
          && elementHovered.groupBelong !== linkConnecting.start.groupBelong
          // && !linkConnecting.start.linkmap.has(elementHovered) && !elementHovered.linkmap.has(linkConnecting.start)
        ) {
          union(linkConnecting.start, elementHovered, elementHovered);
          // if (linkConnecting.start.children.indexOf(elementHovered) < 0)
          //   linkConnecting.start.children.push(elementHovered);
        }
        linkConnecting = null;
      }
    }

    if (elementDragging)
      elementDragging.moveTo(p5.Vector.add(mousePos, mouseToElementAnchor));

    elements.forEach((node) => {
      node.draw();
    })
    links.forEach((link) => {
      link.draw();
    })
    // system.run(elementGroups);
    // system.run(elements);
  }

  function sketch_mousePressed(ev) {
    if (scribbling) return;
    //分发给 GUI
    if (!elementHovered) return;
    // if(elementEditing && editingInput)


    if (elementHovered.isDraggable(mousePos)) {
      elementDragging = elementHovered;
      mouseToElementAnchor = p5.Vector.sub(elementDragging.position, mousePos);
    }


    // // NOTE:drag check
    // if (elementHovered) {
    //   if (elementHovered instanceof Node) {
    //     //按住 C 键以从一个节点出发连线
    //     if (p.keyIsDown(67) && !elementDragging) {
    //       console.log('start dragging a line')
    //       linkConnecting = new Link(-1, elementHovered, mousePos);
    //     }
    //     //
    //     if (!linkConnecting) {
    //       elementDragging = elementHovered;
    //       mouseToElementAnchor = p5.Vector.sub(elementDragging.position, mousePos);
    //     }
    //   }
    // }
    // else
    //  createNode(p.createVector(p.mouseX, p.mouseY));
  }

  pInst.mousePressed = function (ev) {
    let inMainSketch = ev.target.classList.contains('in-Sketch-Main');
    if (inMainSketch) sketch_mousePressed(ev);

  }

  function sketch_mouseReleased(ev) {
    if (scribbling) return;
    elementDragging = null;
  }
  pInst.mouseReleased = function (ev) {
    // arrowDragging = null;
    let inMainSketch = ev.target.classList.contains('in-Sketch-Main');
    if (inMainSketch) sketch_mouseReleased(ev);
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
      elementsSelected = [];
    }
  }
  function recover(ele) {
    if (ele instanceof Node) {
      let linksNearby = ele.linkmap.values();
      //遍历所有邻边 ，将Node 自己从对点的 linkmap 中删去，并（从 links）删去 link。
      for (let linkNearby of linksNearby) {
        let op;
        if (linkNearby.start !== ele)
          op = linkNearby.start;
        else if (linkNearby.end !== ele)
          op = linkNearby.end;
        if (op)
          op.linkmap.set(ele, linkNearby);
        links.push(linkNearby);
      }
      //最后再（从 Nodes 中）删掉 Node 自己
      elements.push(ele);
      ele.onRecover();
    }
  }
  function remove(ele) {
    if (ele instanceof Node) {
      let linksNearby = ele.linkmap.values();
      //遍历所有邻边 ，将Node 自己从对点的 linkmap 中删去，并（从 links）删去 link。
      for (let linkNearby of linksNearby) {
        let op;
        if (linkNearby.start !== ele)
          op = linkNearby.start;
        else if (linkNearby.end !== ele)
          op = linkNearby.end;
        if (op)
          op.linkmap.delete(ele);
        links.splice(links.indexOf(linkNearby), 1);
      }
      //最后再（从 Nodes 中）删掉 Node 自己
      elements.splice(elements.indexOf(ele), 1);
      ele.onDelete();
    }
  }

  pInst.keyPressed = function () {
    if (scribbling) return;
    if (elementsSelected.size == 1) {
      let ele = elementsSelected.values().next().value;
      if (ele instanceof Array2D) {
        switch (pInst.keyCode) {
          //暂时回车和 down 做一样处理
          case 40://arrow down 
            if (ele.moveSelected('down'))
              return false;
          case 39://arrow right
            if (ele.moveSelected('right'))
              return false;
          case 38://arrow up
            if (ele.moveSelected('up'))
              return false;
          case 37://arrow left
            if (ele.moveSelected('left'))
              return false;
            break;
//           case 13://arrow enter
//             if (ele.moveSelected('enter'))
//               return false;
//             break;
          case 9://arrow left
            if (ele.moveSelected('tab'))
              return false;
            break;
          default:
            break;
        }
      }
    }


    switch (pInst.key) {
      case 'n':
        if (!elementHovered) {
          console.log('\'n\' typed, node created');
          createNode(mousePos);
        }
        break;
      case 'd':
        removeSelectedElements();
        break;
      case '1':
        if (!elementHovered)
          insertBinarytree(mousePos);
        break;
      case '2':
        if (!elementHovered)
          insert2DArray(mousePos);
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
  }

  pInst.keyTyped = function () {
    //todo 双击进入编辑状态
    // if (elementSelected) {
    //   elementSelected.enableEditing();
    //   return true;
    // }

    // switch (p.key) {
    //   case 'n':
    //     if (!elementHovered) {
    //       console.log('\'n\' typed, node created');
    //       createNode(mousePos);
    //     }
    //     break;
    //   case 'd':
    //     if (elementHovered) {//
    //       remove(elementHovered);
    //     }
    //     break;
    //   case '1':
    //     if (!elementHovered)
    //       insertBinarytree(mousePos);
    //     break;
    //   case '2':
    //     if (!elementHovered)
    //       insert2DArray(mousePos);
    //     break;
    //   case 'e':
    //     //有元素被选中并且 elementEditing不是该选中的元素或者 elementEditing为空
    //     if (elementSelected && elementEditing !== elementSelected) {
    //       elementEditing = elementSelected;
    //       elementSelected.enableEditing();
    //       return false;
    //     }

    //     break;

    //   default:
    //     break;
    // }

    // uncomment to prevent any default behavior
    // return false;≈
  }
  let clickTimeId;
  function sketch_mouseClicked(ev) {
    if (scribbling) return;
    clearTimeout(clickTimeId);
    clickTimeId = setTimeout(() => {
      if (!elementHovered) {
        if (!inserting) return;
        switch (inserting) {
          case 'insert2DArray':
            insert2DArray(mousePos);
            inserting = null;
            break;

          default:
            break;
        }
      } else
        elementHovered.click(mousePos);

      //       if (elementHovered.isSelectable(mousePos)) {
      //         //选中再选中就会取消选中
      //         if (elementHovered.select(mousePos))
      //           elementsSelected.push(elementHovered);
      //         else
      //           elementsSelected.splice(elementsSelected.indexOf(elementHovered), 1);
      //       }
    }, 200);
  }

  pInst.mouseClicked = function (ev) {
    // let inMainSketch = ev.target.classList.contains('in-Sketch-Main');
    // if (inMainSketch) sketch_mouseClicked(ev);
//     return false;
  }

  function sketch_doubleClicked(ev) {
    if (scribbling) return;
    clearTimeout(clickTimeId);
    if (!elementHovered) return false;
    elementHovered.doubleClick(mousePos.copy());


    // if (elementHovered) {
    //   elementEditing = elementHovered;
    //   if (elementHovered instanceof Node)
    //     inEditingStartedAnimation = true;
    //   editingInput.value(elementEditing.title);
    //   editingInput.show();
    //   editingInput.elt.focus();
    //   elementEditing.uiState.editing = true;
    //   if (elementHovered instanceof Node)
    //     setTimeout(() => {
    //       inEditingStartedAnimation = false;
    //     }, 200);
    //   // }
    //   // p.loop();
    // }
    return false;

  }
  //分发事件
  pInst.doubleClicked = function (ev) {

  }


  function insert2DArray(pos, rowNum, colNum) {
    if (rowNum && colNum)
      insert2DArrayWithSize(pos, rowNum, colNum);
    else
      insert2DArrayWithSize(pos, 3, 4);
  }

  function insert2DArrayWithSize(pos, rowNum, colNum) {
    let array2D = new Array2D(pInst, pos, rowNum, colNum);
    elements.push(array2D);
    elementGroups.push(array2D);
  }

  function insertBinarytree(pos) {
    insertBinarytreeRandom(pos.x - 80, pos.x + 80, pos.y, 8);
  }

  function insertBinarytreeRandom(limitL, limitR, y, num) {
    if (num == 0) return null;
    let pos = p5Data.createVector((limitL + limitR) / 2, y);
    let node = createNode(pos);
    //sketch.nodes.push(node)
    let lnum = Math.floor(Math.random() * num);
    let rnum = num - 1 - lnum;

    let left = insertBinarytreeRandom(limitL, pos.x, pos.y + 70, lnum);
    let right = insertBinarytreeRandom(pos.x, limitR, y + 70, rnum);
    if (left) {
      union(node, left, left);
    }
    if (right) {
      union(node, right, right);
    }
    return node;
  }

  function createNode(pos) {
    let node;
    // var re = /^[0-9]+.?[0-9]*/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/;
    if (!isNaN(lastTitle)) {
      lastTitle++;
      node = new Node(pos.copy(), lastTitle);
      // node.content = lastTitle;
    } else
      node = new Node(pos.copy());
    elements.push(node);

    let group = new NodeGroup([node]);
    node.groupBelong = group;
    elementGroups.push(group);
    return node;
  }

  function union(nodeA, nodeB, directionTo) {
    let groupA = nodeA.groupBelong;
    let groupB = nodeB.groupBelong;

    if (groupA == groupB) return;
    let l = new Link(lastLinkID++, nodeA, nodeB, directionTo);
    console.log('and the line attached');
    links.push(l);
    //添加进边集的同时维护邻接表
    nodeA.linkmap.set(nodeB, l);
    nodeB.linkmap.set(nodeA, l);
    //合并从属 group
    groupA.addNodes(groupB.nodes);
    // =groupA.nodes.concat(groupB.nodes);
    // groupB.nodes.forEach(node => {
    //     node.groupBelong=groupA;
    // });
    elementGroups.splice(elementGroups.indexOf(groupB), 1);
  }

  function windowResized() {
    centerCanvas();
  }
}

let p5Data = new p5(sketchData, 'mainSketchHolder');

let scribble = new Scribble(p5Data);
scribble.scribbleFillingCircle = function (x, y, r, gap, angle) {
  let vertexV = p5Data.createVector(r, 0);
  let base = p5Data.createVector(x, y);
  let xCors = [];
  let yCors = [];
  for (let a = 0; a < 360; a += 9) {
    let tempV = base.copy().add(vertexV.rotate(9));
    xCors.push(tempV.x);
    yCors.push(tempV.y);
  }
  this.scribbleFilling(xCors, yCors, gap, angle);
}

p5Data.drawArrow = function (base, vec, myColor) {
  p5Data.push();
  p5Data.translate(base.x, base.y);
  p5Data.line(0, 0, vec.x, vec.y);
  p5Data.rotate(vec.heading());
  let arrowSize = 7;
  p5Data.translate(vec.mag() - arrowSize, 0);
  p5Data.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  p5Data.pop();
}
