/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import request from 'fetchy-request';
import {Tag} from './Tag';
import {Registry_Resolver_Strategy_SemVerStrategy as SemVerStrategy} from 'deep-package-manager';
import tar from 'tar-stream';
import gunzip from 'gunzip-maybe';
import {Helpers_WaitFor as WaitFor} from 'deep-package-manager';
import {StandardStrategy} from './ExtractStrategy/StandardStrategy';

export class Dependency {
  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   */
  constructor(dependencyName, dependencyVersion) {
    this._dependencyName = dependencyName;
    this._dependencyVersion = dependencyVersion;

    this._repository = Dependency.parseDependencyRepository(dependencyName);

    if (!this._repository) {
      throw new Error(`Unable to parse GitHub repository ${this.shortDependencyName}`);
    }

    Dependency.__cache__ = [];
  }

  /**
   * @param {String} dumpPath
   * @param {Function} cb
   * @param {AbstractStrategy|StandardStrategy|*} extractStrategy
   */
  extract(dumpPath, cb, extractStrategy = null) {
    console.log(`Searching for suitable '${this.shortDependencyName}' dependency version`);

    this.findSuitableTag((error, tag) => {
      if (error) {
        cb(error);
        return;
      }

      console.log(`Fetching suitable '${this.shortDependencyName}' dependency version from '${tag.sourceUrl}'`);

      request(Dependency._createRequestPayload(Dependency._normalizeSourceUrl(tag.sourceUrl)))
        .then((response) => {
          if (!response.ok) {
            cb(response._error || new Error(response.statusText));
            return;
          }

          console.log(`Dumping '${this.shortDependencyName}' dependency into '${dumpPath}'`);

          extractStrategy = extractStrategy || new StandardStrategy(dumpPath);

          let unTarStream = tar.extract();

          let wait = new WaitFor();
          let filesToExtract = 0;

          wait.push(() => {
            return filesToExtract <= 0;
          });

          unTarStream.on('entry', (header, stream, next) => {
            if (header.type === 'directory') {
              next();
              return;
            }

            filesToExtract++;

            let filePath = header.name.replace(/^([^\/]+\/)/, '');

            extractStrategy.extract(filePath, stream, () => {
              filesToExtract--;

              next();
            });
          });

          unTarStream.on('finish', () => {
            wait.ready(cb);
          });

          response.body
            .pipe(gunzip())
            .pipe(unTarStream);

        }).catch(cb);
    });
  }

  /**
   * @param {Function} cb
   */
  findSuitableTag(cb) {
    if (Dependency.__cache__.hasOwnProperty(this._repository)) {
      console.log(`Using GitHub repository '${this._repository}' tags from cache`);

      cb(...this._findSuitable(Dependency.__cache__[this._repository]));
      return;
    }

    console.log(`Fetching GitHub repository '${this._repository}' tags`);

    this.getAvailableTags((error, tags) => {
      if (error) {
        cb(error, null);
        return;
      }

      Dependency.__cache__[this._repository] = tags;

      cb(...this._findSuitable(tags));
    });
  }

  /**
   * @param {Tag[]} tags
   * @returns {Array}
   * @private
   */
  _findSuitable(tags) {
    let semverStrategy = new SemVerStrategy();
    let versions = tags.map((tag) => tag.name);

    let matchedVersion = semverStrategy.resolve({
      getVersions: () => versions,
    }, this._dependencyVersion);

    if (!matchedVersion) {
      return [
        new Error(
          `No suitable version found for '${this.shortDependencyName}@${this._dependencyVersion}' (${versions.join(', ')})`
        ),
        null
      ];
    }

    for (let i in tags) {
      if (!tags.hasOwnProperty(i)) {
        continue;
      }

      let tag = tags[i];

      if (SemVerStrategy.CLEAN_FUNC(tag.name) === matchedVersion) {
        return [null, tag];
      }
    }
  }

  /**
   * @param {Function} cb
   */
  getAvailableTags(cb) {
    request(Dependency._createRequestPayload(Dependency.TAGS_URI_TPL.replace(/\{repository\}/i, this._repository)))
      .then((response) => {
        if (!response.ok) {
          cb(response._error || new Error(response.statusText), null);
          return;
        }

        response
          .text()
          .then((plainData) => {
            try {
              cb(null, Tag.createFromMetadataVector(this._repository, JSON.parse(plainData)));
            } catch (error) {
              cb(error, null);
            }
          })
          .catch((error) => {
            cb(error, null);
          });
      }).catch((error) => {
        cb(error, null);
      });
  }

  /**
   * @returns {String}
   */
  get shortDependencyName() {
    return this._repository.split('/')[1];
  }

  /**
   * @returns {String}
   */
  get dependencyName() {
    return this._dependencyName;
  }

  /**
   * @returns {String}
   */
  get dependencyVersion() {
    return this._dependencyVersion;
  }

  /**
   * @returns {String|*}
   */
  get repository() {
    return this._repository;
  }


  /**
   * @param {String} sourceUrl
   * @returns {String}
   * @private
   *
   * @example https://codeload.github.com/MitocGroup/deep-microservices-todo-app/legacy.tar.gz/v0.0.1
   *          ---->
   *          https://api.github.com/repos/MitocGroup/deep-microservices-todo-app/tarball/v0.0.1
   */
  static _normalizeSourceUrl(sourceUrl) {
    let matches = sourceUrl.match(/https?:\/\/api\.github\.com\/repos\/([^\/]+\/[^\/]+)\/tarball\/([^\/]+)$/i);

    if (!matches || matches.length < 3) {
      return sourceUrl;
    }

    let repo = matches[1];
    let version = matches[2];

    return `https://codeload.github.com/${repo}/legacy.tar.gz/${version}`;
  }

  /**
   * @param {String} uri
   * @returns {Object}
   */
  static _createRequestPayload(uri) {
    return {
      uri: uri,
      method: 'GET',
      retry: 3,
      headers: {
        'User-Agent': 'User-Agent	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11) AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56',
        Accept: '*/*',
      },
    };
  }

  /**
   * @param {String} dependencyName
   * @returns {Boolean}
   */
  static isGitHubDependency(dependencyName) {
    return !!Dependency.parseDependencyRepository(dependencyName);
  }

  /**
   * @param {String} dependencyName
   * @returns {String|null}
   */
  static parseDependencyRepository(dependencyName) {
    let repo = dependencyName.match(/^github:\/\/([^\/]+\/[^\/]+)$/i);

    if (repo && repo.length === 2) {
      return repo[1].toString();
    }

    return null;
  }

  /**
   * @returns {String}
   */
  static get TAGS_URI_TPL() {
    return 'https://api.github.com/repos/{repository}/tags';
  }
}
