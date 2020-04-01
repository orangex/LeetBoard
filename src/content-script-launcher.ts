

let cnt=0;
function reLaunch(time:number){
    let leetcodeMainContainer: HTMLElement = document.querySelector("div[class^=main__]");
    let leetcodeAsyncLoadedSymbol=document.querySelector("div[class*=tab-pane__1SHj][data-key=description-content]>div");
    let leftContainer=document.querySelector("div[class^=css-][class*=-LeftContainer]") as HTMLElement;

    // tab-pane__1SHj css-kynh2q-TabContent e16udao5
    if(time>=8) return;
    if(leetcodeAsyncLoadedSymbol && leftContainer && leftContainer.style.flexGrow!=="0") {

        chrome.runtime.sendMessage("launch");
        return;
    }

    window.setTimeout(()=>{
        reLaunch(time+1);
    },200) 
}
reLaunch(0);