#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(dumpPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var exec = require('child_process').exec;
  var ngRootRepoUrl = 'https://github.com/MitocGroup/deep-microservices-root-angularjs.git';
  var helloWorldRepoUrl = 'https://github.com/MitocGroup/deep-microservices-helloworld.git';
  var ngRootModule = 'DeepNgRoot';
  var helloWorldModule = 'DeepHelloWorld';

  if (dumpPath.indexOf('/') !== 0) {
    dumpPath = path.join(process.cwd(), dumpPath);
  }

  var helloWorldPath = path.join(dumpPath, helloWorldModule);
  var ngRootPath = path.join(dumpPath, ngRootModule);

  gitClone(helloWorldRepoUrl, 'src/' + helloWorldModule, helloWorldPath, function(error) {
    if (error) {
      this.exit(1);
      return;
    }

    gitClone(ngRootRepoUrl, 'src/' + ngRootModule, ngRootPath, function(error) {
      if (error) {
        this.exit(1);
        return;
      }

      npmInstall(['babel'], function(error) {
        if (!error) {
          console.log('Running "npm install" on SayHello Lambda');

          var lambdaPath = path.join(helloWorldPath, 'Backend/src/SayHello');

          exec('cd ' + lambdaPath + ' && npm install', function(error, stdout, stderr) {
            if (error) {
              console.error('Error installing SayHello Lambda dependencies: ' + stderr);
              return;
            }

            console.log('Sample property was successfully dumped.');
          }.bind(this));
        }
      });
    }.bind(this));
  }.bind(this));
};

function npmInstall(repos, cb) {
  var exec = require('child_process').exec;

  console.log('[NPM] Installing ' + repos.join(', ') + ' globally');

  exec('npm install -g ' + repos.join(' '), function(error, stdout, stderr) {
    if (error) {
      console.error('Error installing Babel globally: ' + stderr);

      cb(error);
      return;
    }

    cb(null);
  }.bind(this));
}

function gitClone(repo, subfolder, targetDir, cb) {
  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var exec = require('child_process').exec;
  var tmp = require('tmp');

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
    fse.removeSync(tmpFolder);

    cb(null);
  });
}
