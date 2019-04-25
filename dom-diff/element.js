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