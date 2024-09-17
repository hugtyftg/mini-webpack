import fs from 'fs';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import path from 'path';

// 读取模块内容和依赖关系
function createAssets(filePath) {
  // 1.读取文件内容
  const source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  });

  // 2.构建ast
  const ast = parser.parse(source, {
    sourceType: 'module',
  });

  // 3.遍历ast树，根据ImportDeclaration节点获取依赖关系
  const deps = [];
  traverse.default(ast, {
    ImportDeclaration({ node }) {
      deps.push(node.source.value);
    },
  });

  // 3.返回该模块的内容和所有依赖项
  return {
    source,
    deps,
  };
}

// 根据依赖关系得到dependency graph -> 某个文件的所有依赖，广度优先遍历
function createDependencyGraph(filePath) {
  const mainAssets = createAssets(filePath);

  // bfs
  const result = [];
  const queue = [...mainAssets.deps];
  const visited = new Set();
  visited.add(...queue);
  while (queue.length > 0) {
    const curPath = queue.shift();
    const curAssets = createAssets(path.resolve('../assets', curPath));
    result.push(curAssets);
    for (const child of curAssets.deps) {
      if (visited.has(child)) {
        continue;
      }
      queue.push(child); // 只入队未访问的节点
      visited.add(child); // 标记该节点已访问
    }
  }
  return result;
}

const result = createDependencyGraph('../assets/index.js');
console.log(result);
