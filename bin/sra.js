#!/usr/bin/env node

require("@babel/polyfill");

const { exec, execSync, spawnSync } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs-extra');
const Ora = require('ora');
const boxen = require('boxen');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');

const originalPackageJSON = require('../package.json');

const execAsync = promisify(exec);
const packageJson = require('../package.json');

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = semver[0];
const { log, error } = console;

let projectName;

/**
 * Constants to replace in package.json
 */
const scripts = {
  start: 'cross-env NODE_ENV=development webpack-dev-server -d',
  build: 'cross-env NODE_ENV=production webpack -p',
  'lint:css': 'stylelint "./src/**/*.js"',
  test: 'jest',
};

/**
 * Node version validation
 */
if (major < 10) {
  error(
    `You are running Node ${
      currentNodeVersion
    }.\n`
      + 'Self React App requires Node 10 or higher. \n'
      + 'Please update your version of Node.',
  );
  process.exit(1);
}

/**
 * Initialization of CLI interpretation with commander
 */
const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectName = name;
  })
  .allowUnknownOption()
  .on('--help', () => {
    log(`    Only ${chalk.green('<project-directory>')} is required.`);
    log();
  })
  .parse(process.argv);

/**
 * Prints any error thrown by validate-npm-package-name
 * https://github.com/npm/validate-npm-package-name
 */
function printValidationResults(results) {
  if (typeof results !== 'undefined') {
    results.forEach((err) => {
      error(chalk.red(`  *  ${err}`));
    });
  }
}

/**
 * This method simply checks if the appName is a valid one,
 * or even if it's empty!
 * No shirt, no shoes, no name, no service!
 *
 * @param {String} appName
 */
const checkAppName = (appName) => {
  if (typeof appName === 'undefined') {
    error('Please specify the project directory:');
    log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`,
    );
    log();
    log('For example:');
    log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`);
    log();
    log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`,
    );
    process.exit(1);
  }

  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`,
      )} because of npm naming restrictions:`,
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  const dependencies = ['react', 'react-dom', 'react-scripts'].sort();
  if (dependencies.indexOf(appName) >= 0) {
    error(
      chalk.red(
        `We cannot create a project called ${chalk.green(
          appName,
        )} because a dependency with the same name exists.\n`
          + 'Due to the way npm works, the following names are not allowed:\n\n',
      )
        + chalk.cyan(dependencies.map(depName => `  ${depName}`).join('\n'))
        + chalk.red('\n\nPlease choose a different project name.'),
    );
    process.exit(1);
  }
};

/**
 * Simply enters directory and executes npm init
 * @param {String} appName
 * @param {Object} spinner
 */
const createValidPackageJson = async (appName, spinner) => {
  spinner.start('Initializing package with npm');
  await execAsync(`cd ${appName} && npm init -y`);
  spinner.succeed('npm init ran successfully');
};

const addPackagesAndConfigToPackageJson = async (root, spinner) => {
  spinner.start('Adding configuration to npm package');
  const packageLocation = `${root}/package.json`;
  const packageJSON = await fs.readJSON(packageLocation);
  const newPackageJSON = { ...packageJSON, scripts };
  await fs.writeJSON(packageLocation, newPackageJSON, { spaces: 2 });
  spinner.succeed('npm package configured');
  return Promise.resolve();
};


/**
 * This method will list all dependencies that are needed
 * for self react app only
 * @param {Object} deps - Object of dependencies from package.json
 */
const getProperDeps = (deps) => {
  const removablePackages = [
    'chalk',
    'commander',
    'fs-extra',,
    'cz-conventional-changelog',
    'commitizen',
    'ora',
    'validate-npm-package-name',
    'boxen',
    'semantic-release'
  ];
  const names = Object.keys(deps).filter(lib => !removablePackages.includes(lib));
  const packages = names.map(pkg => `${pkg}@${deps[pkg]}`);
  return packages;
};

/**
 *
 * @param {Object} deps - Object dependencies from package.json
 * @param {Object} devDeps - object devDependencies from package.json
 * @param {Object} spinner - Instance of Ora Spinner
 */
const npmInstallPackages = async (root, deps, isDeps, spinner) => {
  spinner.info(`Initializing installation of ${isDeps ? 'dependencies' : 'devDependencies'}`);
  log();
  const args = ['install', `${isDeps ? '--save' : '--save-dev'}`].concat(deps);

  const msg = isDeps ? 'dependencies installed' : 'devDependencies installed';
  const proc = spawnSync('npm', args, { stdio: 'inherit', cwd: root });

  if (proc.status !== 0) {
    throw new Error(`${proc.error}`);
  }
  spinner.succeed(msg);
};

/**
 *
 */
const setupRepo = async (root, spinner) => {
  spinner.start('Copying configuration files for react');
  const filesToCopy = [
    'README.md',
    'webpack.config.js',
    '.eslintrc.js',
    '.babelrc',
    'gitignore',
    'jest.config.js',
    '.stylelintrc'
  ];

  const promises = filesToCopy.map((file) => {
    let dst = `${root}/${file}`;
    if (file === 'gitignore') {
      dst = `${root}/.${file}`;
    }
    return fs.copy(path.join(__dirname, `../templates/${file}`), dst);
  });
  await Promise.all(promises);
  spinner.succeed('Configuration files copied');
};


const copyReactTemplateApp = async (root, appName, spinner) => {
  spinner.start('Copying React application files');
  await fs.copy(path.join(__dirname, '../templates/src'), `${appName}/src`);
  spinner.succeed('React codebase ready to go!');
};

/**
 * This function calls the functions to create the app scaffold
 * @param {String} root - Project root path
 * @param {String} appName - Project name
 * @param {String} originalDirectory - Directory where this script was executed
 */
const executeCreation = async (root, appName) => {
  const spinner = new Ora({
    text: 'Initializing project with npm init',
    spinner: 'boxBounce2',
  });

  try {
    const deps = getProperDeps(originalPackageJSON.dependencies);
    const devDeps = getProperDeps(originalPackageJSON.devDependencies);

    await createValidPackageJson(appName, spinner);
    await addPackagesAndConfigToPackageJson(root, spinner);

    await npmInstallPackages(root, deps, true, spinner);
    await npmInstallPackages(root, devDeps, false, spinner);

    await setupRepo(root, spinner);
    await copyReactTemplateApp(root, appName, spinner);
    log(
      boxen(`Your react application ${appName} is ready to go!\n To start coding the app run: cd ${appName}\n To start executing the application run: npm run start\n To start executing the application tests run: npm run test`,
        { padding: 1, borderStyle: 'doubleSingle', align: 'center ' }),
    );
  } catch (err) {
    spinner.fail(chalk.red(`Welp something broke 😓 ${err}`));
    execSync(`rm -rf ${appName}`);
    process.exit(1);
  }
};

/**
 * Initializes creation of application structure
 *
 * @param {String} name
 */
const createApp = (name) => {
  // Project root directory
  checkAppName(name);
  const root = path.resolve(name);

  fs.ensureDirSync(name);

  log(`Creating a new React app in ${chalk.green(root)}.`);
  log();
  executeCreation(root, name);
};


createApp(projectName);
