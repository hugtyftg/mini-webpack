export class PathPlugin {
  apply(hooks) {
    hooks.emitFile.tap('changeOutputPath', (context) => {
      console.log('changeOutputPath');
      console.log(context);

      context.changeOutputPath('./dist/mmy.js');
    });
  }
}
