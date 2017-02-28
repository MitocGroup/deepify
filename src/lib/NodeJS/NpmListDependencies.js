/**
 * Created by AlexanderC on 12/2/15.
 */

'use strict';

import {Bin} from './Bin';
import {Exec} from '../Helpers/Exec';
import {NpmDependency} from './NpmDependency';
import {NpmDepsListException} from './Exception/NpmDepsListException';
import Path from 'path';
import FileSystem from 'fs';

export class NpmListDependencies {
  /**
   * @param {String} path
   */
  constructor(path) {
    this._path = path;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }
  
  /**
   * @param {*} result
   *
   * @private
   */
  _tryFixMissing(result) {
    let deps = JSON.parse(result.result);

    if (!deps) {
      throw new Error(`Broken dependencies object: ${result.result}`);
    }
    
    (deps.problems || [])
      .filter(p => this._isMissingProblem(p))
      .map(problem => {
        this._findAndResolveProblemRootCause(deps, problem);
      });
  }
  
  /**
   * @param {*} deps
   * @param {String} problem
   *
   * @private
   */
  _findAndResolveProblemRootCause(deps, problem, _nesting = [], _originalDeps = null) {
    _originalDeps = _originalDeps || deps;
    _nesting.push(deps.name || deps.from.split('@')[0]);
    
    Object.keys(deps.dependencies || {}).forEach(childDep => {
      let childDeps = deps.dependencies[childDep];
      
      if (childDeps.missing) {
        childDeps.path = _nesting;
        childDeps.name = childDep;
        
        this._resolveMissingDep(_originalDeps, childDeps);
      } else if ((childDeps.problems || []).filter(p => p === problem).length > 0) {
        this._findAndResolveProblemRootCause(
          childDeps, 
          problem,
          _nesting,
          _originalDeps
        );
      }
    });
  }
  
  /**
   * @param {*} deps
   * @param {*} missingDep
   *
   * @private
   */
  _resolveMissingDep(deps, missingDep) {
    let name = missingDep.name;
    
    console.debug(
      `Try to fix broken dependency '${name}' in '${missingDep.path.join('::')}'`
    );
    
    let similarDeps = this._findSimilarDeps(deps, name);
    let existingSimilarDeps = similarDeps.filter(depVersion => {
      let depPath = Path.join(
        this._path, 
        'deep_modules', 
        `${name}@${depVersion}`
      );
      
      return FileSystem.existsSync(depPath);
    });
    
    console.debug(
      `Found ${similarDeps.length} ` +
      `(${existingSimilarDeps.length} existing) ` +
      `similar packages for '${name}'`
    );
    
    missingDep.path.shift();
    
    let depBasePath = Path.join(
      'node_modules',
      missingDep.path.join('/node_modules/'),
      'node_modules'
    );
    let depLinkPath = Path.join(
      ...Array.from(new Array(missingDep.path.length), () => '..'),
      'deep_modules',
      `${name}@${existingSimilarDeps[0]}`
    );
    
    let linkCmd = new Exec('rm', name, '&& ln -s', depLinkPath, name);
    linkCmd.cwd = Path.join(this._path, depBasePath);
    
    let result = linkCmd.runSync();
    
    if (result.failed) {
      throw new Error(result.error);
    }
  }
  
  /**
   * @param {*} deps
   * @param {String} name
   * @param {Stirng[]} filterPath
   *
   * @returns {Array}
   *
   * @private
   */
  _findSimilarDeps(deps, name, _similarDeps = []) {
    if (!deps.missing && deps.version && deps.name === name) {   
      return _similarDeps.push(deps.version);
    }
    
    Object.keys(deps.dependencies || {}).forEach(dep => {    
      deps.dependencies[dep].name = dep;
        
      this._findSimilarDeps(
        deps.dependencies[dep], 
        name,
        _similarDeps
      )
    });
    
    return _similarDeps;
  }
  
  /**
   * @param {String} problem
   *
   * @returns {Boolean}
   *
   * @private
   */
  _isMissingProblem(problem) {
    return /^missing:/i.test(problem);
  }

  /**
   * @param {Number|null} depth
   * 
   * @returns {NpmDependency}
   */
  list(depth = null, _tryFixMissing = true) {
    let cmd = new Exec(
      `${Bin.npm} ls --json true --parseable true --loglevel silent --production`,
      depth ? `--depth ${depth}` : ''
    );

    cmd.cwd = this._path;

    let result = cmd.runSync();

    if (result.failed) {
      if (_tryFixMissing) {
        this._tryFixMissing(result);
        
        return this.list(depth, false);
      }
      
      throw new NpmDepsListException(result.error, result.result);
    }

    let deps = JSON.parse(result.result);

    if (!deps) {
      throw new Error(`Broken dependencies object: ${result.result}`);
    }

    return NpmDependency.createFromRawObject(deps);
  }
}
