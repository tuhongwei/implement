function isFunction (obj) {
    return typeof obj === 'function';
}
function isObject (obj) {
    return !!(obj && typeof obj === 'object');
}
function isPromise (obj) {
    return obj instanceof Promise;
}
function isThenable (obj) {
    return (isFunction(obj) || isObject(obj)) && 'then' in obj;
}
function transition (promise, state, result) {
    if (promise.state !== 'pending') return;
    promise.state = state;
    promise.result = result;
    setTimeout(() => promise.callbacks.forEach(callback => handleCallback(callback, state, result)));
}
function resolvePromise (promise, result, resolve, reject) {
    if (promise === result) {
        return reject(new TypeError('Chaining cycle detected for promise'));
    } 
    if (isPromise(result)) {
        return result.then(resolve, reject);
    } 
    if (isThenable(result)) {
      try {
        let then = result.then;
        if (isFunction(then)) {
          return new Promise(then.bind(result)).then(resolve, reject);
        }
      } catch (error) {
        return reject(error);
      }
    }
    resolve(result);
}
function handleCallback (callback, state, result) {
    let { onFulfilled, onRejected, resolve, reject } = callback;
    try {
        if (state === 'fulfilled') {
            isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result);
        } else if (state === 'rejected') {
            isFunction(onRejected) ? resolve(onRejected(result)) : reject(result);
        }
    } catch (e) {
        reject(e);
    }
}
class Promise {
    constructor (executor) {
        this.state = 'pending';
        this.result = undefined;
        this.callbacks = [];
        let onFulfilled = value => transition(this, 'fulfilled', value);
        let onRejected = reason => transition(this, 'rejected', reason);
        // 保证 resolve 或 reject 只有一次调用
        let flag = false;
        let resolve = value => {
            if (flag) return;
            flag = true;
            resolvePromise(this, value, onFulfilled, onRejected);
        };
        let reject = reason => {
            if (flag) return;
            flag = true;
            onRejected(reason);
        };
        try {
           executor(resolve, reject); 
        } catch (e) {
            reject(e);
        }
    }
    then (onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
            let callback = { onFulfilled, onRejected, resolve, reject };
            if (this.state === 'pending') {
                this.callbacks.push(callback);
            } else {
                setTimeout(() => {
                    handleCallback(callback, this.state, this.result);
                });
            }
        });
    }
    catch (onRejected) {
        this.then(undefined, onRejected);
    }
    finally (onFinally) {
        
    }
    static resolve (value) {
        if (isPromise(value)) return value;
        return new Promise ((resolve, reject) => resolve(val));
    }
    static reject (reason) {
        return new Promise ((resolve, reject) => reject(reason));
    }
    static all (iterable) {
        
    }
    static allSettled (iterable) {
        
    }
    static any (iterable) {
        
    }
    static race (iterable) {
        
    }
}
// 目前是通过他测试 他会测试一个对象
// 语法糖
Promise.defer = Promise.deferred = function () {
  let dfd = {}
  dfd.promise = new Promise((resolve,reject)=>{
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}
module.exports = Promise;
//npm install promises-aplus-tests 用来测试自己的promise 符不符合promisesA+规范
