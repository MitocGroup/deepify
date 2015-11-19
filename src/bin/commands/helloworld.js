#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var exec = require('child_process').exec;
  var helloWorldRepoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';
  var helloWorldModule = 'DeepHelloWorld';

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
};

function npmInstall(repo, cb) {
  var exec = require('child_process').exec;

  console.log('Installing ' + repo + ' via NPM globally');

  exec('npm list -g --depth 1 ' + repo + ' > /dev/null 2>&1 || npm install -g ' + repo + ' &>/dev/null', function(error) {
    if (error) {
      console.error('Error installing ' + repo + ' globally!');

      cb(error);
      return;
    }

    cb(null);
  }.bind(this));
}

function gitClone(repo, subfolder, targetDir, cb, copyFiles) {
  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var exec = require('child_process').exec;
  var tmp = require('tmp');

  copyFiles = copyFiles || {};

  var tmpFolder = tmp.dirSync().name;

  console.log('Cloning the ' + repo + ' into ' + tmpFolder);

  exec('cd ' + tmpFolder + ' && git clone --depth=1 ' + repo + ' . &>/dev/null', function(error) {
    if (error) {
      console.error('Error cloning ' + repo + ' repository into ' + tmpFolder);

      fse.removeSync(tmpFolder);
      cb(error);
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
  });
}
