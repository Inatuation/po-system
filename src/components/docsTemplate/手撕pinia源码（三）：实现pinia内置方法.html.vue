<template><h1>手撕<code>pinia源码</code>目录</h1>
<p><a href="https://juejin.cn/post/7330904102023594011#heading-8">手撕pinia源码（一）： pinia的使用</a></p>
<p><a href="https://juejin.cn/spost/7330847148182667283">手撕pinia源码（二）：实现defineStore</a></p>
<p><a href="https://juejin.cn/post/7331070732967968806">手撕pinia源码（三）：实现pinia内置方法</a></p>
<p><a href="https://gitee.com/infatuation5858/pinia-custom">源码地址传送门</a></p>
<h2>$patch实现</h2>
<p>对当前状态应用状态补丁。可以同时批量设置状态值，传入一个回调函数，回调函数接收一个<code>store</code>参数可访问当前仓库的所有属性方法。
<code>$patch</code>有两种使用方式</p>
<pre><code class="language-javascript">import { useCounterStore } from './stores/counter';
const store = useCounterStore();
store.$patch({counter: 1000})
// or
store.$patch((data) = {
   data.counter = 1000;
})
</code></pre>
<h3>代码编写</h3>
<pre><code class="language-javascript">// store.js
function isObject(val) {
    return typeof val === 'object' &amp;&amp; val !== null;
}

