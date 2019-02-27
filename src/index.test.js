import * as serverCache from 'server-cache'

describe('server-cache', () => {
  const exported = ['defaultOptions', 'createMiddleware']

  for (let name of exported) {
    it(`should export ${name}`, () => expect(serverCache).toHaveProperty(name))
  }
})
