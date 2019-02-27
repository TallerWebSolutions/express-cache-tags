import request from 'supertest'
import express from 'express'
import std from 'std-mocks'

import { __get__ } from './middleware'

const createMiddleware = __get__('createMiddleware')

describe('middleware', () => {
  const testingEndpoint = jest.fn((req, res) =>
    res.set('Edge-Cache-Tag', 'one,two,three').send('cache testing endpoint')
  )

  beforeEach(() => jest.clearAllMocks())
  beforeEach(() => std.use())
  afterEach(() => std.restore())

  describe('instance', () => {
    it('should be a middleware factory', () => {
      expect(typeof createMiddleware).toBe('function')
      const middleware = createMiddleware()
      expect(typeof middleware).toBe('function')
      expect(middleware.length).toBe(3)
    })
  })

  it('should cache a response', async () => {
    let output

    const app = express()
      .use(createMiddleware())
      .get('/test', testingEndpoint)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    output = std.flush().stdout

    expect(testingEndpoint).toHaveBeenCalledTimes(1)
    expect(output).toHaveSomeMatching(/MISS "GET:\/test"/)
    expect(output).toHaveSomeMatching(
      /Cached "GET:\/test": \[\/test, one, two, three\]/
    )

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    output = std.flush().stdout

    expect(testingEndpoint).toHaveBeenCalledTimes(1) // not called a second time
    expect(output).not.toHaveSomeMatching(/MISS "GET:\/test"/)
    expect(output).not.toHaveSomeMatching(
      /Cached "GET:\/test": \[\/test, one, two, three\]/
    )

    expect(output).toHaveSomeMatching(/HIT "GET:\/test"/)
  })

  it('should purge cache', async () => {
    let output

    const app = express()
      .use(createMiddleware())
      .get('/test', testingEndpoint)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    await request(app)
      .get('/_cache/purge?invalidate=one')
      .expect(200, { purged: ['GET:/test'] })

    output = std.flush().stdout
    expect(output).toHaveSomeMatching(/Purged "one"/)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    output = std.flush().stdout

    expect(testingEndpoint).toHaveBeenCalledTimes(2) // not called a second time
    expect(output).not.toHaveSomeMatching(/HIT "GET:\/test"/)
    expect(output).toHaveSomeMatching(/MISS "GET:\/test"/)
    expect(output).toHaveSomeMatching(
      /Cached "GET:\/test": \[\/test, one, two, three\]/
    )
  })

  it('should NOT purge cache when unknown tag sent', async () => {
    let output

    const app = express()
      .use(createMiddleware())
      .get('/test', testingEndpoint)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    await request(app)
      .get('/_cache/purge?invalidate=unknown')
      .expect(200, { purged: [] })

    output = std.flush().stdout
    expect(output).toHaveSomeMatching(/Purged "unknown"/)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    output = std.flush().stdout

    expect(testingEndpoint).toHaveBeenCalledTimes(1) // not called a second time
    expect(output).toHaveSomeMatching(/HIT "GET:\/test"/)
  })

  it('should clear cache', async () => {
    let output

    const app = express()
      .use(createMiddleware())
      .get('/test', testingEndpoint)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    std.flush()

    await request(app)
      .get('/_cache/clear')
      .expect(200, { purged: ['GET:/test'] })

    output = std.flush().stdout
    expect(output).toHaveSomeMatching(/Purged everything/)

    await request(app)
      .get('/test')
      .expect(200, 'cache testing endpoint')

    output = std.flush().stdout

    expect(testingEndpoint).toHaveBeenCalledTimes(2) // not called a second time
    expect(output).not.toHaveSomeMatching(/HIT "GET:\/test"/)
    expect(output).toHaveSomeMatching(/MISS "GET:\/test"/)
    expect(output).toHaveSomeMatching(
      /Cached "GET:\/test": \[\/test, one, two, three\]/
    )
  })

  describe('status header', () => {
    it('should send cache status header', async () => {
      const app = express()
        .use(createMiddleware())
        .get('/test', testingEndpoint)

      await request(app)
        .get('/test')
        .expect('CDN-Cache', 'MISS')

      await request(app)
        .get('/test')
        .expect('CDN-Cache', 'HIT')
    })
    it('should send custom cache status header', async () => {
      const app = express()
        .use(createMiddleware({ statusHeader: 'Custom-CDN-Cache' }))
        .get('/test', testingEndpoint)

      await request(app)
        .get('/test')
        .expect('Custom-CDN-Cache', 'MISS')

      await request(app)
        .get('/test')
        .expect('Custom-CDN-Cache', 'HIT')
    })

    it('should NOT send cache status header when disabled', async () => {
      const app = express()
        .use(createMiddleware({ statusHeader: false }))
        .get('/test', testingEndpoint)

      await request(app)
        .get('/test')
        .expect(res => expect(res.get('CDN-Cache')).toBe(undefined))

      await request(app)
        .get('/test')
        .expect(res => expect(res.get('CDN-Cache')).toBe(undefined))
    })
  })
})
