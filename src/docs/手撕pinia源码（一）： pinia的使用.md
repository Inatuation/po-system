<br/>

> 本章将从0到1实现pinia仓库，除了实现其基本功能外，并且还会实现`$dispose、$onAction、$path、$reset、$subscribe`API，坚持看下去，其实pinia真的很简单！！！

# 手撕`pinia源码`目录

[手撕pinia源码（一）： pinia的使用](https://juejin.cn/post/7330904102023594011#heading-8)

[手撕pinia源码（二）：实现defineStore](https://juejin.cn/spost/7330847148182667283)

[手撕pinia源码（三）：实现pinia内置方法](https://juejin.cn/post/7331070732967968806)

[源码地址传送门](https://gitee.com/infatuation5858/pinia-custom)

## 简单介绍

- `pinia`是用来取代`vuex`的，`pinia`非常小巧，即支持`vue2`也支持`vue3`，同时`typeScript`类型支持也非强友好
- `pinpa`默认支持多仓库，在`vuex`中只有一个仓库，会导致所有的状态都放在同一个`store`里，当我们使用模块化时，也会让代码显得非常复杂，例如`vuex.$store.a.b.c……`，假如模块化分得细的话，就会非常难以维护。而在`pinia`中，选择将所有的状态都模块化，根据id存放在`store`里，需要用时只需要调用API`useXXX`就可以很方便的取到对应的仓库。
- 在`vuex`中，会有`state、getter、mutation、action、module`这些`API`，其中`mutation`是更改状态的提交方法，`action`是提交`mutation`的方法，其可以包含异步操作（这里有一个很大的误区，`actions`并不是用于异步的，而是它可以包含异步操作，我们在写同步方法也是完全没问题的），关于`mutation`和`action`到底什么时候用哪个？就成了一个很头疼的问题，其实`actions`最核心是封装，封装各种提交`mutation`的方法一次调用。
- 为了解决`vuex`中`mutation`和`action`的痛点，`pinia`直接舍弃了`matution`层，只有`action`层，所以用户所有更改只需要使用`action`即可。

## 安装

根据[pinia官网](https://pinia.web3doc.top/getting-started.html#%E5%AE%89%E8%A3%85)指引安装即可。

## 基本使用

### defineStore的写法

- 第一种`options`API

```javascript
import { defineStore } from 'pinia'

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
      return this.counter * 2
    }
  }
})
```

- 代码3行，`defineStore`创建定义一个仓库，第一个参数是唯一值`id`，第二个参数是对象，也就是`options`APi
- 代码4行，选项式的`state`必须是一个箭头函数
- 代码9行，选项式`actions`是一个对象
- 代码14行，选项式`getters`是一个对象，其属性值为函数，必须返回一个值，跟`vue`中`computed`用法差不多。

第二种`composition`API

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

- 代码4行，`defineStore`依旧第一个参数是唯一值`id`，第二个参数是一个函数
- 代码5行，在函数里面，写法跟`vue`的`composition`API一致
- 代码12行，把所有的属性和方法返回出去即可。

第三种`options`API

```javascript
import { defineStore } from 'pinia'

export const useCounterStore = defineStore({
  id: 'counterStore',
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
      return this.counter * 2
    }
  }
})
```

**以上两种写法其实现的效果完全一样，请记住这两种写法，后续实现时，会详细讲解这两种写法的区别和实现。**

### API的基本用法

#### $dispose

我们可以让某个时`store`停止响应，延用上面的例子，useCounterStore将不再响应。

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
store.$dispost();
</script>
```

#### $patch

补丁操作，可以同时批量设置`store`的值，传入一个回调函数，回调函数接收一个`store`参数可访问当前仓库的所有属性方法。

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
store.$patch((store) => {
    store.counter = 1000;
});
</script>
```

#### $reset

重置仓库数据，此API只能用于通过`options`方式构建的`store`，后面会讲解为何只有`options`方式构建的`store`才支持此API。

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
store.$reset()
</script>
```

#### $subscribe

设置一个回调函数，仓库所有状态被修改时执行此回调函数，返回一个删除此回调的函数。

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
store.$subscribe((params, state) => {
    console.log("params",params);//修改的属性
    console.log("state",state);//修改后的数据
})
</script>
```

#### $onAction

设置一个回调函数，每次调用操作时执行此回调函数，并且回调函数接收一个参数，参数包含所有操作信息, 

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
const store = useCounterStore();
store.$onAction(({name, store, args, after, onError}) => {
    after((result) => {
        // 修改后的结果
    })
    
    onError((error) => {
        // 执行错误
    })
})
</script>
```

介绍完基本的概念之后，进入下一章将开始一步步实现所有的功能。
