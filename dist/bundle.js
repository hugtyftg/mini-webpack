((map) => {
  function require(id) {
    const [fn, mapping] = map[id];
    const module = { exports: {} };
    function localRequire(filePath) {
      const id = mapping[filePath];
      return require(id);
    }
    fn(localRequire, module, module.exports);
    return module.exports;
  }
  require(1602);
})({
  1602: [
    function (require, module, exports) {
      'use strict';

      var _bar = require('./bar.js');

      var _bar2 = _interopRequireDefault(_bar);

      var _foo = require('./foo.js');

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      (0, _bar2.default)();
      (0, _foo.foo)();
      console.log('index');
    },
    { './bar.js': 6036, './foo.js': 6051 },
  ],
  6036: [
    function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, '__esModule', {
        value: true,
      });

      function bar() {
        console.log('bar');
      }

      exports.default = bar;
    },
    {},
  ],
  6051: [
    function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, '__esModule', {
        value: true,
      });
      exports.foo = undefined;

      var _bar = require('./bar.js');

      var _bar2 = _interopRequireDefault(_bar);

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      (0, _bar2.default)();

      function foo() {
        console.log('foo');
      }

      exports.foo = foo;
    },
    { './bar.js': 6036 },
  ],
});
