

# npmlsp

> Listing dependencies in node project.

## Motivation

OSS have many dependencies. But we don't know all dependencies especially junior developer in that.
So we need to know what used in OSS with others. shallowly. 😛

## install

```
❯ npm i -g npmlsp
```

## Usage
execute in path to contained 'package.json'

```
❯ cd path/to/your_project
❯ npmlsp
  [ npmlsp ]
 The command line interface for listing dependencies information from 'package.json'
 https://github.com/shallwefootball/npmlsp#readme

  [ carrot-notes-cli ]
 Developer friendly CLI application for Japanese vocabulary note.
 None homepage
 .
 .
 .
```

![execute](https://raw.githubusercontent.com/shallwefootball/npmlsp/master/execute.gif)


## Note

 - *this cli not read node_modules likely npm.
 - listed except `@somescope/package`.

---

powerful yourself. 💪 © [amos](http://shallwefootball.com)