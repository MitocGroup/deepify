#!/usr/bin/env node
/**
 * Created by CCristi on 5/12/16.
 */

'use strict';

let path = require('path');
let Twig = require(path.join(__dirname, '../lib.compiled/Generator/AbstractGenerator')).AbstractGenerator.TWIG_TEMPLATING;
let FS = require('fs');
let manifest = require(path.join(__dirname, '../bin/manifest'));
let templateRaw = FS.readFileSync(path.join(__dirname, './deepify_comp.sh.twig')).toString();
let scriptRaw = Twig.render(templateRaw, {manifest});
let scriptPath = path.join(__dirname, './deepify_comp.sh');

FS.writeFileSync(scriptPath, scriptRaw, {
  mode: 0o755
});

console.log(`Deepify autocomplete was dumped into '${scriptPath}'`);

process.exit(0);
