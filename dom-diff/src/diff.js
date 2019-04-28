function diff (oldTree, newTree) {
  // 声明变量patches用来存放补丁的对象
  let patches = {};
  // 第一次比较应该是树的第0个索引
  let index = 0;
  // 递归树 比较后的结果放到补丁里
  walk(oldTree, newTree, index, patches);
  return patches;
}

function walk (oldTree, newTree, index, patches) {
  // 每个元素都有一个补丁
  let current = [];
  if (!newTree) {
    current.push({type: 'REMOVE', index});
  } else if (isString(oldTree) && isString(newTree)) {
    // 判断文本是否一致
    if (oldTree !== newTree) {
      current.push({type: 'TEXT', text: newTree});
    }
  } else if (oldTree.type === newTree.type) {
    // 比较属性是否有更改
    let attr = diffAttr(oldTree.props, newTree.props);
    if (Object.keys(attr).length) {
      current.push({type: 'ATTR', attr});
    }
    // 如果有子节点，遍历子节点
    diffChildren(oldTree.children, newTree.children, patches);
  } else {
    // 说明节点被替换了
    current.push({type: 'REPLACE', newTree});
  }
  // 当前元素确实有补丁存在
  if (current.length) {
    // 将元素和补丁对应起来，放到大补丁包中
    patches[index] = current;
  }
}

function isString (obj) {
  return typeof obj === 'string';
}

function diffAttr (oldProps, newProps) {
  let patch = {};
  // 判断老的属性中和新的属性的关系
  for (let key in oldProps) {
    if (oldProps[key] !== newProps[key]) {
      patch[key] = newProps[key]; // 有可能还是undefined
    }
  }
  for (let key in newProps) {
    // 老节点没有新节点的属性
    if (!oldProps.hasOwnProperty(key)) {
      patch[key] = newProps[key];
    }
  }
  return patch;
}

// 所有都基于一个序号来实现
let num = 0;
function diffChildren (oldChildren, newChildren, patches) {
  // 比较老的第一个和新的第一个
  oldChildren.forEach((child, index) => {
    walk(child, newChildren[index], ++num, patches);
  })
}

export default diff;