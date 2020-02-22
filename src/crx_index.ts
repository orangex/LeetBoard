import p5 = require("p5")
import { MDCRipple } from '@material/ripple';
import { MDCDialog } from '@material/dialog';

let dialogInfoEle: p5.Element;
let dialogInfo: MDCDialog;

import * as SketchData from './sketchData'
import * as SketchScribble from "./sketchScribble"

const primaryColor = '#089163';

const sketchHelper = (pInst: p5) => {
  pInst.keyPressed=function(){
    //alt 键
    if(pInst.keyCode==18){
      switchScribbleMode()
      return;
    }
  }
}
let p5Helper = new p5(sketchHelper)


export let dataBoardContainer = p5Helper.createElement('div');

dataBoardContainer.id("databoard-containter");
dataBoardContainer.attribute('tabindex','-1');
dataBoardContainer.elt.focus();
export let boardToolbar = p5Helper.createElement('div')

boardToolbar.id('board-toolbar')
boardToolbar.mouseClicked((ev) => {
  let target = ev.target;
  let type = (target as Element).getAttribute('data-tooltype');
  if(type=='info'){
    dialogInfo.open();
  } else 
  if (modeScribbling)
    SketchScribble.onToolbarClicked(ev);
  else
    SketchData.onToolbarClicked(ev)
})


{
  dialogInfoEle = p5Helper.createElement('div', `
<div class="mdc-dialog__container">
  <div class="mdc-dialog__surface">
    <h2 class="mdc-dialog__title" id="dialog-info-title"> Info</h2>
    <div class="mdc-dialog__content" id="dialog-info-content">
    <h4>一些快捷键</h4>
    <ul>
      <li><span>按住 Shift 键拖动创建一条连线</span></li>
      <li><span>Ctrl+BackSapce 删除框选中的元素</span></li>
      <li><span>按住 Cmd/Ctrl 点击元素以多选</span></li>
    </ul>
    <h4>其他</h4>
    <ul>
      <li><span>亲测 Adblock 插件可能会导致卡顿掉帧，建议暂时停用</span></li>
      <li><span>反馈、建议：</span><a href='mailto:rampaging9@gmail.com' target='_blank'
            class='url'>rampaging9@gmail.com</a></li>
    </ul>
    </div>

  </div>
</div>
<div class="mdc-dialog__scrim"></div>
`)
}
dialogInfoEle.addClass("mdc-dialog")
dialogInfoEle.attribute('role', "alertdialog")
dialogInfoEle.attribute('aria-modal', "true")
dialogInfoEle.attribute('aria-labelledby', "dialog-info-title")
dialogInfoEle.attribute('aria-describedby', "dialog-info-content")
dialogInfoEle.style('z-index', '9999')

dialogInfo = new MDCDialog(dialogInfoEle.elt);
dialogInfo.close();


let toolbarRightSection = p5Helper.createElement('div');

toolbarRightSection.id('board-toolbar-rightsection')
export let buttonSwitchScribbleMode = p5Helper.createElement('div',
  ` <div class="tooltiptext">打开/关闭涂画面板</div>
    <button class="mdc-icon-button" data-tooltype='toggleScribble'>
      <svg  aria-hidden="true" data-tooltype='toggleScribble'>
        <use href="#iconqiehuan" data-tooltype='toggleScribble'></use>
      </svg>
    </button>`)
buttonSwitchScribbleMode.id('mode-switch');
buttonSwitchScribbleMode.addClass('tooltip')

toolbarRightSection.child(buttonSwitchScribbleMode);
let dataToolBtns = new Array<p5.Element>();

let toolbarLeftSection = p5Helper.createElement('div');
toolbarLeftSection.id('board-toolbar-leftsection')

let toolbarMiddleSection = p5Helper.createElement('div');
toolbarMiddleSection.id('board-toolbar-middlesection')


let buttonInsertNode = p5Helper.createElement('div',
  `  <div class="tooltiptext">添加一个 Node</div>
  <button class="mdc-icon-button" data-tooltype='insertNode'>
      <svg  aria-hidden="true" data-tooltype='insertNode'>
        <use href="#icontianjiajiedian" data-tooltype='insertNode'></use>
      </svg>
    </button>`)
    buttonInsertNode.addClass('tooltip')

