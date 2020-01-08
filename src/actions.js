// function insert2DArray(pos,rowNum,colNum) {
//     if(rowNum&&colNum) 
//         insert2DArrayWithSize(pos,rowNum,colNum);
//     else
//         insert2DArrayWithSize(pos,3,4);
// }
// function insert2DArrayWithSize(pos,rowNum,colNum) {
//     let array2D=new Array2D(pos, rowNum,colNum);
//     elements.push(array2D);
//     elementGroups.push(array2D);
// }

// function insertBinarytree(pos) {
//     insertBinarytreeRandom(pos.x - 80, pos.x + 80, pos.y, 8);
// }

// function insertBinarytreeRandom(limitL, limitR, y, num) {
//     if (num == 0) return null;
//     let pos = sketchScribble.createVector((limitL + limitR) / 2, y);
//     let node = createNode(pos);
//     //sketch.nodes.push(node)
//     let lnum = Math.floor(Math.random() * num);
//     let rnum = num - 1 - lnum;

//     let left = insertBinarytreeRandom(limitL, pos.x, pos.y + 70, lnum);
//     let right = insertBinarytreeRandom(pos.x, limitR, y + 70, rnum);
//     if (left) {
//         union(node, left, left);
//     }
//     if (right) {
//         union(node, right, right);
//     }
//     return node;
// }

// function createNode(pos) {
//     let node = new Node(pos);
//     // var re = /^[0-9]+.?[0-9]*/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/;
//     if (!isNaN(lastTitle)) {
//         lastTitle++;
//         node.content = lastTitle;
//     }
//     elements.push(node);

//     let group = new NodeGroup([node]);
//     node.groupBelong = group;
//     elementGroups.push(group);
//     return node;
// }

// function union(nodeA, nodeB, directionTo) {
//     let groupA = nodeA.groupBelong;
//     let groupB = nodeB.groupBelong;

//     if (groupA == groupB) return;
//     let l = new Link(lastLinkID++, nodeA, nodeB, directionTo);
//     console.log('and the line attached');
//     links.push(l);
//     //添加进边集的同时维护邻接表
//     nodeA.linkmap.set(nodeB, l);
//     nodeB.linkmap.set(nodeA, l);
//     //合并从属 group
//     groupA.addNodes(groupB.nodes);
//     // =groupA.nodes.concat(groupB.nodes);
//     // groupB.nodes.forEach(node => {
//     //     node.groupBelong=groupA;
//     // });
//     elementGroups.splice(elementGroups.indexOf(groupB), 1);
// }