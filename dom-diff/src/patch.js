import { Element, render, setAttr } from './element';

let allPatches;
// 默认哪个需要打补丁
let index = 0;

function patch (node, patches) {
  allPatches = patches;
  // 给某个元素打补丁
  walk(node);
}
function walk (node) {
  let current = allPatches[index++];
  let childNodes = node.childNodes;
  if (current) {
    doPatch(node, current);
  }
  childNodes.forEach(child => walk(child));
}

function doPatch (node, patches) {
  // 遍历所有打过的补丁
  patches.forEach(patch => {
    switch(patch.type) {
      case 'ATTR': 
        for (let key in patch.attr) {
          let value = patch.attr[key];
          if (value) {
            setAttr(node, key, value);
          } else {
            node.removeAttribute(key);
          }
        }
        break;
      case 'TEXT': 
        node.textContent = patch.text;
        break;
      case 'REPLACE': 
        let newTree = patch.newTree;
        let newNode = newTree instanceof Element ? render(newTree) : document.createTextNode(newTree);
        newNode.parentNode.replaceChild(newNode, node);
        break;
      case 'REMOVE': 
        node.parentNode.removeChild(node);
        break;
      default:
        break;
    }
  });
}

export default patch;