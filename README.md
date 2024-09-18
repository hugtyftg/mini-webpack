# 分析webpack做了什么？

## 读取文件内容并解析路径依赖关系

ast 转换实例 https://astexplorer.net/

借助babel parser将内容转化为ast，https://babeljs.io/docs/babel-parser

```js
Node {
  type: 'Program',
  start: 0,
  end: 91,
  loc: SourceLocation {
    start: Position { line: 1, column: 0, index: 0 },
    end: Position { line: 7, column: 0, index: 91 },
    filename: undefined,
    identifierName: undefined
  },
  sourceType: 'module',
  interpreter: null,
  body: [
    Node {
      type: 'ImportDeclaration',
      start: 0,
      end: 24,
      loc: [SourceLocation],
      specifiers: [Array],
      source: [Node]
    },
    Node {
      type: 'ImportDeclaration',
      start: 25,
      end: 53,
      loc: [SourceLocation],
      specifiers: [Array],
      source: [Node]
    },
    Node {
      type: 'ExpressionStatement',
      start: 55,
      end: 61,
      loc: [SourceLocation],
      expression: [Node]
    },
    Node {
      type: 'ExpressionStatement',
      start: 62,
      end: 68,
      loc: [SourceLocation],
      expression: [Node]
    },
    Node {
      type: 'ExpressionStatement',
      start: 69,
      end: 90,
      loc: [SourceLocation],
      expression: [Node]
    }
  ],
  directives: [],
  extra: { topLevelAwait: false }
}
```

可以看到import语句对应ast上的ImportDeclaration节点

遍历ast，根据ImportDeclaration节点的source value信息得到dependency graph

babel提供了traverse方法允许我们递归遍历ast树，并在访问某些类型的节点时调用回调函数，https://babeljs.io/docs/babel-traverse

## 将若干文件视为一个模块并打包整合成一个bundle文件

Use @babel/parser to build abstract syntax tree

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

# loader

webpack将所有文件都看成模块，并且由于内部解析使用babel，只认识js文件，因此无法解析其他类型的文件，loader正是解决这一问题的

loader将非js的文件转成js，使得webpack可以正常解析执行。

输入一个字符串，输出一个字符串

设计思想：单一职责、链式调用

# plugin

webpack在不同的阶段会暴露不同的事件hook，我们可以监听这些事件，拿到这些事件触发时暴露出来的对象，利用这些对象上的方法二次加工，从而改变打包时的行为

webpack底层实现了各事件监听的库tapable，它基于发布订阅模式实现

plugin是一个类，实现了apply方法，会给webpack各种时机hook注册方法

初始化时注册事件


- https://juejin.cn/post/7040982789650382855
- https://tsejx.github.io/webpack-guidebook/infra/implementation-principle/tapable/