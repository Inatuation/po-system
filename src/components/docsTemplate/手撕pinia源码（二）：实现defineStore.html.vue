<template><h1>手撕<code>pinia源码</code>目录</h1>
<p><a href="https://juejin.cn/post/7330904102023594011#heading-8">手撕pinia源码（一）： pinia的使用</a></p>
<p><a href="https://juejin.cn/spost/7330847148182667283">手撕pinia源码（二）：实现defineStore</a></p>
<p><a href="https://juejin.cn/post/7331070732967968806">手撕pinia源码（三）：实现pinia内置方法</a></p>
<p><a href="https://gitee.com/infatuation5858/pinia-custom">源码地址传送门</a></p>
<h2>前期准备</h2>
<h2>安装vue</h2>
<p>根据<a href="https://cn.vuejs.org/guide/quick-start.html">vue官网</a>快速搭建一个项目，删掉不必要的文件，以免影响我们开发，只保留最简洁的功能页面即可。</p>
<h2>创建pinia</h2>
<p>在<code>/src</code>目录下创建<code>pinia</code>目录，并新建一个入口文件<code>index.js</code>。新建<code>createPinia.js</code>文件，此文件提供<code>createPinia</code>方法是插件在vue中注册的方法。新建<code>store.js</code>文件，此文件提供<code>defineStore</code>方法，用于定义一个<code>store</code>仓库的方法。</p>
<pre><code class="language-javascript">// createPinia.js
export function createPinia() {
}
</code></pre>
<pre><code class="language-javascript">// store.js
export function defineStore() {
}
</code></pre>
<pre><code class="language-javascript">// index.js
import { createPinia } from &quot;./createPinia.js&quot;;
import { defineStore } from './store';

export {
    createPinia,
    defineStore
}
</code></pre>
<p>这就是<code>pinia</code>的基本结构，<code>index.js</code>直接导出<code>createPinia、defineStore</code>方法供外部使用即可。</p>
<p>接下来修改<code>main.js</code>注册<code>pinia</code>插件，报错没关系，因为我们还没有实现<code>createPinia</code>方法。</p>
<pre><code class="language-javascript">// main.js
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from '@/pinia'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
</code></pre>
<p>最终的项目目录结构如下：</p>
<pre><code class="language-text">.
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
</code></pre>
<h2>实现createPinia方法</h2>
<p><code>vue</code>插件规定必须实现一个<code>install</code>方法，<code>install</code>方法能够获取到当前的<code>app</code>实例，因此我们修改一下<code>createPinia.js</code></p>
<pre><code class="language-javascript">// createPinia.js
export function createPinia() {
    const pinia = {
        install(app) {
        }
    }
    return pinia;
}
</code></pre>
<h3>源码分析</h3>
<p><img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e4bb6dfb428a4fa98bc10e3170d29147~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1320&amp;h=1476&amp;s=255297&amp;e=png&amp;a=1&amp;b=1f1f1f" alt="image.png"></p>
<ol>
<li><code>pinia</code>中实例总是全局的，所以我们需要给<code>app</code>挂载全的<code>pinia</code>实例。</li>
<li>源码中<code>_s</code>，<code>pinia</code>支持多仓库，而他的仓库存储的数据结构大致为<code>{id1: store1, id2: store2}</code>这种形式，因此我们需要创建一个对象存储所有的仓库。</li>
<li>源码中<code>_e</code>是一个<code>effectScope</code>的<code>vue</code>API，<a href="https://cn.vuejs.org/api/reactivity-advanced.html#effectscope">官方解释effectScope</a>，它可以收集所有的<code>副作用函数</code>通过调用<code>stop</code>来让所有的响应式数据停止响应，后续我们再详细介绍它是干什么用的，而<code>副作用函数</code>可谓是<code>vue</code>响应式的核心，可以理解为如果关闭了<code>副作用函数</code>那么数据变化，视图也不会变化。</li>
<li>源码中<code>state</code>是一个<code>ref</code>的响应式对象，其主要用于存储所有<code>store</code>的状态值。</li>
</ol>
<h3>编写代码</h3>
<pre><code class="language-javascript">// createPinia.js
import { effectScope, ref } from 'vue';
import { piniaSymbol } from './rootStore';

