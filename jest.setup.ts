import nock from 'nock'

nock.disableNetConnect()

// This request needs to be mocked before the Yearn SDK module is imported
// otherwise we'll get an HTTP error because we block all outbound requests
nock('https://raw.githubusercontent.com')
  .get('/yearn/yearn-assets/master/icons/aliases.json')
  .reply(200, [])
  .persist()
