/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

function DeepResolver(options, webpack, ConstDependency) {
  this.ConstDependency = ConstDependency;
  this.webpack = webpack;
  this.options = Object.assign({
    dependencyContainer: '__deep_dyn_modules__',
  }, options);
  
  this._idx = 0;
  this._depContainer = {};
}

DeepResolver.prototype.addDep = function(depValue, originalRange) {
  const id = `__deep_dep${this._idx++}__`;
  const value = this.inlineRequire(depValue);
  
  this._depContainer[id] = value;
  
  return { id, value };
};

DeepResolver.prototype.hasDep = function(depId) {
  return this._depContainer.hasOwnProperty(depId);
};

DeepResolver.prototype.getDep = function(depId) {
  return this._depContainer[depId];
};

DeepResolver.prototype.inlineRequire = function(dep) {
  const containerId = this.options.dependencyContainer;
  
  return [
    `(function() {`,
    ` const dep = ${dep};`, 
    ` const container = global.${containerId} || {};`,
    ` if (container.hasOwnProperty(dep)) {`,
    `   return container[dep];`,
    ` }`,
    ` throw new Error('Missing dependency ' + dep);`,
    `})()`,
  ].join('\n');
};

DeepResolver.prototype.extend = function(config) {    
  const plugin = this;
  
  config.externals = (config.externals || []).concat([
    function(context, request, callback) { 
      
      // @todo extend external deps if needed     
      callback();
    }
  ]);
  
  return config;
};

DeepResolver.prototype.rawRequire = function(dep, value = false) {
  const content = dep.module.issuer._source._value;
  const range = value ? dep.valueRange : dep.range;
  
  return content.substring(...range);
}

DeepResolver.prototype.hookRequire = function(dep) {
  const depValue = this.rawRequire(dep, true);
  const deepDep = this.addDep(depValue, dep.valueRange);
  const { id, value } = deepDep;
  
  dep.rawRequest = id;
  dep.request = id;
  dep.userRequest = id;
  dep.recursive = false;
  delete dep.critical;
}

// @todo Add other libraries loaded dynamically
DeepResolver.prototype.DEPS_TO_HOOK = [
  /deep-validation\/lib(\.[a-z0-9]+)?\/Validation\.js$/i,
];

DeepResolver.prototype.apply = function(compiler) {
  const plugin = this;
  
  compiler.plugin('compilation', function(compilation, params) {
    params.normalModuleFactory.plugin('parser', function(parser, parserOptions) {
      parser.plugin('expression require.main', function(expr) {
        const value = '((__webpack_require__.c[__webpack_require__.s] && __webpack_require__.c[__webpack_require__.s].filename) ' +
          '? __webpack_require__.c[__webpack_require__.s] : undefined)';
          
        const dep = new plugin.ConstDependency(value, expr.range);
        
    		dep.loc = expr.loc;
    		this.state.current.addDependency(dep);
        
    		return true;
      });
    });
    
    compilation.plugin('seal', function() {
      for (let templateKey of compilation.dependencyTemplates.keys()) {
        if (templateKey.name === 'CommonJsRequireContextDependency') {
          const template = compilation.dependencyTemplates.get(templateKey);
          
          class DeepRequireTemplate extends template.constructor {
            apply(dep, source, outputOptions, requestShortener) {
              const containsDeps = dep.module && dep.module.dependencies && dep.module.dependencies.length > 0;
		          const isAsync = dep.module && dep.module.async;
              
              if (!(dep.module && (isAsync || containsDeps)) && plugin.hasDep(dep.request)) {
                const replacement = plugin.getDep(dep.request);
                
                source.replace(dep.range[0], dep.range[1] - 1, replacement);
                return;
              }
              
              super.apply(dep, source, outputOptions, requestShortener);
            }
          }
          
          compilation.dependencyTemplates.set(templateKey, new DeepRequireTemplate());
          break;
        }
      }
      
      compilation.modules.forEach(mod => {
        for (let depRegexp of plugin.DEPS_TO_HOOK) {
          if (depRegexp.test(mod.resource)) {
            console.log(`[DEEP-RSLVR] Fixing "Critical dependency" issue in "${mod.resource}"`);
            
            const criticalDeps = mod.dependencies.filter(dep => !!dep.critical);
            
            criticalDeps.forEach(dep => {
              plugin.hookRequire(dep);
            });
            
            break;
          }
        }
      });
    });
  });
};

module.exports = DeepResolver;