function mergeReactiveObject(target, state) {
    for (let key in state) {
        let oldValue = target[key];
        let newValue = state[key];
        if (isObject(oldValue) &amp;&amp; isObject(newValue)) {
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
</code></pre>
<p>修改<code>createSetupStore</code>方法。</p>
<ul>
<li>代码26行，实现<code>pinia</code>内置方法</li>
<li>代码19行，实现<code>$patch</code>方法
<ul>
<li>代码21行，判断入参为<code>object</code>,则是第一种用法，那么需要将两个对象合并即可，
<ul>
<li><code>mergeReactiveObject</code>就是简单的递归对象合并</li>
</ul>
</li>
<li>代码23行，如果不是对象，则是<code>function</code>，此时只需要执行用户传入的函数，并且获取到当前的<code>store</code>返回给用户，让用户操作即可，<code>pinia.state.value[id]</code>是<code>ref</code>响应式对象，所以用户可以直接修改就能触发响应。</li>
</ul>
</li>
</ul>
<h2>$reset</h2>
<p>通过构建新的状态对象，将存储重置为初始状态。此API只能用于通过<code>options</code>方式构建的<code>store</code>，后面会讲解为何只有<code>options</code>方式构建的<code>store</code>才支持此API。</p>
<h3>代码编写</h3>
<pre><code class="language-javascript">// store.js
function createOptionsStore(id, options, pinia) {
    ...代码省略
    
    const store = createSetupStore(id, setup, pinia, true); 
    store.$reset = function () {
        const newState = state ? state() : {};
        store.$patch((state) =&gt; { 
            Object.assign(state, newState);
        })
    }
    return store;
}
</code></pre>
<ul>
<li>代码6行，给<code>createOptionsStore</code>构建的<code>store</code>添加一个<code>$reset</code>方法
<ul>
<li>代码7行，重新调用用户定义的<code>state</code>函数，即可获取初始值，所以<code>$reset</code>方法只能用在<code>options</code>定义的<code>store</code>中，因为如果是<code>setup</code>形式的话，我们无法获取到起初始值是什么。
-代码8行，直接调用我们刚刚编写的<code>$patch</code>函数，用初始状态覆盖掉当前状态即可。</li>
</ul>
</li>
</ul>
<h2>$subscribe</h2>
<p>设置一个回调，以便在状态更改时调用。它还返回一个函数来删除回调。</p>
<h3>代码编写</h3>
<pre><code class="language-javascript">// store.js
function createSetupStore(id, setup, pinia, isOptions) {
    function $subscribe(callBack) {
        watch(pinia.state.value[id], (state) =&gt; {
            callBack({ storeId: id }, state)
        });
    }
    const partialStore = {
        $patch,
        $subscribe
    }
    ...代码省略
}
</code></pre>
<ul>
<li>代码10行，添加一个<code>$subscribe</code>内置方法
<ul>
<li>代码3行，实现<code>subscribe</code>方法，</li>
<li>代码4行，代码非常简单，调用<code>vue</code>的<code>watch</code>API，监听当前的<code>store</code>属性的变化，当属性变化时，调用用户传递的<code>callBack</code>函数，组装好用户需要的参数返回即可。</li>
</ul>
</li>
</ul>
<h2>$onAction</h2>
<p>设置一个回调函数，每次调用操作时执行此回调函数，并且回调函数接收一个参数，参数包含所有操作信息
,<code>$onAction</code>的使用示例</p>
<pre><code class="language-javascript">import { useCounterStore } from './stores/counter';
const store = useCounterStore();
store.$onAction(function ({after, onError}) {
    after((result) =&gt; { // 修改后的结果 })
    after((result) =&gt; { // 修改后的结果 })
    after((result) =&gt; { // 修改后的结果 })
    onError((error) =&gt; { // 执行错误 })
})
</code></pre>
<p>观察上面代码，<code>after</code>是可以被多次调用的，我们可以发现，这种形式就是利用发布订阅模式，缓存所有的订阅函数，当调用时执行这些订阅函数。</p>
<h3>代码编写</h3>
<pre><code class="language-javascript">// 新建一个subscribe.js
export function addSubscription(subscriptions, callback) {
    subscriptions.push(callback);
    const removeSubscription = () =&gt; {
        const idx = subscriptions.indexOf(callback);
        if (idx &gt; -1) {
            subscriptions.splice(idx, 1);
        }
    }
    return removeSubscription;
}

export function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach(cb =&gt; cb(...args));
}
</code></pre>
<pre><code class="language-javascript">// store.js
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
                return res.then((value) =&gt; {
                    triggerSubscriptions(afterCallbackList, value)
                }).catch(error =&gt; {
                    triggerSubscriptions(onErrorCallbackList, error);
                })
            }
            return res;
        }
    }
    ... 代码省略
</code></pre>
<ul>
<li>代码<code>subscribe.js</code>是一个经典的发布订阅模式，如果不了解发布订阅模式可以看我另一篇文章有详细解读。<a href="https://juejin.cn/post/7293401396437827619">传送门</a></li>
<li>代码8行，定义一个<code>$onAction</code>的内置方法，当调用这个内置方法的时候，会执行订阅函数收集起来。</li>
<li>代码11行，修改<code>warpAction</code>函数，在调用方法时执行此函数
<ul>
<li>代码13行，分别定义<code>afterCallbackList</code>和<code>onErrorCallbackList</code>，因为<code>after</code>和<code>onError</code>是可以被多次调用的，所以也是一个发布订阅模式</li>
<li>代码15行，提供<code>after</code>方法，当用户调用<code>after</code>时，将参数存入<code>afterCallbackList</code>，代码18行同理。</li>
<li>用户调用<code>action</code>时，触发<code>triggerSubscriptions</code>发布所有的<code>onAction</code>订阅者，入参包含<code>after</code>和<code>onError</code>提供给用户使用。</li>
<li>代码23行，执行完<code>action</code>后，触发<code>triggerSubscriptions</code>发布给所有的<code>after</code>订阅者，入参为最新的状态值。</li>
<li>代码25行，同理，当执行<code>action</code>报错，触发<code>triggerSubscriptions</code>发布给所有的<code>onError</code>订阅者，入参为报错信息。</li>
<li>代码29行，因为<code>action</code>是允许写异步方法的，所以有可能<code>action</code>的执行结果返回的是一个<code>promise</code>，所以判断其是否是<code>Promise</code>，如果是则调用起<code>then</code>方法等待执行完毕后再通知<code>after</code>订阅者，同上。</li>
</ul>
</li>
</ul>
<h2>结束</h2>
<p>总结<code>手撕pinia源码</code>系列技术文章，我如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得<code>pinia</code>非常简单们详细剖析了<code>pinia</code>源码，从源码的角度实现了一个简单版的<code>pinia</code>，当然还有很多特殊场景没有处理，但是能够理解<code>pinia</code>核心我认为就足够了，主要学习的是其设计思想，最后如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得<code>pinia</code>非常简单。</p>
<p><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e926abb779a04186b32699dfff40456d~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=540&amp;h=334&amp;s=202704&amp;e=gif&amp;f=215&amp;b=191919" alt="Filmage 2024-01-29_221446.gif"></p>
</template>