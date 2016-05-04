/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/29/16.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let inquirer = require('inquirer');
  let MicroserviceGenerator = require('../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;

  mainPath = this.normalizeInputPath(mainPath);
  let name = this.opts.locate('name').value;

  console.log(`
Welcome to Deepify Microapp generator

This command helps you generate microapp skeleton.
We recomment to use a microservice name convention like (SkeletonMicroApp).
  `);

  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the microservice name: ',
      validate: alphanumericalNotEmpty,
      default: name
    },
    {
      type: 'list',
      name: 'engine',
      message: 'Select the frontend engine you\'d like to use: ',
      choices: MicroserviceGenerator.ALLOWED_ENGINES
    }
  ]).then((schema) => {
    let generator = new MicroserviceGenerator();
    generator.generate(mainPath, schema, (error, path) => {
      if (error) {
        console.error(`An error has occurred while generating the microapp: ${error}`);
        this.exit(1);
      }

      console.log(`'${schema.name}' microapp has been successfully generated in ${path}`);
    });
  })
};

function alphanumericalNotEmpty(value) {
  if (!/^[a-zA-Z0-9_\-]{3,}$/.test(value)) {
    return 'Microservice name should contain only [a-zA-Z0-9_-]';
  }

  return true;
}
