#!/usr/bin/env node

const {ListCreator} = require('./ListCreator');

new ListCreator()
  .filterPackages()
  .runNpm()
  .out()
  .subscribe(() => {}, () => {
    process.exit(1);
  }, () => {
    process.exit(0);
  });
