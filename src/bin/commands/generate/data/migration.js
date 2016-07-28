/**
 * Created by CCristi on 5/11/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let MigrationGenerator = require('../../../../lib.compiled/Generator/MigrationGenerator').MigrationGenerator;
  let Property = require('deep-package-manager').Property_Instance;

  mainPath = this.normalizeInputPath(mainPath);
  let property = Property.create(mainPath);
  let microservice = this.opts.locate('microapp').value;
  let migrationSchema = {version: this.version};
  let microservices = property.microservices.filter(m => !m.isRoot).map(m => m.identifier);

  let promptMigrationSchema = (cb) => {
    let questionList = [];

    if (microservices.length === 1) {
      microservice = microservices[0];
    }

    if (microservice) {
      if (microservices.indexOf(microservice) === -1) {
        console.error(`Unknown microservice '${microservice}'. Available microservices: ${microservices.join(',')}`);
        this.exit(1);
      }

      migrationSchema.microservice = property.microservice(microservice);
    } else {
      questionList.push({
        type: 'list',
        name: 'microservice',
        message: 'Select the microservice: ',
        choices: microservices,
      });
    }

    if (questionList.length > 0) {
      inquirer.prompt(questionList).then((schema) => {
        if (schema.microservice) {
          schema.microservice = property.microservice(schema.microservice);
        }

        Object.assign(migrationSchema, schema);
        cb();
      });
    } else {
      cb();
    }
  };

  promptMigrationSchema(() => {
    new MigrationGenerator()
      .generate(mainPath, migrationSchema, (error, path) => {
        if (error) {
          console.error(`Error while generating migration: ${error}`);
          return;
        }

        console.info(`'Migration has been successfully generated in ${path}.`);
      });
  });
};
