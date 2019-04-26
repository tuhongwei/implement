import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

import { createElement, render, renderDom } from './element';

let vNode = createElement('ul', {class: 'list'}, [
  createElement('li', {class: 'item'}, ['周杰伦']),
  createElement('li', {class: 'item'}, ['林俊杰']),
  createElement('li', {class: 'item'}, ['王力宏'])
]);
console.log(vNode);
// 渲染虚拟DOM得到真实的DOM结构
let el = render(vNode);
console.log(el);

// 直接将DOM添加到页面内
renderDom(el, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
