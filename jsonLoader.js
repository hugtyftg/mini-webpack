function jsonLoader(source) {
  return `export default ${JSON.stringify(source)}`;
}
export default jsonLoader;
