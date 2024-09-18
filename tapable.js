import { SyncHook, AsyncParallelHook } from 'tapable';
class List {
  constructor() {}
  getRoutes() {
    console.log('list method: getRoutes');
  }
}
class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(['newSpeed']), // 触发事件时调用的函数的参数列表
      brake: new SyncHook(),
      calculateRoutes: new AsyncParallelHook([
        'source',
        'target',
        'routesList',
      ]),
    };
  }
  /**
   * You won't get returned value from SyncHook or AsyncParallelHook,
   * to do that, use SyncWaterfallHook and AsyncSeriesWaterfallHook respectively
   **/

  setSpeed(newSpeed) {
    // following call returns undefined even when you returned values
    this.hooks.accelerate.call(newSpeed);
  }

  useNavigationSystemPromise(source, target) {
    const routesList = new List();
    return this.hooks.calculateRoutes
      .promise(source, target, routesList)
      .then((res) => {
        // res is undefined for AsyncParallelHook
        return routesList.getRoutes();
      });
  }

  useNavigationSystemAsync(source, target, callback) {
    const routesList = new List();
    this.hooks.calculateRoutes.callAsync(source, target, routesList, (err) => {
      if (err) return callback(err);
      callback(null, routesList.getRoutes());
    });
  }
}

// 1.注册
const car = new Car();
car.hooks.accelerate.tap('accelerate', (newSpeed) => {
  console.log('accelerate to ' + newSpeed);
});
car.hooks.calculateRoutes.tapPromise('test', (source, target) => {
  // 必须返回一个promise
  return new Promise((res) => {
    console.log(source, target);
    res();
  });
});

// 2.调用
car.setSpeed(20);
car.useNavigationSystemPromise('source', 'target');
