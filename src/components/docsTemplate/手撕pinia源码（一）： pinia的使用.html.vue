<template><p>&lt;br/&gt;</p>
<blockquote>
<p>本章将从0到1实现pinia仓库，除了实现其基本功能外，并且还会实现<code>$dispose、$onAction、$path、$reset、$subscribe</code>API，坚持看下去，其实pinia真的很简单！！！</p>
</blockquote>
<h1>手撕<code>pinia源码</code>目录</h1>
<p><a href="https://juejin.cn/post/7330904102023594011#heading-8">手撕pinia源码（一）： pinia的使用</a></p>
<p><a href="https://juejin.cn/spost/7330847148182667283">手撕pinia源码（二）：实现defineStore</a></p>
<p><a href="https://juejin.cn/post/7331070732967968806">手撕pinia源码（三）：实现pinia内置方法</a></p>
<p><a href="https://gitee.com/infatuation5858/pinia-custom">源码地址传送门</a></p>
<h2>简单介绍</h2>
<ul>
<li><code>pinia</code>是用来取代<code>vuex</code>的，<code>pinia</code>非常小巧，即支持<code>vue2</code>也支持<code>vue3</code>，同时<code>typeScript</code>类型支持也非强友好</li>
<li><code>pinpa</code>默认支持多仓库，在<code>vuex</code>中只有一个仓库，会导致所有的状态都放在同一个<code>store</code>里，当我们使用模块化时，也会让代码显得非常复杂，例如<code>vuex.$store.a.b.c……</code>，假如模块化分得细的话，就会非常难以维护。而在<code>pinia</code>中，选择将所有的状态都模块化，根据id存放在<code>store</code>里，需要用时只需要调用API<code>useXXX</code>就可以很方便的取到对应的仓库。</li>
<li>在<code>vuex</code>中，会有<code>state、getter、mutation、action、module</code>这些<code>API</code>，其中<code>mutation</code>是更改状态的提交方法，<code>action</code>是提交<code>mutation</code>的方法，其可以包含异步操作（这里有一个很大的误区，<code>actions</code>并不是用于异步的，而是它可以包含异步操作，我们在写同步方法也是完全没问题的），关于<code>mutation</code>和<code>action</code>到底什么时候用哪个？就成了一个很头疼的问题，其实<code>actions</code>最核心是封装，封装各种提交<code>mutation</code>的方法一次调用。</li>
<li>为了解决<code>vuex</code>中<code>mutation</code>和<code>action</code>的痛点，<code>pinia</code>直接舍弃了<code>matution</code>层，只有<code>action</code>层，所以用户所有更改只需要使用<code>action</code>即可。</li>
</ul>
<h2>安装</h2>
<p>根据<a href="https://pinia.web3doc.top/getting-started.html#%E5%AE%89%E8%A3%85">pinia官网</a>指引安装即可。</p>
<h2>基本使用</h2>
<h3>defineStore的写法</h3>
<ul>
<li>第一种<code>options</code>API</li>
</ul>
<pre><code class="language-javascript">import { defineStore } from 'pinia'

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
      return this.counter * 2
    }
  }
})
</code></pre>
<ul>
<li>代码3行，<code>defineStore</code>创建定义一个仓库，第一个参数是唯一值<code>id</code>，第二个参数是对象，也就是<code>options</code>APi</li>
<li>代码4行，选项式的<code>state</code>必须是一个箭头函数</li>
<li>代码9行，选项式<code>actions</code>是一个对象</li>
<li>代码14行，选项式<code>getters</code>是一个对象，其属性值为函数，必须返回一个值，跟<code>vue</code>中<code>computed</code>用法差不多。</li>
</ul>
<p>第二种<code>composition</code>API</p>
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
<ul>
<li>代码4行，<code>defineStore</code>依旧第一个参数是唯一值<code>id</code>，第二个参数是一个函数</li>
<li>代码5行，在函数里面，写法跟<code>vue</code>的<code>composition</code>API一致</li>
<li>代码12行，把所有的属性和方法返回出去即可。</li>
</ul>
<p>第三种<code>options</code>API</p>
<pre><code class="language-javascript">import { defineStore } from 'pinia'

export const useCounterStore = defineStore({
  id: 'counterStore',
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
      return this.counter * 2
    }
  }
})
</code></pre>
<p><strong>以上两种写法其实现的效果完全一样，请记住这两种写法，后续实现时，会详细讲解这两种写法的区别和实现。</strong></p>
<h3>API的基本用法</h3>
<h4>$dispose</h4>
<p>我们可以让某个时<code>store</code>停止响应，延用上面的例子，useCounterStore将不再响应。</p>
<pre><code class="language-vue">&lt;script setup&gt;
import { useCounterStore } from &quot;./stores/counter&quot;;
const store = useCounterStore();
store.$dispost();
&lt;/script&gt;
</code></pre>
<h4>$patch</h4>
<p>补丁操作，可以同时批量设置<code>store</code>的值，传入一个回调函数，回调函数接收一个<code>store</code>参数可访问当前仓库的所有属性方法。</p>
<pre><code class="language-vue">&lt;script setup&gt;
import { useCounterStore } from &quot;./stores/counter&quot;;
const store = useCounterStore();
store.$patch((store) =&gt; {
    store.counter = 1000;
});
&lt;/script&gt;
</code></pre>
<h4>$reset</h4>
<p>重置仓库数据，此API只能用于通过<code>options</code>方式构建的<code>store</code>，后面会讲解为何只有<code>options</code>方式构建的<code>store</code>才支持此API。</p>
<pre><code class="language-vue">&lt;script setup&gt;
import { useCounterStore } from &quot;./stores/counter&quot;;
const store = useCounterStore();
store.$reset()
&lt;/script&gt;
</code></pre>
<h4>$subscribe</h4>
<p>设置一个回调函数，仓库所有状态被修改时执行此回调函数，返回一个删除此回调的函数。</p>
<pre><code class="language-vue">&lt;script setup&gt;
import { useCounterStore } from &quot;./stores/counter&quot;;
const store = useCounterStore();
store.$subscribe((params, state) =&gt; {
    console.log(&quot;params&quot;,params);//修改的属性
    console.log(&quot;state&quot;,state);//修改后的数据
})
&lt;/script&gt;
</code></pre>
<h4>$onAction</h4>
<p>设置一个回调函数，每次调用操作时执行此回调函数，并且回调函数接收一个参数，参数包含所有操作信息,</p>
<pre><code class="language-vue">&lt;script setup&gt;
import { useCounterStore } from &quot;./stores/counter&quot;;
const store = useCounterStore();
store.$onAction(({name, store, args, after, onError}) =&gt; {
    after((result) =&gt; {
        // 修改后的结果
    })
    
    onError((error) =&gt; {
        // 执行错误
    })
})
&lt;/script&gt;
</code></pre>
<p>介绍完基本的概念之后，进入下一章将开始一步步实现所有的功能。</p>
</template>