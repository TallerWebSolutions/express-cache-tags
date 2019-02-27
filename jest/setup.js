const toHaveSomeMatching = (arr, regex) =>
  arr.some(string => typeof string === 'string' && regex.test(string))
    ? {
      message: () =>
        `expected [${arr.join(
          ', '
        )}] not to contain an item matching ${regex}`,
      pass: true
    }
    : {
      message: () =>
        `expected [${arr.join(', ')}] to contain an item matching ${regex}`,
      pass: false
    }

expect.extend({ toHaveSomeMatching })
