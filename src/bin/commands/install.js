#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(microserviceRepo, dumpPath) {
  var fs = require('fs');
  var tmp = require('tmp');
  var path = require('path');
  var fse = require('fs-extra');
  var Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  var Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  var Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;

  if (dumpPath.indexOf('/') !== 0) {
    dumpPath = path.join(process.cwd(), dumpPath);
  }

  gitFetch(microserviceRepo, function(error) {
    if (error) {
      this.exit(1);
      return;
    }

    npmInstall('"babel@^5.x.x"', function(error) {
      if (error) {
        console.error('Error while installing babel: ' + error);
      }

      var prompt = new Prompt('Initialize backend?');

      prompt.readConfirm(function(result) {
        if (result) {
          console.log('Start preparing for production');

          var cmd = new Exec(
            Bin.node,
            this.scriptPath,
            'init-backend',
            dumpPath
          );

          cmd.run(function(result) {
            if (result.failed) {
              console.error(result.error);
            }

            console.log('The web application was successfully installed.');
          }, true);

          return;
        }

        console.log('The web application was successfully installed.');
      }.bind(this));
    }.bind(this));
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

  function gitFetch(repo, cb, copyFiles) {
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

        var srcDir = path.join(tmpFolder, 'src');

        if (!fs.existsSync(srcDir)) {
          var error = 'Missing "src" directory in ' + tmpFolder;

          fse.removeSync(tmpFolder);
          cb(new Error(error));
          return;
        }

        cleanupDir(srcDir);

        try {
          var subdir = getSubdirName(srcDir);
        } catch (e) {
          fse.removeSync(srcDir);
          cb(e);
          return;
        }

        var sourcePath = path.join(srcDir, subdir);
        var targetPath = path.join(dumpPath, subdir);

        fse.copySync(sourcePath, targetPath, {clobber: true});

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

  /**
   * @param {String} dir
   */
  function cleanupDir(dir) {
    new Exec('find', dir, '-type d -name ".git" -print0 | xargs -0 rm -rf')
      .avoidBufferOverflow()
      .runSync();
  }

  /**
   * @param {String} dir
   * @returns {String}
   */
  function getSubdirName(dir) {
    var dirFiles = fs.readdirSync(dir);

    if (dirFiles.length <= 0) {
      throw new Error('No sub directories in ' + dir);
    }

    for (var i in dirFiles) {
      if (!dirFiles.hasOwnProperty(i)) {
        continue;
      }

      var file = dirFiles[i];
      var filePath = path.join(dir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        return file;
      }
    }

    throw new Error('There is no directory in ' + dir);
  }
};
