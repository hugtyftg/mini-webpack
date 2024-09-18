import fs from 'fs';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import path from 'path';
import ejs from 'ejs';
import { transformFromAst } from 'babel-core';
import jsonLoader from './jsonLoader.js';

const webpackConfig = {
  module: {
    rules: [
      {
        test: /\.json/,
        use: jsonLoader,
      },
    ],
  },
};

// 标识模块唯一id，不能简单用递增的数字，因为某个模块可能
function genModuleId(filePath) {
  let id = 0;
  for (const str of filePath) {
    id += str.charCodeAt();
  }
  return id;
}

// 读取模块内容和依赖关系
function createAssets(filePath) {
  // 1.读取文件内容
  let source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  });

  // init loaders
  const loaders = webpackConfig.module.rules;
  loaders.forEach(({ test, use }) => {
    if (test.test(filePath)) {
      source = use(source);
    }
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

  // 4.将esm转成cjs
  const { code } = transformFromAst(ast, null, {
    presets: ['env'],
  });

  // 5.返回该模块的内容和所有依赖项
  return {
    filePath,
    code,
    deps,
    id: genModuleId(filePath),
    mapping: {},
  };
}

// 根据依赖关系得到dependency graph -> 某个文件的所有依赖，广度优先遍历
function createDependencyGraph(filePath) {
  const entryAssets = createAssets(filePath);
  const result = [entryAssets];
  const queue = [entryAssets];
  const visited = new Set();
  visited.add(entryAssets.id);
  while (queue.length > 0) {
    const curAssets = queue.shift();
    for (const childPath of curAssets.deps) {
      const childAssets = createAssets(path.resolve('./assets', childPath));
      // 记录每个assets的模块id mapping
      curAssets.mapping[childPath] = childAssets.id;
      if (visited.has(childAssets.id)) {
        continue;
      }
      result.push(childAssets);
      queue.push(childAssets); // 只入队未访问的节点
      visited.add(childAssets.id); // 标记该节点已访问
    }
  }
  return result;
}

// 问题
// 怎样得到bundle.js文件？ -> ejs模版生成
// 怎样将源文件中的esm改写成cjs -> babel-core + preset 安装babel/core和babel-preset-env，循环渲染出code
// 怎样防止使用相对路径、不同层下文件会重名 -> id
function build(graph, entryPath) {
  const template = fs.readFileSync('./bundle.ejs', { encoding: 'utf-8' });
  // 用于ejs模版循环渲染的数据
  const code = ejs.render(template, {
    data: {
      graph,
      entryId: genModuleId(entryPath),
    },
  });
  fs.writeFileSync('./dist/bundle.js', code);
}

const graph = createDependencyGraph('./assets/index.js');

build(graph, './assets/index.js');
