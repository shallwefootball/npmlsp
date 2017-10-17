#!/usr/bin/env node

const {resolve} = require('path');
const {EOL} = require('os');

const {Observable} = require('rxjs');
const {exec} = require('child_process');
const {readJson} = require('fs-extra');
const map = require('lodash/map');
const ora = require('ora');
const meow = require('meow');
const updateNotifier = require('update-notifier');
require('colors');

const pkg = require('./package.json');
updateNotifier({pkg}).notify();

const exec$ = Observable.bindNodeCallback(exec);
const readJson$ = Observable.bindNodeCallback(readJson);
const pack$ = readJson$(resolve(process.cwd(), 'package.json'));

const helpText = `
  Usage
    $ npmlsp 
`;

class ListPackage {
  constructor() {
    this.spinner = ora();
    this.cli = meow(helpText);
  }

  readPackage() {
    this.spinner.start('Reading \'package.json\'...');
    this.$ = pack$.mergeMap(({dependencies, devDependencies}) => {
      const deps = Object.assign(dependencies, devDependencies);
      for (const key in deps) {
        /@/.test(key) && delete deps[key];
      }
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
          `[ ${name} ]`,
          ` ${description}`.grey,
          ` ${homepage || 'None homepage'}`
        ].join(EOL) + EOL;
      })
      .map(text => {
        this.spinner.stopAndPersist({text});
      });
    return this;
  }

  subscribe() {
    this.$ = this.$.subscribe(null, err => {
      this.spinner.fail(err.stack);
      process.exit(1);
    }, () => {
      this.spinner.succeed('Done.');
      process.exit(0);
    });
    return this;
  }
}

new ListPackage()
  .readPackage()
  .runNpm()
  .out()
  .subscribe();