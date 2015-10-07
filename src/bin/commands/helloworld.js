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

    npmInstall('babel', function(error) {
      console.log('Sample property was successfully dumped.');

      //if (!error) {
      //  console.log('Running "npm install" on SayHello Lambda');
      //
      //  var lambdaPath = path.join(helloWorldPath, 'Backend/src/SayHello');
      //
      //  exec('cd ' + lambdaPath + ' && npm install', function(error, stdout, stderr) {
      //    if (error) {
      //      console.error('Error installing SayHello Lambda dependencies: ' + stderr);
      //      return;
      //    }
      //
      //    console.log('Sample property was successfully dumped.');
      //  }.bind(this));
      //}
    });
  }.bind(this));
};

function npmInstall(repo, cb) {
  var exec = require('child_process').exec;

  console.log('[NPM] Installing ' + repo + ' globally');

  exec('npm list -g --depth 1 ' + repo + ' > /dev/null 2>&1 || npm install -g ' + repo, function(error, stdout, stderr) {
    if (error) {
      console.error('Error installing ' + repo + ' globally: ' + stderr);

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

  exec('cd ' + tmpFolder + ' && git clone --depth=1 ' + repo + ' .', function(error, stdout, stderr) {
    if (error) {
      console.error('Error cloning ' + repo + ' repository into ' + tmpFolder + ': ' + stderr);

      fse.removeSync(tmpFolder);
      cb(error);
      return;
    }

    if (fs.existsSync(targetDir)) {
      fse.mkdirSync(targetDir);
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
