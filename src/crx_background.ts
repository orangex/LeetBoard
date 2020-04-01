
//点击浏览器按钮打开主页
chrome.browserAction.onClicked.addListener(function (tab) {
    // No tabs or host permissions needed!
    chrome.tabs.create({
        url: "https://orangex.github.io/LeetBoard/"
    });
});




chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg == 'launch'){
        chrome.tabs.executeScript(sender.tab.id,{
            file: 'crx_bundle.js'
        });
        console.log('onMessage')
    }

});