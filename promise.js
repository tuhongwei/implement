/**
 * promise实现
 */

const isFunction = (val) => {
  return typeof val === 'function';
};

function Promise (Fn) {
  // 初始为'PENDING'状态
  this.status = 'PENDING';
  this.value;
  this.reason;
  // 存储onFulfilled
  this.resolves = [];
  // 存储onRejected
  this.rejects = [];
  // let resolve = (value) => {
  //   if (this.status === 'PENDING') {
  //     // 加上异步处理，保证then方法先执行
  //     setTimeout(() => {
  //       //状态转换为FULFILLED
  //       //执行then时保存到resolves里的回调
  //       //如果回调有返回值，更新当前value
  //       this.status = 'FULFILLED';
  //       this.resolves.forEach(fn => {
  //         value = fn(value) || value;
  //       });
  //       this.value = value;
  //     });
  //   }
  // }
  // let reject = (reason) => {
  //   if (this.status === 'PENDING') {
  //     // 加上异步处理，保证reject方法先执行
  //     setTimeout(() => {
  //       //状态转换为REJECTED
  //       //执行then时保存到rejects里的回调
  //       //如果回调有返回值，更新当前reason
  //       this.status = 'REJECTED';
  //       this.rejects.forEach(fn => {
  //         reason = fn(reason) || reason;
  //       });
  //       this.reason = reason;
  //     });
  //   }
  // }
  let transition = (status, val) => {
    if (this.status === 'PENDING') {
      // 加上异步处理，保证方法先执行
      setTimeout(() => {
        //状态转换为REJECTED
        //执行then时保存到rejects里的回调
        //如果回调有返回值，更新当前reason
        this.status = status;
        let f = status === 'FULFILLED',
        queue = this[f ? 'resolves' : 'rejects'];
        queue.forEach(fn => {
          val = fn(val) || val;
        });
        this[f ? 'value' : 'reason'] = val;
      });
    }
  }
  let resolve = (val) => {
    transition('FULFILLED', val);
  }
  let reject = (reason) => {
    transition('REJECTED', reason);
  }
  try {
    Fn(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

Promise.prototype.then = (onFulfilled, onRejected) => {
  if (this.status === 'PENDING') {
    isFunction(onFulfilled) && this.resolves.push(onFulfilled);
    isFunction(onRejected) && this.rejects.push(onRejected);
  } else if (this.status === 'FULFILLED'){
    isFunction(onFulfilled) && onFulfilled(this.value);
  } else if (this.status === 'REJECTED'){
    isFunction(onRejected) && onRejected(this.reason);
  }
  return this;
}
Promise.prototype.catch = (onRejected) => {
  return this.then(null, onRejected);
}
let getInfo = new Promise((resolve, reject) => {
  resolve('success');
}).then(r => {
  console.log(r);
  return r + '1';
}).then(r => {
  console.log(r);
  return r + '2';
});

setTimeout(() => {
  getInfo.then(r => {
    console.log(r);
    return r + '3';
  });
});