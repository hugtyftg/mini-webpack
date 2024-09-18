function jsonLoader(source) {
  this.addDeps('json loader');
  return `export default ${JSON.stringify(source)}`;
}
export default jsonLoader;
