# introduction

# tools

- Use @babel/parser to build abstract syntax tree


# 问题：应该将零散的文件组合成怎样的bundle文件？

0. 初始

```js
// bar.js
function bar() {
  console.log('bar');
}
export default bar;

// foo.js
import bar from './assets/bar.js';

bar();
function foo() {
  console.log('foo');
}
export { foo };

// index.js
import bar from './assets/bar';
import { foo } from './assets/foo';

bar();
foo();
console.log('index');

```
1. 将每个模块隔离在一个函数作用域内而不是全局，防止同名变量冲突、污染全局

```js
// bar.js
function barjs() {
  function bar() {
    console.log('bar');
  }
  export default bar;
}

// foo.js
function foojs() {
  import bar from './assets/bar.js';

  bar();
  function foo() {
    console.log('foo');
  }
  export { foo };
}

// index.js
function indexjs() {
  import bar from './assets/bar';
  import { foo } from './assets/foo';

  bar();
  foo();
  console.log('index');
}
```

2. import语句只能放在模块最顶层而不能在函数内 -> 实现require函数代替import和export，输入一个路径，导出该路径对应的方法

```js
// input 路径
// output 该路径对应模块导出的方法
function require(filePath) {
}
require('./assets/index.js');

// bar.js
function barjs() {
  function bar() {
    console.log('bar');
  }
  // export default bar;
  module.exports = {
    bar,
  };
}

// foo.js
function foojs() {
  // import bar from './assets/bar.js';
  const { bar } = require('./assets/bar.js');

  bar();
  function foo() {
    console.log('foo');
  }
  // export { foo };
  module.exports = {
    foo,
  };
}

// index.js
function indexjs() {
  // import bar from './assets/bar';
  const { bar } = require('./assets/bar.js');
  // import { foo } from './assets/foo';
  const { foo } = require('./assets/foo.js');

  bar();
  foo();
  console.log('index');
}
```
3. 维护路径与各模块对应的函数的map，require时递归执行dep函数

```js
//路径与模块函数的map
const map = {
  './assets/bar.js': barjs,
  './assets/foo.js': foojs,
  './assets/index.js': indexjs,
};

// input 路径
// output 该路径对应模块导出的方法
function require(filePath) {
  const fn = map[filePath];
  // 用于保存fn函数信息
  const module = {
    exports: {},
  };
  // 每个fn函数里面有可能递归require其他deps
  fn(require, module);
  return module.exports;
}
require('./assets/index.js');

// bar.js
function barjs(require, module) {
  function bar() {
    console.log('bar');
  }
  // export default bar;
  module.exports = {
    bar,
  };
}

// foo.js
function foojs(require, module) {
  // import bar from './assets/bar.js';
  const { bar } = require('./assets/bar.js');

  bar();
  function foo() {
    console.log('foo');
  }
  // export { foo };
  module.exports = {
    foo,
  };
}

// index.js
function indexjs(require, module) {
  // import bar from './assets/bar';
  const { bar } = require('./assets/bar.js');
  // import { foo } from './assets/foo';
  const { foo } = require('./assets/foo.js');

  bar();
  foo();
  console.log('index');
}
```