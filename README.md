## 最近更新
- v1.3 2020/04/01

  应急切需求，增加了收起画板的功能

  

---

## 安装使用

Chrome 不再允许拖动 .crx 直接安装拓展，点击[这里](https://chrome.google.com/webstore/detail/leetboard/epgkhlehioniabckannelkbnpdjgjfan)前往 Chrome 应用商店安装(需科学上网)

打开 [leetcode-cn.com](https://leetcode-cn.com/problemset/all/) ,随意进入任意题目即可。

## 目的/意义

希望这个小玩意儿可以让你在（ LeetCode ）学习算法数据结构、思考题目时帮助自己更直观的理解问题，更高效的理清头绪。

当然你甚至可以通过截图、视频把使用它来思考和解决问题的过程分享出来。

## 简单展示

- 快速添加元素

  ![](https://github.com/orangex/LeetBoard/blob/master/readmeRes/insert.gif?raw=true)

- 将格式化的数组、树可视化

  ![](https://github.com/orangex/LeetBoard/blob/master/readmeRes/paste.gif?raw=true)

- 元素提供简单的交互

  ![](https://github.com/orangex/LeetBoard/blob/master/readmeRes/edit.gif?raw=true)

- 一个可以呼出的涂画层

  ![](https://github.com/orangex/LeetBoard/blob/master/readmeRes/scribble.gif?raw=true)

  

## 待办

- [ ] 最近这台老本子风扇直呼呼，调查一下性能方面可能的 bug
- [ ] 调色板的可选颜色的调整
- [ ] 一键生成当前画板截图并复制到剪贴板
- [ ] ？尝试将涂画层拿掉，不再区分涂画元素和基础数据元素
- [ ] ？LeetCode 国际版的支持，或是独立版网页
- [ ] 画板内容记忆
- [ ] 父子节点的快速添加
- [x] 收起和展开画板
- [ ] 等你来提~


## 其他

其实我也是一边刷题一边发现需求的，目前产品以嵌入 LeetCode 页面的形式存在。如果有什么建议、想说的，可以提 issue 或者邮件 rampaging9@gmail.com 

---

- 关于鼠标交互
其实我自己也知道好像有点别扭，主要原因是没有双击这个操作，本来双击很方便做的事现在要交给其他途径来做，挤压了交互设计的空间。但是要引入、判断双击，那所有的单击事件就势必会有延迟，比如按下开始拖拽这个交互，如果按下的判断有延迟，体验上就离谱……不知道各位有没有什么好办法，欢迎探讨。

