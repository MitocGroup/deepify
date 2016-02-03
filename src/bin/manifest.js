/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

var path = require('path');
var jsonFile = require('jsonfile');

var packageConfig = jsonFile.readFileSync(path.join(__dirname, '../package.json'));

module.exports = {
  version: packageConfig.version,
  description: 'DEEP CLI',
  commandsPath: './commands',
  commands: {
    helloworld: {
      example: 'deepify helloworld path/to/web_app',
      description: 'Dump the "Hello World" sample web app',
      opts: {
      },
      args: {
        path: {
          description: 'The path to dump the sample web app into',
          required: true,
        },
      },
    },
    'install': {
      example: 'deepify install https://github.com/MitocGroup/deep-microservices-todo-app.git path/to/web_app',
      description: 'Install an microservice from remote git repository',
      opts: {
      },
      args: {
        repository: {
          description: 'The remote microservice git repository',
          required: true,
        },
        path: {
          description: 'The path to dump microservice into',
          required: true,
        },
      },
    },
    server: {
      example: 'deepify server path/to/web_app -o',
      description: 'Run local development server',
      opts: {
        'build-path': {
          alias: 'b',
          description: 'The path to the build (in order to pick up config)',
          required: false,
        },
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'skip-backend-build': {
          alias: 's',
          description: 'Skip building backend (dependencies installation in Lambdas and linking aws-sdk)',
          required: false,
        },
        'skip-build-hook': {
          alias: 'h',
          description: 'Skip running build hook (hook.build.js)',
          required: false,
        },
        port: {
          alias: 'p',
          description: 'Port to listen to',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
        'open-browser': {
          alias: 'o',
          description: 'Open browser after the server starts',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: true,
        },
      },
    },
    deploy: {
      example: 'deepify deploy path/to/web_app',
      description: 'Deploy an web app',
      opts: {
        prod: {
          description: 'Prepare web app for production and ensure prod env is used',
          required: false,
        },
        env: {
          alias: 'e',
          description: 'Web app environment to be used (default fetched from deploy config)',
          required: false,
        },
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without provisioning or publishing the code and data',
          required: false,
        },
        'dump-local': {
          alias: 'l',
          description: 'Dump built web app locally into the specified directory',
          required: false,
        },
        'pull-deps': {
          alias: 'p',
          description: 'Pull dependencies from the remote repository',
          required: false,
        },
        partial: {
          alias: 'm',
          description: 'Partial deploy (one or several comma separated microservices identifiers)',
          required: false,
        },
        fast: {
          alias: 'f',
          description: 'Faster deployment without copying the sources (may alter the web app state)',
          required: false,
        },
        'aws-sdk': {
          alias: 'a',
          description: 'Force latest aws-sdk in Lambda',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'enable-ssl': {
      example: 'deepify enable-ssl path/to/web_app',
      description: 'Enables SSL on a deployed web app',
      opts: {
        domain: {
          alias: 'd',
          description: 'The domain to create the certificate for (overrides the "deeploy.json" value)',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'disable-ssl': {
      example: 'deepify disable-ssl path/to/web_app',
      description: 'Disable activated SSL on a deployed web app',
      opts: {
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    undeploy: {
      example: 'deepify undeploy path/to/web_app',
      description: 'Remove web app provisioning and uploaded data',
      opts: {
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        'resource': {
          alias: 'r',
          description: 'An generated AWS resource name from given deploy (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        dirty: {
          alias: 'd',
          description: 'Force cleaning up all resources if .cfg.deeploy.json file missing',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'build-frontend': {
      example: 'deepify build-frontend path/to/web_app',
      description: 'Build frontend of a web app',
      opts: {
        'output-path': {
          alias: 'o',
          description: 'Path to output built frontend of the web app (default _www)',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'compile-es6': {
      example: 'deepify compile-es6 path/to/lambda',
      description: 'Compile ES6 scripts to ES5 using babel (matched by *.es6)',
      opts: {
      },
      args: {
        path: {
          description: 'The path to the lambda root',
          required: true,
        },
      },
    },
    'compile-prod': {
      example: 'deepify compile-prod path/to/web_app',
      description: 'Compile lambdas for production',
      opts: {
        'remove-source': {
          alias: 's',
          description: 'Remove original Lambda source',
          required: false,
        },
        partial: {
          alias: 'm',
          description: 'Partial deploy (one or several comma separated microservices identifiers)',
          required: false,
        },
        'aws-sdk': {
          alias: 'a',
          description: 'Force latest aws-sdk in Lambda',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'init-backend': {
      example: 'deepify init-backend path/to/web_app',
      description: 'Initialize backend',
      opts: {
        partial: {
          alias: 'm',
          description: 'Partial init (one or several comma separated microservices identifiers)',
          required: false,
        },
        prod: {
          alias: 'p',
          description: 'Run npm install with --prod flag',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'run-lambda': {
      example: 'deepify run-lambda path/to/the/lambda -e=\'{"Name":"John Doe"}\'',
      description: 'Run Lambda function locally',
      opts: {
        event: {
          alias: 'e',
          description: 'JSON string used as the Lambda payload',
          required: false,
        },
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: true,
        },
      },
    },
    'pull-deps': {
      example: 'deepify pull-deps path/to/web_app',
      description: 'Pull web app microservices\' dependencies',
      opts: {
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without pulling dependencies from the remote repository',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'push-deps': {
      example: 'deepify push-deps path/to/web_app',
      description: 'Publish microservices from within the given web app',
      opts: {
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without pushing microservices to the remote repository',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
  },
};
