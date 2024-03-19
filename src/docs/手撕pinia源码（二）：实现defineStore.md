# 手撕`pinia源码`目录

[手撕pinia源码（一）： pinia的使用](https://juejin.cn/post/7330904102023594011#heading-8)

[手撕pinia源码（二）：实现defineStore](https://juejin.cn/spost/7330847148182667283)

[手撕pinia源码（三）：实现pinia内置方法](https://juejin.cn/post/7331070732967968806)

[源码地址传送门](https://gitee.com/infatuation5858/pinia-custom)

## 前期准备

## 安装vue

根据[vue官网](https://cn.vuejs.org/guide/quick-start.html)快速搭建一个项目，删掉不必要的文件，以免影响我们开发，只保留最简洁的功能页面即可。

## 创建pinia

在`/src`目录下创建`pinia`目录，并新建一个入口文件`index.js`。新建`createPinia.js`文件，此文件提供`createPinia`方法是插件在vue中注册的方法。新建`store.js`文件，此文件提供`defineStore`方法，用于定义一个`store`仓库的方法。

```javascript
// createPinia.js
export function createPinia() {
}
```

```javascript
// store.js
export function defineStore() {
}
```

```javascript
// index.js
import { createPinia } from "./createPinia.js";
import { defineStore } from './store';

export {
    createPinia,
    defineStore
}
```

这就是`pinia`的基本结构，`index.js`直接导出`createPinia、defineStore`方法供外部使用即可。

接下来修改`main.js`注册`pinia`插件，报错没关系，因为我们还没有实现`createPinia`方法。

```javascript
// main.js
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from '@/pinia'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
```

最终的项目目录结构如下：

```text
.
├── README.md
├── index.html
├── jsconfig.json
├── package.json
├── src
│   ├── App.vue
│   ├── assets
│   │   ├── base.css
│   │   ├── logo.svg
│   │   └── main.css
│   ├── main.js
│   ├── pinia
│   │   ├── createPinia.js
│   │   ├── index.js
│   │   └── store.js
└── vite.config.js
```

## 实现createPinia方法

`vue`插件规定必须实现一个`install`方法，`install`方法能够获取到当前的`app`实例，因此我们修改一下`createPinia.js`

```javascript
// createPinia.js
export function createPinia() {
    const pinia = {
        install(app) {
        }
    }
    return pinia;
}
```

### 源码分析

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e4bb6dfb428a4fa98bc10e3170d29147~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1320&h=1476&s=255297&e=png&a=1&b=1f1f1f)

1. `pinia`中实例总是全局的，所以我们需要给`app`挂载全的`pinia`实例。
2. 源码中`_s`，`pinia`支持多仓库，而他的仓库存储的数据结构大致为`{id1: store1, id2: store2}`这种形式，因此我们需要创建一个对象存储所有的仓库。
3. 源码中`_e`是一个`effectScope`的`vue`API，[官方解释effectScope](https://cn.vuejs.org/api/reactivity-advanced.html#effectscope)，它可以收集所有的`副作用函数`通过调用`stop`来让所有的响应式数据停止响应，后续我们再详细介绍它是干什么用的，而`副作用函数`可谓是`vue`响应式的核心，可以理解为如果关闭了`副作用函数`那么数据变化，视图也不会变化。
4. 源码中`state`是一个`ref`的响应式对象，其主要用于存储所有`store`的状态值。

### 编写代码

```javascript
// createPinia.js
import { effectScope, ref } from 'vue';
import { piniaSymbol } from './rootStore';

export function createPinia() {
    const scope = effectScope();
    const state = scope.run(() => ref({})); // 用于存储每个store的state方法
    const pinia = {
        _s: new Map(), // 用来存储所有的store实例，{storeName: store, storeName2: store2}
        _e: scope, // effectScope实例
        state, // 存储所有store的state状态值
        install(app) {
            // 注入依赖
            app.provide(piniaSymbol, pinia); // 让所有的store都能够拿到pinia实例

            app.config.globalProperties.$pinia = pinia;
        }
    }
    return pinia;
}
```

```javascript
// rootStore
export const piniaSymbol = Symbol();
```

- 代码6行，创建一个`effectScope`，将该实例挂载到`pinia`实例中，命名为`_e`。
- 代码7行，创建一个`ref`响应式对象，将对象挂载到`pinia`实例中，命名为`state`。
- 代码9行，创建一个`Map`对象，`store`存储形式是`{id1: store1, id2: store2}`的，所以id不允许重复，因此用`Map`来做存储会方便许多。
- 代码14行，插件被注册时，需要在`vue`全局属性中挂载`$pinia`，同时`provide`注入依赖，提供给全局使用，名称跟官方一样用symbol值。

`createPinia`方法就基本完成了，是不是非常简单呢，接着进入到核心代码的编写`defineStore`。

## 实现defineStore方法

### 源码分析

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/62e08b2b0dba4206af6c6aa04ab5844e~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1564&h=2890&s=698453&e=png&a=1&b=1f1f1f)

1. `defineStore`有三个入参，分别是`idOrOptions、setup、setupOptions`，上一章我们讲到，`defineStore`的三种用法。
2. 可以从源码`1678行`看到，默认是有`id`和`options`选项，通过类型判断用户入参进行相关的处理。
3. 源码`1747`行，返回了`useStore`实例给用户调用，再看看`useStore`的实现，源码`1697`行注入依赖`pinia`实例，然后在源码`1706`行获取`pinia`实例的`_s`是否有保存`id`这个`store`，如果没有就进行初始化，初始化分情况调用了`createSetupStore`和`createOptionsStore`两种方法。

### 编写代码

```javascript
// store.js
export function defineStore(idOrOptions, setup) {
    let id, options;
    const isSetupStore = typeof setup === 'function';
    // 如果第一个参数是string,那么它就是id
    if (typeof idOrOptions === 'string') {
        id = idOrOptions;
        options = setup;
    } else {
        id = idOrOptions.id;
        options = idOrOptions;
    }

    function useStore() {
        // 获取当前组件实例，拿到pinia实例
        const instance = getCurrentInstance();
        const pinia = instance && inject(piniaSymbol);
        // 判断是否初始化，如果pinia._s没有这个id，则设置一个
        if (!pinia._s.has(id)) {
            // 判断第二个参数是否是一个函数，如果是函数那么则是使用compositio形式
            if (isSetupStore) {
                createSetupStore(id, setup, pinia);
            } else {
                createOptionsStore(id, options, pinia);
            }
        }
        const store = pinia._s.get(id);
        return store;
    }
    return useStore;
}
```

- 代码4行，判断第二个参数是否为一个函数，如果是函数，则是`composition`API,如果不是函数，则是`options`API。
- 代码6行，判断第一个参数是否为`string`类型，如果是，则它就是该`store`的唯一值`id`，否则从第二个参数中取`id`。
- 代码14行，实现一个`useStore`方法返回`store`实例。
- 代码17行，通过`getCurrentInstance`API获取当前的`vue`实例，如果有实例，则注入依赖`piniaSymbol`获取到`pinia`实例。
- 代码19行，从`pinia._s`中通过`id`取`store`值，如果没取到，进行初始化。
- 代码21行，根据`isSetupStore`判断调用`createSetupStore`方法还是`createOptionsStore`方法。
- 代码27行，获取到`store`实例，用户调用`useStore`时就能获取到对应的`store`。

## 实现createSetupStore和createOptionsStore方法

### createSetupStore源码分析

createSetupStore源码有点长，我们截取核心部分分析。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c229c868c5be4c8db2b07d418e2ec616~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1710&h=1418&s=397302&e=png&a=1&b=1f1f1f)

1. 源码1403，`partialStore`是`pinia`自带的方法和属性，我们在下一章会实现这里面的方法，`store`变量是将原属性和用户定义的属性和方法合并。
2. 源码1440，将`store`存储到`pinia._s`下，方便后面二次读取就无需再进行初始化。
3. 源码1443，将用户传入的`setup`也是用`effectScope`包一层。
4. 源码1445，循环用户传入的`setup`，因为用户传入的`setup`是散乱的，他和`options`不同，需要判断用户到底写的是`state`状态，还是方法，又或者它是一个`computed`属性，所以需要循环对这些进行处理
5. 循环内容大致逻辑就是，将所有的状态存储到`pinia.state`中，将所有函数重新绑定`this`，因为如果用户将方法结构出来使用的话，`this`就会错误或丢失，例如: `const { increment } = useCounterStore()`，这时调用`increment`时，`this`并不是指向`store`无法取到值。

### createSetupStore编写代码

```javascript
// store.js
import { getCurrentInstance, inject, reactive, effectScope, computed, isRef, isReactive } from 'vue';
function isComputed(v) {
    return (isRef(v) && v.effect);
}
function createSetupStore(id, setup, pinia, isOptions) {
    let scope;
    const partialStore = reactive({});
    const initState = pinia.state.value[id];
    if (!initState) {
        pinia.state.value[id] = {};
    }
    const setupStore = pinia._e.run(() => {
        scope = effectScope();
        return scope.run(() => setup());
    });

    function warpAction(name, action) {
        return function () {
            let res = action.apply(partialStore, arguments);
            return res;
        }
    }
    for(let key in setupStore) {
        const prop = setupStore[key];
        if (typeof prop === 'function') {
            setupStore[key] = warpAction(key, prop);
        }
        if (!isOptions) {
            // 如果setup API 需要拿到状态存到全局的state中, computed也是ref，需要另外处理
            if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
                pinia.state.value[id][key] = prop;
            }
        }
    }
    pinia._s.set(id, partialStore);
    Object.assign(partialStore, setupStore);
    return partialStore;
}
```

- 代码8行，`reactive`实现一个响应式对象，用于存储`pinia`的内置方法。
- 代码9行，先通过`pinia.state`获取`state`状态，如果没有，进行初始化。
- 代码11行，给定一个`pinia.state`的默认值为`{}`。
- 代码13行，调用`pinia._e`执行run方法，然后再定一个当前`store`的`effectScope`方法，执行用户传入的`setup`函数，`effectScope`是可以嵌套使用的，可以假设为`pinia._e`是全局的控制的是整个`pinia`的响应式，而当前的`effectScope`是当前`store`局部的，控制的是当前`store`的响应式。
- 代码24行，循环所有用户定义的`setup`，判断如果是`function`的话，调用`warpAction`重新绑定`this`的指向。
- 代码32行，需要区分哪些是用户的状态，我们要先了解，`const a = ref(a);`这种是用户定义的状态，所以我们可以调用`isRef、isReactive`来判断。但是有一点需要注意，`const b = computed()`，此时`isRef(b) === true`，就是说`computed`也是`ref`，我们要另外判断是不是`computed`属性。
- 代码3行，判断一个属性是否为`computed`，首先它一定是`ref`，其次，判断`computed`下是否有`effect`这个方法，这里关于`vue`源码不多赘述。
- 代码36行，将用户定义的`store`和`pinia`内置属性方法合并，存储到`pinia._s`中，后面二次调用`useStore`时无需再初始化，直接取值就能返回。

### createOptionsStore源码分析

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/923bb2fb175b412799a13e558b436cc9~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1826&h=1634&s=439482&e=png&a=1&b=1f1f1f)

1. 源码1196行，初始化`pinia.state`的属性，源码1204行，执行用户传入的`state`方法（`options`API中，所有的state是函数，getter是对象，action是对象）将其存储到全局的`state`。
2. 源码1209行，获取用户定义的`state`属性，要知道用户定义只是一个普通的值，并不具有响应式，所以需要`toRefs`让所有对象转成响应式。
3. 源码1217行，处理用户定义的`getter`，用户定义时也是一个普通函数，所以也需要将其处理为`computed`，源码1228行`.call`绑定的`this`一定要指向自己`sotre`（通过`pinia._s`获取，不用担心获取不到，因为`computed`是用户取值时才执行，所以`pinia._s`已经存在。
4. 代码1233行，调用刚刚的`createSetupStore`方法，可以看到其实`options`和`composition`都用同一套逻辑，只是当用户使用`options`时，我们给他重新组装一个`setup`然后交给`createSetupStore`函数处理。

### createOptionsStore编写代码

```javascript
// store.js
// 创建选项式的store
function createOptionsStore(id, options, pinia) {
    const { state, getters, actions } = options;

    function setup() {
        const localState = pinia.state.value[id] = state ? state() : {};
        return Object.assign(toRefs(ref(localState).value), actions, Object.keys(getters).reduce((memo, name) => {
            memo[name] = computed(() => {
                let store = pinia._s.get(id);
                return getters[name].call(store, store);
            })
            return memo;
        }, {}));
    }
    return createSetupStore(id, setup, pinia, true); 
}
```

- 代码7行，将所有的状态存储到全局的`pinia.state`中。
- 代码8行，处理用户的`state`和`getter`，`state`转成`ref`，而`getter`则循环将所有的属性重新用`computed`进行绑定即可，跟源码实现差不多。

## 测试demo

```vue
// App.vue
<template>
    <div>
        <div>{{ store.counter }} / {{ store.dobuleCount }}</div>
        <button @click="handleClick">optionsStore</button>
    </div>
    <div>
        <div>{{ store2.counter }}/ {{ store2.dobuleCount }}</div>
        <button @click="handleClick2">setupStore</button>
    </div>
</template>

<script setup>
import { useCounterStore } from './stores/counter';
import { useCounterStore2 } from './stores/counter2';

const store = useCounterStore();
const store2 = useCounterStore2();

function handleClick() {
    store.increment();
}
function handleClick2() {
    store2.increment();
}
</script>
```

options形式定义store

```javascript
// store/counter.js
import { defineStore } from '@/pinia'

export const useCounterStore = defineStore('counterStore', {
  state: () => {
    return {
      counter: 0
    }
  },
  actions: {
    increment() {
      this.counter++
    }    
  },
  getters: {
    dobuleCount() {
      console.log(this.counter, 111)
      return this.counter * 2
    }
  }
})

```

compositon形式定义store

```javascript
import { ref, computed } from 'vue'
import { defineStore } from '@/pinia'

export const useCounterStore2 = defineStore('counterStore2', () => {
  const counter = ref(0);
  function increment() {
    this.counter++
  }
  const dobuleCount = computed(() => {
    return counter.value * 2;
  })
  return { counter, increment, dobuleCount }
})
```

`npm run dev`运行代码看看效果。

![录屏2024-02-03 16.40.25.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/874f50ef83a5495cac0d19e28cfa5d61~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=540&h=338&s=238163&e=gif&f=417&b=161616)

## 结束

我们已经把`pinia`的核心功能都实现了一遍，如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得`pinia`非常简单，下一章将讲解`pinia`内置的方法的实现。
