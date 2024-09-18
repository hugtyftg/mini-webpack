((map) => {
  // input 路径
  // output 该路径对应模块导出的方法
  function require(id) {
    const [fn, mapping] = map[id];
    // 用于保存fn函数信息
    const module = {
      exports: {},
    };
    // 模块内的require需要装饰器，将filepath转为id
    function localRequire(filePath) {
      const id = mapping[filePath];
      return require(id);
    }
    // 每个fn函数里面有可能递归require其他deps
    fn(localRequire, module, module.exports);
    return module.exports;
  }
  require('./assets/index.js');
})(
  //路径与模块函数的map

  {
    0: [
      function (require, module, exports) {
        function bar() {
          console.log('bar');
        }
        // export default bar;
        module.exports = {
          // 默认导出与解构导出的差异
          default: bar,
        };
      },
      {},
    ],
    1: [
      function (require, module, exports) {
        // import bar from './assets/bar.js';
        const bar = require('./bar.js');
        bar.default();
        function foo() {
          console.log('foo');
        }
        // export { foo };
        module.exports = {
          foo,
        };
      },
      { './bar.js': 0 },
    ],
    './assets/index.js': [
      function (require, module, exports) {
        // import bar from './bar';
        const bar = require('./bar.js');
        // import { foo } from './foo';
        const { foo } = require('./foo.js');

        bar.default();
        foo();
        console.log('index');
      },
      {
        './bar.js': 0,
        './foo.js': 1,
      },
    ],
  }
);
