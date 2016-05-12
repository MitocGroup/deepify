#!/usr/bin/env node
/**
 * Created by CCristi on 5/12/16.
 */

'use strict';

let Twig = require('../lib.compiled/Generator/AbstractGenerator').AbstractGenerator.TWIG_TEMPLATING;
let path = require('path');
let FS = require('fs');
let manifest = require('../bin/manifest');
let templateRaw = FS.readFileSync(path.join(__dirname, './deepify_comp.sh.twig')).toString();
let scriptRaw = Twig.render(templateRaw, {manifest});

FS.writeFileSync(path.join(__dirname, './deepify_comp.sh'), scriptRaw, {
  mode: 0o755
});

process.exit(0);
