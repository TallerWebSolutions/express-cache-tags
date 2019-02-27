import * as serverCache from 'express-cache-tags'

describe('express-cache-tags', () => {
  const exported = ['defaultOptions', 'createMiddleware']

  for (let name of exported) {
    it(`should export ${name}`, () => expect(serverCache).toHaveProperty(name))
  }
})
