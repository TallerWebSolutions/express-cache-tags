import { Router } from 'express'
import onFinished from 'on-finished'
import cache from 'memory-cache'

import loggerFactory from './logger'

export const defaultOptions = {
  /**
   * Generates a cache instance.
   *
   * @param {Object} options The instantiating options.
   *
   * @return {Object} The caching instance.
   *   must be compatible with https://github.com/ptarjan/node-cache interface
   *   (thought it can read/write asynchronously).
   */
  cacheFactory: () => new cache.Cache(),

  /**
   * Generates a cache-key based on a request/response.
   *
   * @param {Request} req The request.
   * @param {Response} res The response.
   *
   * @return {String} The cache-key.
   */
  generateKey: ({ method, url }, res) => `${method}:${url}`,

  /**
   * Determines if a given request/response should be cached.
   *
   * @param {Request} req The request.
   * @param {Response} res The response.
   *
   * @return {Boolean}
   */
  shouldCache: () => true,

  /**
   * @param {String} statusHeader The header to send MISS/HIT status (false for none).
   */
  statusHeader: 'CDN-Cache',

  logger: {
    enabled: true,
    scope: 'CACHE'
  },

  /**
   * @param {Object} cacheTags Cache-tags options (false for disable).
   */
  cacheTags: {
    /**
     * Parse cache-tags from a request/response.
     *
     * @param {Request} req The request.
     * @param {Response} res The response.
     *
     * @return {String}
     */
    extract: (req, res) => (res.get('Edge-Cache-Tag') || '').split(',')
  },

  /**
   * @param {Object} purger Purging options.
   */
  purger: {
    /**
     * Parse cache-tags from a request/response for cleasing.
     *
     * @param {Request} req The request.
     * @param {Response} res The response.
     *
     * @return {String}
     */
    extract: (req, res) => (req.query.invalidate || '').split(',')
  }
}

export const createMiddleware = (options = {}) => {
  const config = {
    ...defaultOptions,
    ...options
  }

  const {
    cacheFactory,
    generateKey,
    shouldCache,
    statusHeader,
    logger,
    cacheTags,
    purger
  } = config

  const cache = cacheFactory(config)
  const log = loggerFactory.scope(logger.scope)

  /**
   * Caching middleware/interceptor.
   *
   * @param {Request} req The HTTP request.
   * @param {Response} res The HTTP response.
   * @param {Function} next The chaining callback.
   */
  const interceptor = async (req, res, next) => {
    if (!shouldCache(req, res)) return next()

    const key = generateKey(req, res)
    let cached = await cache.get(key)
    const miss = !cached
    const status = miss ? 'MISS' : 'HIT'
    const statusHeaderContent = statusHeader ? { [statusHeader]: status } : {}

    /* istanbul ignore next */
    if (logger.enabled) log.info(`${status} "${key}"`)

    if (miss) {
      res.set(statusHeaderContent)

      let endArgs
      const end = res.end.bind(res)

      // intercept response ending to persist args.
      res.end = (...args) => {
        endArgs = args
        return end(...args)
      }

      onFinished(res, async (err, res) => {
        if (err) throw err

        // use the requests URL as a caching-tag for URL based purging.
        let tags = [req.url]
        const headers = res.getHeaders()

        // append cache-tags to the caching tags.
        if (cacheTags) tags = tags.concat(cacheTags.extract(req, res))

        /* istanbul ignore next */
        if (logger.enabled) log.info(`Cached "${key}": [${tags.join(', ')}]`)

        cached = { key, tags, response: { endArgs, headers } }
        await cache.put(key, cached)
      })

      return next()
    }

    const { endArgs, headers } = cached.response

    res
      .set(headers)
      .set(statusHeaderContent)
      .end(...endArgs)
  }

  const clear = async (req, res) => {
    const purged = await cache.keys()
    await cache.clear()

    /* istanbul ignore next */
    if (logger.enabled) {
      log[purged.length ? 'success' : 'warning'](
        `Purged everything: [${purged.join(', ')}]`
      )
    }

    res.json({ purged })
  }

  const purge = async (req, res, next) => {
    const invalidate = purger.extract(req, res)
    const purged = []

    for (let key of cache.keys()) {
      if (cache.get(key).tags.some(tag => invalidate.includes(tag))) {
        await cache.del(key)
        purged.push(key)
      }
    }

    /* istanbul ignore next */
    if (logger.enabled) {
      log[purged.length ? 'success' : 'warning'](
        `Purged "${invalidate}": [${purged.join(', ')}]`
      )
    }

    res.json({ purged })
  }

  return Router()
    .get('/_cache/clear', clear)
    .get('/_cache/purge', purge)
    .use(interceptor)
}

export default createMiddleware
