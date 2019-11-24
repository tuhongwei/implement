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
  let promise = this;
  return new Promise((resolve, reject) => {
    function success (value) {
      let val = typeof onFulfilled === 'function' && onFulfilled(value) || value;
      if (val && typeof val['then'] === 'function') {
        val.then(value => {
          resolve(value);
        }, reason => {
          reject(reason);
        });
      } else {
        resolve(val);
      }
    }
    function erro (reason) {
      let rea = typeof onRejected === 'function' && onRejected(reason) || reason;
      reject(reason);
    }
    if (promise.status === 'PENDING') {
      promise.resolves.push(success);
      promise.rejects.push(erro);
    } else if (promise.status === 'FULFILLED'){
      console.log('FULFILLED')
      success(promise.value);
    } else if (promise.status === 'REJECTED'){
      onsole.log('REJECTED')
      erro(promise.reason);
    }
  });
}
Promise.prototype.catch = (onRejected) => {
  return this.then(null, onRejected);
}
function getInfo(success, fail) {
  return new Promise((resolve, reject) => {
    setTimeout(_ => {
      let ran = Math.random();
      console.log(success, ran);
      if (ran > 0.5) {
        resolve(success);
      } else {
        reject(fail);
      }
    }, 200);
  })
}
getInfo('Vchat', 'fail').then(res => {
  console.log(res);
  return getInfo('可以线上预览了', 'erro');
}, rej => {
  console.log(rej);
}).then(res => {
  console.log(res);
}, rej => {
  console.log(rej);
});