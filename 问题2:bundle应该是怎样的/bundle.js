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
