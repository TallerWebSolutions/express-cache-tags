# express-cache-tags

[![npm version](https://img.shields.io/npm/v/express-cache-tags.svg?style=flat-square)](https://www.npmjs.com/package/express-cache-tags)
[![Downloads/week](https://img.shields.io/npm/dw/express-cache-tags.svg)](https://npmjs.org/package/express-cache-tags)
[![License](https://img.shields.io/npm/l/express-cache-tags.svg)](https://github.com/TallerWebSolutions/express-cache-tags/blob/master/package.json)
[![build status](https://img.shields.io/travis/TallerWebSolutions/express-cache-tags/master.svg?style=flat-square)](https://travis-ci.org/TallerWebSolutions/express-cache-tags)
[![coverage](https://img.shields.io/codecov/c/github/TallerWebSolutions/express-cache-tags.svg?style=flat-square)](https://codecov.io/github/TallerWebSolutions/express-cache-tags)

**A _(not yet)_ fully featured cache-tagging solution for node servers.**

---

## Motivation

Most HTTP servers rely on third-party systems for caching (such as CDNs). Even though this is probably the right approach, sometimes we need a fully featured, local, and simple caching and puring solution for a varying number of reasons. Whatever the reason is for you, we got you covered!

## Usage

### Installation

```
npm i express-cache-tags
```

### Usage

#### Middleware

```js
import express from 'express'
import cache from 'express-cache-tags'

express()
  .use(cache())
  // .get(...) your server routes
  .listen(3000)
```

#### Options

All the usage options receive the same options object:

| prop              | description                             | default                                                                  |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| cacheFactory      | A [cache-object](#cache-object) factory | A new [`memory-cache`](https://github.com/ptarjan/node-cache) instace    |
| generateKey       | A cache-key generator                   | `(req) => \`${req.method}:${rq.url}\``                                   |
| shouldCache       | Predicate to decide caching             | `() => true // cache anything the middleware touches`                    |
| statusHeader      | Hitting status header name              | `'CDN-Cache'`                                                            |
| logger            | Logging specific options                |                                                                          |
| logger.enabled    | Wheter or not to log operations         | `true`                                                                   |
| logger.scope      | Logging scope (see `signale`)           | `'CACHE'`                                                                |
| cacheTags         | Cache-tags specific options             |                                                                          |
| cacheTags.extract | Request cache-tags extractor            | `(req, res) => (res.get('Cache-Tags') || '').split(',').filter(Boolean)` |
| purger            | Purging specific options                |                                                                          |
| purger.extract    | Purging tags extractor                  | `(req, res) => (req.query.invalidate || '').split(',').filter(Boolean)`  |

##### Cache-object

A [`memory-cache`](https://github.com/ptarjan/node-cache) compatible object, with at least `get`, `put`, `keys`, and `clear` methods.