dataToolBtns.push(buttonInsertNode)
toolbarMiddleSection.child(buttonInsertNode)

let buttonInsert2DArray = p5Helper.createElement('div',
  `  <div class="tooltiptext">添加一个数组</div>
  <button class="mdc-icon-button" data-tooltype='insert2DArray'>
      <svg  aria-hidden="true" data-tooltype='insert2DArray'>
        <use href="#iconadd-node" data-tooltype='insert2DArray'></use>
      </svg>
    </button>`)
    buttonInsert2DArray.addClass('tooltip')
dataToolBtns.push(buttonInsert2DArray)
toolbarMiddleSection.child(buttonInsert2DArray)

let buttonInsertMap = p5Helper.createElement('div',
  `  <div class="tooltiptext">添加一个 Map</div>
  <button class="mdc-icon-button" data-tooltype='insertMap'>
      <svg  aria-hidden="true" data-tooltype='insertMap'>
        <use href="#iconkv" data-tooltype='insertMap'></use>
      </svg>
    </button>`)
    buttonInsertMap.addClass('tooltip')
dataToolBtns.push(buttonInsertMap)
toolbarMiddleSection.child(buttonInsertMap)

let buttonInfo= p5Helper.createElement('div',
` <div class="tooltiptext">Info</div>
<button class="mdc-icon-button" id="action-info"
   data-tooltype='info'>
   <svg  aria-hidden="true" data-tooltype='info'>
     <use xlink:href="#iconinfo" data-tooltype='info'></use>
   </svg>
 </button>`)
 buttonInfo.addClass('tooltip')
 toolbarLeftSection.child(buttonInfo)


let buttonCancel = p5Helper.createElement('div',
  ` <div id="cancel-tiptext" class="tooltiptext">撤销删除</div>
  <button class="mdc-icon-button" id="action-cancel"
     data-tooltype='cancel'>
     <svg  aria-hidden="true" data-tooltype='cancel'>
       <use xlink:href="#iconchexiao" data-tooltype='cancel'></use>
     </svg>
   </button>`)
   buttonCancel.addClass('tooltip')
toolbarLeftSection.child(buttonCancel)

let btnScribbleHandEmpty = p5Helper.createElement('div', `
<div class="tooltiptext">清空画板</div>
  <button class="mdc-icon-button" id="scribble-empty" data-tooltype='empty'>
    <svg id="icon-scribble-empty" aria-hidden="true" data-tooltype='empty'>
      <use xlink:href="#iconqingkong" data-tooltype='empty'></use>
    </svg>
  </button>
  `)
  btnScribbleHandEmpty.addClass('tooltip')
toolbarLeftSection.child(btnScribbleHandEmpty)



boardToolbar.child(toolbarLeftSection)
boardToolbar.child(toolbarMiddleSection)
boardToolbar.child(toolbarRightSection)




export let dataSketchContainer = p5Helper.createElement('div')

dataSketchContainer.id('dataSketch-container');
// let insertingIcon = p5Helper.createElement('div', `
//     <svg id='insertingIcon' class="icon " aria-hidden="true" style="
//   color: #000000;
//   z-index: 4;
//   position: absolute;">
//     <use id='insertingIconUse' href="#iconadd-node"></use>
//   </svg>`);
// insertingIcon.id('insertingIcon-Container');
// insertingIcon.style('visibility', 'hidden')
// dataSketchContainer.child(insertingIcon)


dataBoardContainer.child(boardToolbar);
dataBoardContainer.child(dataSketchContainer);

let leetcodeMainContainer:HTMLElement = document.querySelector("div[class^=main__]");

// let scribbleSketchContainer = p5Helper.createElement('div');
// scribbleSketchContainer.parent(leetcodeMainContainer)
// scribbleSketchContainer.id('scribbleSketch-containter')
// export let scribbleDock = p5Helper.createElement('div');
// scribbleDock.id("scribbledock");
// scribbleSketchContainer.child(scribbleDock)

