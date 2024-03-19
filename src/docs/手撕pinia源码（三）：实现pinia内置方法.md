# 手撕`pinia源码`目录

[手撕pinia源码（一）： pinia的使用](https://juejin.cn/post/7330904102023594011#heading-8)

[手撕pinia源码（二）：实现defineStore](https://juejin.cn/spost/7330847148182667283)

[手撕pinia源码（三）：实现pinia内置方法](https://juejin.cn/post/7331070732967968806)

[源码地址传送门](https://gitee.com/infatuation5858/pinia-custom)

## $patch实现

对当前状态应用状态补丁。可以同时批量设置状态值，传入一个回调函数，回调函数接收一个`store`参数可访问当前仓库的所有属性方法。
`$patch`有两种使用方式

```javascript
import { useCounterStore } from './stores/counter';
const store = useCounterStore();
store.$patch({counter: 1000})
// or
store.$patch((data) = {
   data.counter = 1000;
})
```

### 代码编写

```javascript
// store.js
function isObject(val) {
    return typeof val === 'object' && val !== null;
}

function mergeReactiveObject(target, state) {
    for (let key in state) {
        let oldValue = target[key];
        let newValue = state[key];
        if (isObject(oldValue) && isObject(newValue)) {
            target[key] = mergeReactiveObject(oldValue, newValue);
        } else {
            target[key] = newValue;
        }
    }
    return target;
}
function createSetupStore(id, setup, pinia, isOptions) {
    function $patch(partialStateOrMutatior) {
        // 判断入参类型
        if (typeof partialStateOrMutatior === 'object') {
            mergeReactiveObject(pinia.state.value[id], partialStateOrMutatior);
        } else {
            partialStateOrMutatior(pinia.state.value[id]);
        }
    }

    const partialStore = {
        $patch
    }
    const store = reactive(partialStore);
    ...代码省略
}
```

修改`createSetupStore`方法。

- 代码26行，实现`pinia`内置方法
- 代码19行，实现`$patch`方法
  - 代码21行，判断入参为`object`,则是第一种用法，那么需要将两个对象合并即可，
    - `mergeReactiveObject`就是简单的递归对象合并
  - 代码23行，如果不是对象，则是`function`，此时只需要执行用户传入的函数，并且获取到当前的`store`返回给用户，让用户操作即可，`pinia.state.value[id]`是`ref`响应式对象，所以用户可以直接修改就能触发响应。

## $reset

通过构建新的状态对象，将存储重置为初始状态。此API只能用于通过`options`方式构建的`store`，后面会讲解为何只有`options`方式构建的`store`才支持此API。

### 代码编写

```javascript
// store.js
function createOptionsStore(id, options, pinia) {
    ...代码省略
    
    const store = createSetupStore(id, setup, pinia, true); 
    store.$reset = function () {
        const newState = state ? state() : {};
        store.$patch((state) => { 
            Object.assign(state, newState);
        })
    }
    return store;
}
```

- 代码6行，给`createOptionsStore`构建的`store`添加一个`$reset`方法
  - 代码7行，重新调用用户定义的`state`函数，即可获取初始值，所以`$reset`方法只能用在`options`定义的`store`中，因为如果是`setup`形式的话，我们无法获取到起初始值是什么。
  -代码8行，直接调用我们刚刚编写的`$patch`函数，用初始状态覆盖掉当前状态即可。

## $subscribe

设置一个回调，以便在状态更改时调用。它还返回一个函数来删除回调。

### 代码编写

```javascript
// store.js
function createSetupStore(id, setup, pinia, isOptions) {
    function $subscribe(callBack) {
        watch(pinia.state.value[id], (state) => {
            callBack({ storeId: id }, state)
        });
    }
    const partialStore = {
        $patch,
        $subscribe
    }
    ...代码省略
}
```

- 代码10行，添加一个`$subscribe`内置方法
  - 代码3行，实现`subscribe`方法，
  - 代码4行，代码非常简单，调用`vue`的`watch`API，监听当前的`store`属性的变化，当属性变化时，调用用户传递的`callBack`函数，组装好用户需要的参数返回即可。

## $onAction

设置一个回调函数，每次调用操作时执行此回调函数，并且回调函数接收一个参数，参数包含所有操作信息
,`$onAction`的使用示例

```javascript
import { useCounterStore } from './stores/counter';
const store = useCounterStore();
store.$onAction(function ({after, onError}) {
    after((result) => { // 修改后的结果 })
    after((result) => { // 修改后的结果 })
    after((result) => { // 修改后的结果 })
    onError((error) => { // 执行错误 })
})
```

观察上面代码，`after`是可以被多次调用的，我们可以发现，这种形式就是利用发布订阅模式，缓存所有的订阅函数，当调用时执行这些订阅函数。

### 代码编写

```javascript
// 新建一个subscribe.js
export function addSubscription(subscriptions, callback) {
    subscriptions.push(callback);
    const removeSubscription = () => {
        const idx = subscriptions.indexOf(callback);
        if (idx > -1) {
            subscriptions.splice(idx, 1);
        }
    }
    return removeSubscription;
}

export function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach(cb => cb(...args));
}
```

```javascript
// store.js
import { addSubscription, triggerSubscriptions } from './subscribe';
let actionSubscriptions = [];

const partialStore = {
    $patch,
    $subscribe,
    $onAction: addSubscription.bind(null, actionSubscriptions)
}
...代码省略
function warpAction(name, action) {
        return function (callBack) {
            const afterCallbackList = [];
            const onErrorCallbackList = [];
            function after(callBack) {
                afterCallbackList(callBack);
            }
            function onError(callBack) {
                onErrorCallbackList(callBack);
            }
            triggerSubscriptions(actionSubscriptions, {after, onError});
            try {
                let res = action.apply(store, arguments);
                triggerSubscriptions(afterCallbackList, res)
            } catch(error) {
                triggerSubscriptions(onErrorCallbackList, error);
            }

            if (res instanceof Promise) {
                return res.then((value) => {
                    triggerSubscriptions(afterCallbackList, value)
                }).catch(error => {
                    triggerSubscriptions(onErrorCallbackList, error);
                })
            }
            return res;
        }
    }
    ... 代码省略
```

- 代码`subscribe.js`是一个经典的发布订阅模式，如果不了解发布订阅模式可以看我另一篇文章有详细解读。[传送门](https://juejin.cn/post/7293401396437827619)
- 代码8行，定义一个`$onAction`的内置方法，当调用这个内置方法的时候，会执行订阅函数收集起来。
- 代码11行，修改`warpAction`函数，在调用方法时执行此函数
  - 代码13行，分别定义`afterCallbackList`和`onErrorCallbackList`，因为`after`和`onError`是可以被多次调用的，所以也是一个发布订阅模式
  - 代码15行，提供`after`方法，当用户调用`after`时，将参数存入`afterCallbackList`，代码18行同理。
  - 用户调用`action`时，触发`triggerSubscriptions`发布所有的`onAction`订阅者，入参包含`after`和`onError`提供给用户使用。
  - 代码23行，执行完`action`后，触发`triggerSubscriptions`发布给所有的`after`订阅者，入参为最新的状态值。
  - 代码25行，同理，当执行`action`报错，触发`triggerSubscriptions`发布给所有的`onError`订阅者，入参为报错信息。
  - 代码29行，因为`action`是允许写异步方法的，所以有可能`action`的执行结果返回的是一个`promise`，所以判断其是否是`Promise`，如果是则调用起`then`方法等待执行完毕后再通知`after`订阅者，同上。

## 结束

总结`手撕pinia源码`系列技术文章，我如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得`pinia`非常简单们详细剖析了`pinia`源码，从源码的角度实现了一个简单版的`pinia`，当然还有很多特殊场景没有处理，但是能够理解`pinia`核心我认为就足够了，主要学习的是其设计思想，最后如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得`pinia`非常简单。

![Filmage 2024-01-29_221446.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e926abb779a04186b32699dfff40456d~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=540&h=334&s=202704&e=gif&f=215&b=191919)
