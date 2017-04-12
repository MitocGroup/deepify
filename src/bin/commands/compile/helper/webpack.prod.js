'use strict';

const ENTRY_POINT = 'bootstrap.js';
const R_DEEP_DYN_MODULES = '__deep_dyn_modules__';
const LAMBDA_ROOT = '/var/task';
const PLUGINS_PLACEHOLDER = '~~~DEEP_WEBPACK_PLUGINS~~~';
const EXTERNALS = [
  /aws-sdk/i,               // @preloaded (by AWS Lambda container)
];
const NULL_MODULES = [
  'mv',                     // @junk (bunyan shim) 
  'safe-json-stringify',    // @junk (bunyan shim)
  'dtrace-provider',        // @junk (bunyan shim)
  'source-map-support',     // @junk (bunyan shim)
  'vertx',                  // @junk (es6-promise uses native implementation)
  'ioredis',                // @junk (deep-cache not implemented)
  'store',                  // @browser
  'formidable',             // @browser
  'relative-fs',            // @local
  'dynalite',               // @local
  'local-dynamo',           // @local
];

const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const webpackMerge = require('webpack-merge');
const Bin = require('../../../../lib.compiled/NodeJS/Bin').Bin;
const Core = require('deep-core');
const pify = require('pify');

// @todo Resolve webpack dynamically (maybe link it?)
const WEBPACK_LIB = path.join(
  Bin.resolve('webpack'),
  '../../lib/node_modules/webpack/lib/webpack.js'
);

function plainify (config, debug) {
  config.plugins = [ PLUGINS_PLACEHOLDER ];
  const regexpExternals = config.externals
    .filter(external => external instanceof RegExp)
    .map(external => {
      return `webpackConfig.externals.push(${external})`;
    });
    
  config.externals = config.externals
    .filter(external => typeof external === 'string');
  
  const plainConfig = `/* Generated by Deepify on ${Date()} */
const webpack = require('${WEBPACK_LIB}');
const ConstDependency = require('${path.join(path.dirname(WEBPACK_LIB), 'dependencies/ConstDependency.js')}');
const DeepResolver = require('${path.join(__dirname, 'webpack.resolver.js')}');
const resolver = new DeepResolver('${R_DEEP_DYN_MODULES}', webpack, ConstDependency);
const webpackConfig = ${JSON.stringify(config, null, '  ')};
${regexpExternals.join(';\n')};
module.exports = resolver.extend(webpackConfig);
`;
  const plugins = `
new webpack.optimize.OccurrenceOrderPlugin(),
new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify('production'),
  },
}),
new webpack.LoaderOptionsPlugin({
  minimize: ${debug ? 'false' : 'true'},
  debug: ${debug ? 'true' : 'false'},
}),
resolver,
`;

  return plainConfig.replace(`"${PLUGINS_PLACEHOLDER}"`, plugins);
}

module.exports = function (lambdaPath, outputPath, linkedLibs, debug) {
  const schemasPath = path.join(lambdaPath, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR);
  const customWebpackConfigPath = path.join(lambdaPath, 'deep.webpack.json');
  const tmpBootstrapName = `.deep-tmp-${Date.now()}-${ENTRY_POINT}`;
  const tmpBootstrapJs = path.join(lambdaPath, tmpBootstrapName);
  const deepFrameworkPackage = path.join(lambdaPath, 'node_modules', 'deep-framework', 'package.json');
  const nullModulePath = path.join(__dirname, 'webpack.null-module.js');
  const defaultConfig = {
    entry: tmpBootstrapName,
    context: lambdaPath,
    output: {
      path: outputPath,
      filename: ENTRY_POINT,
      libraryTarget: 'commonjs2', // @see https://github.com/webpack/webpack/issues/1114
    },
    resolve: {
      modules: [ lambdaPath, 'node_modules' ],
      extensions: [ '.js', '.json' ],
      alias: {},
    },
    node: {
      console: true,
      global: true,
      process: true,
      Buffer: true,
      __filename: 'mock',
      __dirname: 'mock',
      setImmediate: true
    },
    watch: false,
    target: 'node',
    externals: EXTERNALS,
    devtool: false,
    stats: 'errors-only',
  };
  const deepDeps = {};
  
  linkedLibs.forEach(linkedLib => {
    const modulePath = path.resolve(lambdaPath, 'node_modules', linkedLib, 'node_modules');
    
    defaultConfig.resolve.modules.push(modulePath);
  });
  
  NULL_MODULES.forEach(nullModule => {
    defaultConfig.resolve.alias[nullModule] = nullModulePath;
  });
  
  return pify(fse.copy)(path.join(lambdaPath, ENTRY_POINT), tmpBootstrapJs)
    .then(() => {
      if (!fs.existsSync(deepFrameworkPackage)) {
        return Promise.resolve();
      }
      
      return pify(fse.readJson)(deepFrameworkPackage)
        .then(frameworkPackage => {
          Object.keys((frameworkPackage.dependencies || {}))
            .filter(deepLibrary => /^deep-/i.test(deepLibrary))
            .forEach(deepLibrary => {
              deepDeps[deepLibrary] = deepLibrary;
            });
            
          return Promise.resolve();  
        });
    })
    .then(() => {
      if (!fs.existsSync(schemasPath)) {
        return Promise.resolve();
      }
      
      return pify(fs.readdir)(schemasPath)
        .then(files => {
          files
            .filter(file => /\.js(on)?$/i)
            .forEach(file => {
              const schemasDir = Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR;
              const schemaInclude = `${LAMBDA_ROOT}/${schemasDir}/${file}`;
              
              deepDeps[schemaInclude] = `./${schemasDir}/${file}`;
            });
            
          return Promise.resolve(); 
        });
    })
    .then(() => {
      const deepDepsInject = [
        `global.${R_DEEP_DYN_MODULES} = global.${R_DEEP_DYN_MODULES} || {};`,
      ].concat(Object.keys(deepDeps).map(depKey => {
        return `global.${R_DEEP_DYN_MODULES}['${depKey}'] = require('${deepDeps[depKey]}');`;
      })).join('\n') + '\n';
      
      return pify(fs.readFile)(tmpBootstrapJs)
        .then(bootstrapContent => {
          return pify(fs.writeFile)(tmpBootstrapJs, deepDepsInject + bootstrapContent);
        });
    })
    .then(() => {      
      try {
        const rawConfig = plainify(webpackMerge.smart(
          defaultConfig, 
          fse.readJsonSync(
            customWebpackConfigPath, 
            { throws: false }
          ) || {}
        ), debug);
        
        return Promise.resolve({ rawConfig, tmpBootstrapJs });
      } catch (error) {
        console.debug(`Missing or broken custom Webpack config ${customWebpackConfigPath}. Using default one...`);
      }
      
      const rawConfig = plainify(defaultConfig, debug);

      return Promise.resolve({ rawConfig, tmpBootstrapJs });
    });
};