//目前scribbleToolBtns就是 middle section 中的 btn
let scribbleToolBtns = new Array<p5.Element>();
let btnScribbleHandwrite = p5Helper.createElement('div', `

  <button class="mdc-icon-button" id="scribble-handwrite" data-tooltype='handwrite'>
    <svg id="icon-scribble-handwrite"  aria-hidden="true" data-tooltype='handwrite'>
      <use xlink:href="#iconqianming" data-tooltype='handwrite'></use>
    </svg>
  </button>
`);
scribbleToolBtns.push(btnScribbleHandwrite)
toolbarMiddleSection.child(btnScribbleHandwrite)
let btnScribbleRect = p5Helper.createElement('div', `
  <button class="mdc-icon-button" id="scribble-rect" data-tooltype='rect'>
    <svg id="icon-scribble-rect"  aria-hidden="true" data-tooltype='rect'>
      <use xlink:href="#iconjuxing" data-tooltype='rect'></use>
    </svg>
  </button>
  `);
scribbleToolBtns.push(btnScribbleRect)
toolbarMiddleSection.child(btnScribbleRect)
let btnScribbleHandEllipse = p5Helper.createElement('div', `
  
  <button class="mdc-icon-button" id="scribble-ellipse" data-tooltype='ellipse'>
    <svg id="icon-scribble-ellipse"  aria-hidden="true" data-tooltype='ellipse'>
      <use xlink:href="#icontuoyuan1copy" data-tooltype='ellipse'></use>
    </svg>
  </button>
  `);
scribbleToolBtns.push(btnScribbleHandEllipse)
toolbarMiddleSection.child(btnScribbleHandEllipse)
let btnScribbleHandArrow = p5Helper.createElement('div', `
  <button class="mdc-icon-button" id="scribble-arrow" data-tooltype='arrow'>
    <svg id="icon-scribble-arrow"  aria-hidden="true" data-tooltype='arrow'>
      <use xlink:href="#iconrightbottom" data-tooltype='arrow'></use>
    </svg>
  </button>
  `);
scribbleToolBtns.push(btnScribbleHandArrow)
toolbarMiddleSection.child(btnScribbleHandArrow)
let btnScribbleHandLine = p5Helper.createElement('div', `
  <button class="mdc-icon-button" id="scribble-line" data-tooltype='line'>
    <svg id="icon-scribble-line"  aria-hidden="true" data-tooltype='line'>
      <use xlink:href="#iconline" data-tooltype='line'></use>
    </svg>
  </button>
  `);
scribbleToolBtns.push(btnScribbleHandLine)
toolbarMiddleSection.child(btnScribbleHandLine)
let btnScribbleHandText = p5Helper.createElement('div', `
  <button class="mdc-icon-button" id="scribble-text" data-tooltype='text'>
    <svg id="icon-scribble-text" aria-hidden="true" data-tooltype='text'>
      <use xlink:href="#iconwenben" data-tooltype='text'></use>
    </svg>
  </button>
  `);
scribbleToolBtns.push(btnScribbleHandText)
toolbarMiddleSection.child(btnScribbleHandText)



let leetcodeMainContentBar = document.querySelector("div[class^=css-][class*=-Content]>div")

let rightResizebar: HTMLElement = leetcodeMainContentBar.querySelector("div[class^=css-][class*=-ResizeBar]")
let leftResizebar = rightResizebar.cloneNode(true) as HTMLElement;

rightResizebar.remove();
rightResizebar = leftResizebar.cloneNode(true) as HTMLElement;
let leftContainer: HTMLElement = document.querySelector("div[class^=css-][class*=-LeftContainer]")
let rightContainer: HTMLElement = document.querySelector("div[class^=css-][class*=-RightContainer]")

leetcodeMainContentBar.insertBefore(rightResizebar, rightContainer)
leetcodeMainContentBar.insertBefore(leftResizebar, rightResizebar)
leetcodeMainContentBar.insertBefore(dataBoardContainer.elt, rightResizebar)


const resizebarWidth = 10;
const leftContainerStuckWidth = 320
const rightContainerStuckWidth = 320;
let leftContainerWidth = leftContainerStuckWidth
let rightContainerWidth = rightContainerStuckWidth
let boardWidth = document.body.scrollWidth - leftContainerWidth - rightContainerWidth
boardWidth = boardWidth > 0 ? boardWidth : 0;

