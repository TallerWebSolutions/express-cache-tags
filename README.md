# server-cache

[![npm version](https://img.shields.io/npm/v/server-cache.svg?style=flat-square)](https://www.npmjs.com/package/server-cache)
[![Downloads/week](https://img.shields.io/npm/dw/server-cache.svg)](https://npmjs.org/package/server-cache)
[![License](https://img.shields.io/npm/l/server-cache.svg)](https://github.com/lucasconstantino/server-cache/blob/master/package.json)
[![build status](https://img.shields.io/travis/lucasconstantino/server-cache/master.svg?style=flat-square)](https://travis-ci.org/lucasconstantino/server-cache)
[![coverage](https://img.shields.io/codecov/c/github/lucasconstantino/server-cache.svg?style=flat-square)](https://codecov.io/github/lucasconstantino/server-cache)

**A _(not yet)_ fully featured caching solution for node servers.**

---

## Motivation

Most HTTP servers rely on third-party systems for caching (such as CDNs). Even though this is probably the right approach, sometimes we need a fully featured, local, and simple caching and puring solution for a varying number of reasons. Whatever the reason is for you, we got you covered!

## Usage

### Installation

```
npm i server-cache
```

### Usage

#### Middleware

```js
import express from 'express'
import cache from 'server-cache'

express()
  .use(cache())
  // .get(...) your server routes
  .listen(3000)
```

#### Options

All the usage options receive the same options object:

| prop              | description                             | default                                                                      |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| cacheFactory      | A [cache-object](#cache-object) factory | A new [`memory-cache`](https://github.com/ptarjan/node-cache) instace        |
| generateKey       | A cache-key generator                   | `(req) => \`${req.method}:${rq.url}\``                                       |
| shouldCache       | Predicate to decide caching             | `() => true // cache anything the middleware touches`                        |
| statusHeader      | Hitting status header name              | `'CDN-Cache'`                                                                |
| logger            | Logging specific options                |                                                                              |
| logger.enabled    | Wheter or not to log operations         | `true`                                                                       |
| logger.scope      | Logging scope (see `signale`)           | `'CACHE'`                                                                    |
| cacheTags         | Cache-tags specific options             |                                                                              |
| cacheTags.extract | Request cache-tags extractor            | `(req, res) => (res.get('Cache-Tags') || '').split(',').filter(Boolean)` |
| purger            | Purging specific options                |                                                                              |
| purger.extract    | Purging tags extractor                  | `(req, res) => (req.query.invalidate || '').split(',').filter(Boolean)`      |

##### Cache-object

A [`memory-cache`](https://github.com/ptarjan/node-cache) compatible object, with at least `get`, `put`, `keys`, and `clear` methods.