export function createPinia() {
    const scope = effectScope();
    const state = scope.run(() =&gt; ref({})); // 用于存储每个store的state方法
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
</code></pre>
<pre><code class="language-javascript">// rootStore
export const piniaSymbol = Symbol();
</code></pre>
<ul>
<li>代码6行，创建一个<code>effectScope</code>，将该实例挂载到<code>pinia</code>实例中，命名为<code>_e</code>。</li>
<li>代码7行，创建一个<code>ref</code>响应式对象，将对象挂载到<code>pinia</code>实例中，命名为<code>state</code>。</li>
<li>代码9行，创建一个<code>Map</code>对象，<code>store</code>存储形式是<code>{id1: store1, id2: store2}</code>的，所以id不允许重复，因此用<code>Map</code>来做存储会方便许多。</li>
<li>代码14行，插件被注册时，需要在<code>vue</code>全局属性中挂载<code>$pinia</code>，同时<code>provide</code>注入依赖，提供给全局使用，名称跟官方一样用symbol值。</li>
</ul>
<p><code>createPinia</code>方法就基本完成了，是不是非常简单呢，接着进入到核心代码的编写<code>defineStore</code>。</p>
<h2>实现defineStore方法</h2>
<h3>源码分析</h3>
<p><img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/62e08b2b0dba4206af6c6aa04ab5844e~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1564&amp;h=2890&amp;s=698453&amp;e=png&amp;a=1&amp;b=1f1f1f" alt="image.png"></p>
<ol>
<li><code>defineStore</code>有三个入参，分别是<code>idOrOptions、setup、setupOptions</code>，上一章我们讲到，<code>defineStore</code>的三种用法。</li>
<li>可以从源码<code>1678行</code>看到，默认是有<code>id</code>和<code>options</code>选项，通过类型判断用户入参进行相关的处理。</li>
<li>源码<code>1747</code>行，返回了<code>useStore</code>实例给用户调用，再看看<code>useStore</code>的实现，源码<code>1697</code>行注入依赖<code>pinia</code>实例，然后在源码<code>1706</code>行获取<code>pinia</code>实例的<code>_s</code>是否有保存<code>id</code>这个<code>store</code>，如果没有就进行初始化，初始化分情况调用了<code>createSetupStore</code>和<code>createOptionsStore</code>两种方法。</li>
</ol>
<h3>编写代码</h3>
<pre><code class="language-javascript">// store.js
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
        const pinia = instance &amp;&amp; inject(piniaSymbol);
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
</code></pre>
<ul>
<li>代码4行，判断第二个参数是否为一个函数，如果是函数，则是<code>composition</code>API,如果不是函数，则是<code>options</code>API。</li>
<li>代码6行，判断第一个参数是否为<code>string</code>类型，如果是，则它就是该<code>store</code>的唯一值<code>id</code>，否则从第二个参数中取<code>id</code>。</li>
<li>代码14行，实现一个<code>useStore</code>方法返回<code>store</code>实例。</li>
<li>代码17行，通过<code>getCurrentInstance</code>API获取当前的<code>vue</code>实例，如果有实例，则注入依赖<code>piniaSymbol</code>获取到<code>pinia</code>实例。</li>
<li>代码19行，从<code>pinia._s</code>中通过<code>id</code>取<code>store</code>值，如果没取到，进行初始化。</li>
<li>代码21行，根据<code>isSetupStore</code>判断调用<code>createSetupStore</code>方法还是<code>createOptionsStore</code>方法。</li>
<li>代码27行，获取到<code>store</code>实例，用户调用<code>useStore</code>时就能获取到对应的<code>store</code>。</li>
</ul>
<h2>实现createSetupStore和createOptionsStore方法</h2>
<h3>createSetupStore源码分析</h3>
<p>createSetupStore源码有点长，我们截取核心部分分析。</p>
<p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c229c868c5be4c8db2b07d418e2ec616~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1710&amp;h=1418&amp;s=397302&amp;e=png&amp;a=1&amp;b=1f1f1f" alt="image.png"></p>
<ol>
<li>源码1403，<code>partialStore</code>是<code>pinia</code>自带的方法和属性，我们在下一章会实现这里面的方法，<code>store</code>变量是将原属性和用户定义的属性和方法合并。</li>
<li>源码1440，将<code>store</code>存储到<code>pinia._s</code>下，方便后面二次读取就无需再进行初始化。</li>
<li>源码1443，将用户传入的<code>setup</code>也是用<code>effectScope</code>包一层。</li>
<li>源码1445，循环用户传入的<code>setup</code>，因为用户传入的<code>setup</code>是散乱的，他和<code>options</code>不同，需要判断用户到底写的是<code>state</code>状态，还是方法，又或者它是一个<code>computed</code>属性，所以需要循环对这些进行处理</li>
<li>循环内容大致逻辑就是，将所有的状态存储到<code>pinia.state</code>中，将所有函数重新绑定<code>this</code>，因为如果用户将方法结构出来使用的话，<code>this</code>就会错误或丢失，例如: <code>const { increment } = useCounterStore()</code>，这时调用<code>increment</code>时，<code>this</code>并不是指向<code>store</code>无法取到值。</li>
</ol>
<h3>createSetupStore编写代码</h3>
<pre><code class="language-javascript">// store.js
import { getCurrentInstance, inject, reactive, effectScope, computed, isRef, isReactive } from 'vue';
function isComputed(v) {
    return (isRef(v) &amp;&amp; v.effect);
}
function createSetupStore(id, setup, pinia, isOptions) {
    let scope;
    const partialStore = reactive({});
    const initState = pinia.state.value[id];
    if (!initState) {
        pinia.state.value[id] = {};
    }
    const setupStore = pinia._e.run(() =&gt; {
        scope = effectScope();
        return scope.run(() =&gt; setup());
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
            if ((isRef(prop) &amp;&amp; !isComputed(prop)) || isReactive(prop)) {
                pinia.state.value[id][key] = prop;
            }
        }
    }
    pinia._s.set(id, partialStore);
    Object.assign(partialStore, setupStore);
    return partialStore;
}
</code></pre>
<ul>
<li>代码8行，<code>reactive</code>实现一个响应式对象，用于存储<code>pinia</code>的内置方法。</li>
<li>代码9行，先通过<code>pinia.state</code>获取<code>state</code>状态，如果没有，进行初始化。</li>
<li>代码11行，给定一个<code>pinia.state</code>的默认值为<code>{}</code>。</li>
<li>代码13行，调用<code>pinia._e</code>执行run方法，然后再定一个当前<code>store</code>的<code>effectScope</code>方法，执行用户传入的<code>setup</code>函数，<code>effectScope</code>是可以嵌套使用的，可以假设为<code>pinia._e</code>是全局的控制的是整个<code>pinia</code>的响应式，而当前的<code>effectScope</code>是当前<code>store</code>局部的，控制的是当前<code>store</code>的响应式。</li>
<li>代码24行，循环所有用户定义的<code>setup</code>，判断如果是<code>function</code>的话，调用<code>warpAction</code>重新绑定<code>this</code>的指向。</li>
<li>代码32行，需要区分哪些是用户的状态，我们要先了解，<code>const a = ref(a);</code>这种是用户定义的状态，所以我们可以调用<code>isRef、isReactive</code>来判断。但是有一点需要注意，<code>const b = computed()</code>，此时<code>isRef(b) === true</code>，就是说<code>computed</code>也是<code>ref</code>，我们要另外判断是不是<code>computed</code>属性。</li>
<li>代码3行，判断一个属性是否为<code>computed</code>，首先它一定是<code>ref</code>，其次，判断<code>computed</code>下是否有<code>effect</code>这个方法，这里关于<code>vue</code>源码不多赘述。</li>
<li>代码36行，将用户定义的<code>store</code>和<code>pinia</code>内置属性方法合并，存储到<code>pinia._s</code>中，后面二次调用<code>useStore</code>时无需再初始化，直接取值就能返回。</li>
</ul>
<h3>createOptionsStore源码分析</h3>
<p><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/923bb2fb175b412799a13e558b436cc9~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1826&amp;h=1634&amp;s=439482&amp;e=png&amp;a=1&amp;b=1f1f1f" alt="image.png"></p>
<ol>
<li>源码1196行，初始化<code>pinia.state</code>的属性，源码1204行，执行用户传入的<code>state</code>方法（<code>options</code>API中，所有的state是函数，getter是对象，action是对象）将其存储到全局的<code>state</code>。</li>
<li>源码1209行，获取用户定义的<code>state</code>属性，要知道用户定义只是一个普通的值，并不具有响应式，所以需要<code>toRefs</code>让所有对象转成响应式。</li>
<li>源码1217行，处理用户定义的<code>getter</code>，用户定义时也是一个普通函数，所以也需要将其处理为<code>computed</code>，源码1228行<code>.call</code>绑定的<code>this</code>一定要指向自己<code>sotre</code>（通过<code>pinia._s</code>获取，不用担心获取不到，因为<code>computed</code>是用户取值时才执行，所以<code>pinia._s</code>已经存在。</li>
<li>代码1233行，调用刚刚的<code>createSetupStore</code>方法，可以看到其实<code>options</code>和<code>composition</code>都用同一套逻辑，只是当用户使用<code>options</code>时，我们给他重新组装一个<code>setup</code>然后交给<code>createSetupStore</code>函数处理。</li>
</ol>
<h3>createOptionsStore编写代码</h3>
<pre><code class="language-javascript">// store.js
// 创建选项式的store
function createOptionsStore(id, options, pinia) {
    const { state, getters, actions } = options;

    function setup() {
        const localState = pinia.state.value[id] = state ? state() : {};
        return Object.assign(toRefs(ref(localState).value), actions, Object.keys(getters).reduce((memo, name) =&gt; {
            memo[name] = computed(() =&gt; {
                let store = pinia._s.get(id);
                return getters[name].call(store, store);
            })
            return memo;
        }, {}));
    }
    return createSetupStore(id, setup, pinia, true); 
}
</code></pre>
<ul>
<li>代码7行，将所有的状态存储到全局的<code>pinia.state</code>中。</li>
<li>代码8行，处理用户的<code>state</code>和<code>getter</code>，<code>state</code>转成<code>ref</code>，而<code>getter</code>则循环将所有的属性重新用<code>computed</code>进行绑定即可，跟源码实现差不多。</li>
</ul>
<h2>测试demo</h2>
<pre><code class="language-vue">// App.vue
&lt;template&gt;
    &lt;div&gt;
        &lt;div&gt;{{ store.counter }} / {{ store.dobuleCount }}&lt;/div&gt;
        &lt;button @click=&quot;handleClick&quot;&gt;optionsStore&lt;/button&gt;
    &lt;/div&gt;
    &lt;div&gt;
        &lt;div&gt;{{ store2.counter }}/ {{ store2.dobuleCount }}&lt;/div&gt;
        &lt;button @click=&quot;handleClick2&quot;&gt;setupStore&lt;/button&gt;
    &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
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
&lt;/script&gt;
</code></pre>
<p>options形式定义store</p>
<pre><code class="language-javascript">// store/counter.js
import { defineStore } from '@/pinia'

export const useCounterStore = defineStore('counterStore', {
  state: () =&gt; {
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

</code></pre>
<p>compositon形式定义store</p>
<pre><code class="language-javascript">import { ref, computed } from 'vue'
import { defineStore } from '@/pinia'

export const useCounterStore2 = defineStore('counterStore2', () =&gt; {
  const counter = ref(0);
  function increment() {
    this.counter++
  }
  const dobuleCount = computed(() =&gt; {
    return counter.value * 2;
  })
  return { counter, increment, dobuleCount }
})
</code></pre>
<p><code>npm run dev</code>运行代码看看效果。</p>
<p><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/874f50ef83a5495cac0d19e28cfa5d61~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=540&amp;h=338&amp;s=238163&amp;e=gif&amp;f=417&amp;b=161616" alt="录屏2024-02-03 16.40.25.gif"></p>
<h2>结束</h2>
<p>我们已经把<code>pinia</code>的核心功能都实现了一遍，如果有不懂的，欢迎留言或移步至文章开头查看完整源码，跟着逻辑打印一遍就会觉得<code>pinia</code>非常简单，下一章将讲解<code>pinia</code>内置的方法的实现。</p>
</template>