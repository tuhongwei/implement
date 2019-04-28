/**
 *虚拟DOM实现
 */

// 虚拟DOM元素的类，构建实例对象，用来描述DOM
 class Element {
  constructor (type, props, children) {
    this.type = type;
    this.props = props;
    this.children = children;
  }
}
// 创建虚拟DOM，返回虚拟节点(object)
function createElement (type, props, children) {
  return new Element(type, props, children);
}
// render方法可以将虚拟DOM转化成真实DOM
function render (vNode) {
  // 根据type类型来创建对应的元素
  let el = document.createElement(vNode.type);
  // 再去遍历props属性对象，然后给创建的元素el设置属性
  for (let key in vNode.props) {
    setAttr(el, key, vNode.props[key]);
  }
  // 遍历子节点
  // 如果是虚拟DOM，就继续递归渲染
  // 不是就代表是文本节点，直接创建
  vNode.children.forEach(child => {
    child = child instanceof Element ? render(child) : document.createTextNode(child);
    // 添加到对应元素内
    el.appendChild(child);
  });
  return el;
}
// 设置属性
function setAttr (el, key, value) {
  switch (key) {
    case 'value':
      // el是一个input或者textarea就直接设置其value即可
      if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
        el.value = value;
      } else {
        el.setAttribute(key, value);
      }
      break;
    case 'style':
      // 直接赋值行内样式
      el.style.cssText = value;
      break;
    default: 
      el.setAttribute(key, value);
      break;
  }
}
// 将元素插入到页面内
function renderDom (el, target) {
  target.appendChild(el);
}
export {
  Element,
  createElement,
  render,
  setAttr,
  renderDom
}