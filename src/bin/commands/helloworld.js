#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {

  // @todo: put it anywhere in a config
  var helloWorldRepoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';
  var helloWorldModule = 'DeepHelloWorld';

  var fs = require('fs');
  var tmp = require('tmp');
  var path = require('path');
  var fse = require('fs-extra');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;

  if (dumpPath.indexOf('/') !== 0) {
    dumpPath = path.join(process.cwd(), dumpPath);
  }

  var helloWorldPath = path.join(dumpPath, helloWorldModule);

  gitClone(helloWorldRepoUrl, 'src/' + helloWorldModule, helloWorldPath, function(error) {
    if (error) {
      this.exit(1);
      return;
    }

    npmInstall('"babel@^5.x.x"', function(error) {
      if (error) {
        console.error('Error while installing babel: ' + error);
      }

      console.log('Sample web app was successfully dumped.');
    });
  }.bind(this));

  function npmInstall(repo, cb) {
    console.log('Installing ' + repo + ' via NPM globally');

    new Exec('npm list -g --depth 0 ' + repo + ' || npm install -g ' + repo)
      .avoidBufferOverflow()
      .run(function(result) {
        if (result.failed) {
          console.error('Error installing ' + repo + ' globally: ' + result.error);

          cb(result.error);
          return;
        }

        cb(null);
      }.bind(this));
  }

  function gitClone(repo, subfolder, targetDir, cb, copyFiles) {
    copyFiles = copyFiles || {};

    var tmpFolder = tmp.dirSync().name;

    console.log('Cloning the ' + repo + ' into ' + tmpFolder);

    var cmd = new Exec('git', 'clone', '--depth=1', repo, '.');
    cmd.cwd = tmpFolder;

    cmd
      .avoidBufferOverflow()
      .run(function(result) {
        if (result.failed) {
          console.error('Error cloning ' + repo + ' repository into ' + tmpFolder + ': ' + result.error);

          fse.removeSync(tmpFolder);
          cb(result.error);
          return;
        }

        fse.copySync(path.join(tmpFolder, subfolder), targetDir, {clobber: true});

        var copyFilesKeys = Object.keys(copyFiles);

        for (var i in copyFilesKeys) {
          if (!copyFilesKeys.hasOwnProperty(i)) {
            continue;
          }

          var fSrc = copyFilesKeys[i];
          var fDes = copyFiles[fSrc];

          fse.copySync(path.join(tmpFolder, fSrc), fDes, {clobber: true});
        }

        fse.removeSync(tmpFolder);

        cb(null);
      }.bind(this));
  }
};