leftContainer.style.width = `${leftContainerWidth}px`
rightContainer.style.width = `${rightContainerWidth}px`

window.setTimeout(() => {
  leftContainer.style.flex = `0 0 auto`
  leftContainer.style.minWidth = `${leftContainerStuckWidth}px`
  dataBoardContainer.style("flex", `1 0 0px`);
  rightContainer.style.flex = `0 0 auto`
  rightContainer.style.minWidth = `${rightContainerStuckWidth}px`

  leetcodeMainContainer.style.zIndex='2';
}, 200)


window.onresize = () => {

}
rightResizebar.onmousedown = (ev: MouseEvent) => {


  document.onmousemove = (ev: MouseEvent) => {


    rightContainerWidth = document.body.clientWidth - ev.pageX - resizebarWidth / 2;
    if (rightContainerWidth < rightContainerStuckWidth) rightContainerWidth = rightContainerStuckWidth;
    boardWidth = (document.body.clientWidth - rightContainerWidth - leftContainerWidth - 2 * resizebarWidth);

    if (boardWidth < 0) {
      rightContainerWidth = (document.body.clientWidth - leftContainerWidth - 2 * resizebarWidth);
      boardWidth = 0;
    }

    leftContainer.style.width = `${leftContainerWidth}px`
    rightContainer.style.width = `${rightContainerWidth}px`
  }
  document.onmouseup = (ev: MouseEvent) => {
    document.onmousemove = null;
    document.onmouseup = null;
  }
}

leftResizebar.onmousedown = (ev: MouseEvent) => {

  document.onmousemove = (ev: MouseEvent) => {

    leftContainerWidth = ev.pageX - resizebarWidth / 2;
    if (leftContainerWidth < leftContainerStuckWidth) leftContainerWidth = leftContainerStuckWidth;
    boardWidth = (document.body.scrollWidth - rightContainerWidth - leftContainerWidth - 2 * resizebarWidth);
    if (boardWidth < 0) {
      leftContainerWidth = (document.body.scrollWidth - rightContainerWidth - 2 * resizebarWidth);
      boardWidth = 0;
    }

    leftContainer.style.width = `${leftContainerWidth}px`
    rightContainer.style.width = `${rightContainerWidth}px`

  }
  document.onmouseup = (ev: MouseEvent) => {
    document.onmousemove = null;
    document.onmouseup = null;
  }
}




// import mdTheme from './mdTheme.scss'
export let modeScribbling = false;

buttonSwitchScribbleMode.mouseClicked((ev) => {
  switchScribbleMode()
})

export let switchScribbleMode = function () {
  modeScribbling = !modeScribbling;
  onSwitchScribbleMode();
}


function onSwitchScribbleMode() {
  
  let scribbleCanvas = p5Helper.select('#scribble-canvas');
  let cancelTiptextEle=p5Helper.select('#cancel-tiptext')
  if (modeScribbling) {

    cancelTiptextEle.html('撤销创建')
    // BoardData.pInst.loop();
    buttonSwitchScribbleMode.style('color', primaryColor)
    scribbleToolBtns.forEach(view => {
      view.show()
    });
    dataToolBtns.forEach(view => {
      view.hide();
    })
    SketchScribble.scribble_pInst.loop();
    SketchData.pInst.noLoop();
    if (scribbleCanvas)
      // scribbleCanvas.style('visibility', 'visible');
      scribbleCanvas.show()

  } else {
    cancelTiptextEle.html('撤销删除')
    if(SketchScribble.subdock) SketchScribble.subdock.remove();
    scribbleToolBtns.forEach(view => {
      view.hide()
    });
    dataToolBtns.forEach(view => {
      view.show();
    })
    buttonSwitchScribbleMode.style('color', 'inherit')

    SketchScribble.scribble_pInst.noLoop();
    SketchData.pInst.loop();
    if (scribbleCanvas)
      // scribbleCanvas.style('visibility', 'hidden');
      scribbleCanvas.hide()


  }
}
onSwitchScribbleMode();







