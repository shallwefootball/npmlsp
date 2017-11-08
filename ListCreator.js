const {resolve} = require('path');
const {EOL} = require('os');

const {Observable} = require('rxjs');
const {exec} = require('child_process');
const {readJson} = require('fs-extra');
const map = require('lodash/map');
const ora = require('ora');
const meow = require('meow');
const updateNotifier = require('update-notifier');
const chalk = require('chalk');

const pkg = require('./package.json');
updateNotifier({pkg}).notify();

const exec$ = Observable.bindNodeCallback(exec);
const readJson$ = Observable.bindNodeCallback(readJson);

const helpText = `
  Usage
    $ npmlsp 
`;

class ListCreator {
  constructor() {
    this.spinner = ora();
    this.cli = meow(helpText);
    this.$ = readJson$(resolve(process.cwd(), 'package.json'));
  }

  readPackage() {
    this.spinner.start('Reading \'package.json\'...');
    this.$ = this.$.mergeMap(({dependencies = {}, devDependencies = {}}) => {
      const deps = Object.assign(dependencies, devDependencies);
      for (const key in deps) {
        /@/.test(key) && delete deps[key];
      };
      return map(deps, (val, key) => `${key}`);
    });
    return this;
  }

  runNpm() {
    this.spinner.text = 'Requesting dependency information...';
    this.$ = this.$.mergeMap(packageName => {
      return exec$(`npm view ${packageName} name description homepage --json`)
        .map(std => {
          const stdout = std[0];
          return JSON.parse(stdout);
        });
    });
    return this;
  }

  out() {
    this.$ = this.$
      .map(({name, description, homepage}) => {
        return [
          `${name}  ${chalk.gray(description)}`,
          `  ${chalk.blue.underline(homepage) || 'None homepage'}`
        ].join(EOL) + EOL;
      });
    return this;
  }

  subscribe(next, errHandler, done) {
    this.$ = this.$.subscribe(text => {
      this.spinner.stopAndPersist({text});
      next();
    }, err => {
      this.spinner.fail(err.stack);
      errHandler(err);
    }, () => {
      this.spinner.succeed('Done.');
      done();
    });
    return this;
  }
}

exports.ListCreator = ListCreator;
