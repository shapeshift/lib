# [@shapeshiftoss/chain-adapters-v1.22.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.22.0...@shapeshiftoss/chain-adapters-v1.22.1) (2021-12-15)

# [@shapeshiftoss/chain-adapters-v1.22.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.21.1...@shapeshiftoss/chain-adapters-v1.22.0) (2021-12-10)


### Features

* add getcaip2 and caip identifiers to getaccount ([#279](https://github.com/shapeshift/lib/issues/279)) ([c1c819b](https://github.com/shapeshift/lib/commit/c1c819b682920b2887f7e11d1c3459f67354aadf))

# [@shapeshiftoss/chain-adapters-v1.21.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.21.0...@shapeshiftoss/chain-adapters-v1.21.1) (2021-12-09)


### Bug Fixes

* normalize case for caip contract identifiers (eth). remove chainSpecific from subscribeTxs (eth) ([#277](https://github.com/shapeshift/lib/issues/277)) ([6da16c2](https://github.com/shapeshift/lib/commit/6da16c203b86d19983c8c66f45e25d363d482df5))

# [@shapeshiftoss/chain-adapters-v1.21.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.20.1...@shapeshiftoss/chain-adapters-v1.21.0) (2021-12-08)


### Features

* update subscribeTxs to use new tx parser payloads ([#266](https://github.com/shapeshift/lib/issues/266)) ([f77a277](https://github.com/shapeshift/lib/commit/f77a277e1942a4ee4229ce095c17e9c51907e2b9))

# [@shapeshiftoss/chain-adapters-v1.20.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.20.0...@shapeshiftoss/chain-adapters-v1.20.1) (2021-12-03)


### Bug Fixes

* to address on erc20 sends ([#265](https://github.com/shapeshift/lib/issues/265)) ([3c0b439](https://github.com/shapeshift/lib/commit/3c0b4397454e8f25c03092e7b6c5c9c569247743))

# [@shapeshiftoss/chain-adapters-v1.20.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.19.0...@shapeshiftoss/chain-adapters-v1.20.0) (2021-12-02)


### Features

* send max ([#262](https://github.com/shapeshift/lib/issues/262)) ([dab48ec](https://github.com/shapeshift/lib/commit/dab48ecabc808ecf0de8989bf390003bd6483517))

# [@shapeshiftoss/chain-adapters-v1.19.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.18.4...@shapeshiftoss/chain-adapters-v1.19.0) (2021-11-30)


### Features

* use sibling packages as peerDependencies ([#229](https://github.com/shapeshift/lib/issues/229)) ([7de039e](https://github.com/shapeshift/lib/commit/7de039e89907d98048fe6b1e39b4a1e64377cb50))

# [@shapeshiftoss/chain-adapters-v1.18.4](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.18.3...@shapeshiftoss/chain-adapters-v1.18.4) (2021-11-24)


### Bug Fixes

* parse ignored approved txs in eth chain adapter ([#254](https://github.com/shapeshift/lib/issues/254)) ([d1733d7](https://github.com/shapeshift/lib/commit/d1733d7f80dfbe5e8b52624eed0935bd380ec11a))

# [@shapeshiftoss/chain-adapters-v1.18.3](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.18.2...@shapeshiftoss/chain-adapters-v1.18.3) (2021-11-19)


### Bug Fixes

* remove unused `from` calculation ([#246](https://github.com/shapeshift/lib/issues/246)) ([d2240f1](https://github.com/shapeshift/lib/commit/d2240f13cd08bb41f6e00417d3bb720c38ab6efb))

# [@shapeshiftoss/chain-adapters-v1.18.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.18.1...@shapeshiftoss/chain-adapters-v1.18.2) (2021-11-19)


### Bug Fixes

* only publish send message if associated with send ([#245](https://github.com/shapeshift/lib/issues/245)) ([547e917](https://github.com/shapeshift/lib/commit/547e917b30e3069d84ca358195e8b41f8661280e))

# [@shapeshiftoss/chain-adapters-v1.18.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.18.0...@shapeshiftoss/chain-adapters-v1.18.1) (2021-11-18)


### Bug Fixes

* treat all sends as same account ([#244](https://github.com/shapeshift/lib/issues/244)) ([50ba801](https://github.com/shapeshift/lib/commit/50ba80122ba35f7cc29c7e4acb368856440e5359))

# [@shapeshiftoss/chain-adapters-v1.18.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.17.0...@shapeshiftoss/chain-adapters-v1.18.0) (2021-11-17)


### Features

* add unsubscribe and close functions ([#241](https://github.com/shapeshift/lib/issues/241)) ([17ffadb](https://github.com/shapeshift/lib/commit/17ffadb35310075caeef1073b8f45483cc209912))

# [@shapeshiftoss/chain-adapters-v1.17.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.16.2...@shapeshiftoss/chain-adapters-v1.17.0) (2021-11-17)


### Features

* portis wallet not showing BTC balance ([#225](https://github.com/shapeshift/lib/issues/225)) ([624e13a](https://github.com/shapeshift/lib/commit/624e13a1fc3a4e770ef212100919baa922b365bc))

# [@shapeshiftoss/chain-adapters-v1.16.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.16.1...@shapeshiftoss/chain-adapters-v1.16.2) (2021-11-17)


### Bug Fixes

* update types used in chain adapters ([#236](https://github.com/shapeshift/lib/issues/236)) ([723f1c9](https://github.com/shapeshift/lib/commit/723f1c97112e9b439d90ea914acbf0e2ab17a01a))

# [@shapeshiftoss/chain-adapters-v1.16.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.16.0...@shapeshiftoss/chain-adapters-v1.16.1) (2021-11-17)


### Bug Fixes

* update unchained client ws ([#235](https://github.com/shapeshift/lib/issues/235)) ([b57875f](https://github.com/shapeshift/lib/commit/b57875f189a1bf15e1bdaada8d97486915bf1408))

# [@shapeshiftoss/chain-adapters-v1.16.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.15.4...@shapeshiftoss/chain-adapters-v1.16.0) (2021-11-16)


### Features

* send trade details over websocket from eth chain adapter ([#233](https://github.com/shapeshift/lib/issues/233)) ([8a4ed0a](https://github.com/shapeshift/lib/commit/8a4ed0aa3e746dee2c0e4bda7497ee515f4d55b7))

# [@shapeshiftoss/chain-adapters-v1.15.4](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.15.3...@shapeshiftoss/chain-adapters-v1.15.4) (2021-11-15)

# [@shapeshiftoss/chain-adapters-v1.15.3](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.15.2...@shapeshiftoss/chain-adapters-v1.15.3) (2021-11-12)


### Bug Fixes

* bump types ([#224](https://github.com/shapeshift/lib/issues/224)) ([fc6ca1c](https://github.com/shapeshift/lib/commit/fc6ca1c5940701131f8421ddbe35f5f8e2d851d3))

# [@shapeshiftoss/chain-adapters-v1.15.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.15.1...@shapeshiftoss/chain-adapters-v1.15.2) (2021-11-12)


### Bug Fixes

* gas fees erc20 ([#223](https://github.com/shapeshift/lib/issues/223)) ([fc0159d](https://github.com/shapeshift/lib/commit/fc0159d9600efdba34d60e6edda0b3ccd6031359))

# [@shapeshiftoss/chain-adapters-v1.15.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.15.0...@shapeshiftoss/chain-adapters-v1.15.1) (2021-11-12)


### Bug Fixes

* bump swapper package ([#220](https://github.com/shapeshift/lib/issues/220)) ([c7fa462](https://github.com/shapeshift/lib/commit/c7fa46275316d2eb3cb9030a2eb4fbc135422f4d))

# [@shapeshiftoss/chain-adapters-v1.15.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.14.0...@shapeshiftoss/chain-adapters-v1.15.0) (2021-11-12)


### Features

* create unique id for subscribe txs ([#216](https://github.com/shapeshift/lib/issues/216)) ([574a2cb](https://github.com/shapeshift/lib/commit/574a2cb79c5de6ece75bacc31591e884cd5c84ec))

# [@shapeshiftoss/chain-adapters-v1.14.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.5...@shapeshiftoss/chain-adapters-v1.14.0) (2021-11-10)


### Features

* add getSendMaxAmount to swapper ([#200](https://github.com/shapeshift/lib/issues/200)) ([1788f5f](https://github.com/shapeshift/lib/commit/1788f5f0aa94334f87452633d572eed4b4feee5d))

# [@shapeshiftoss/chain-adapters-v1.13.5](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.4...@shapeshiftoss/chain-adapters-v1.13.5) (2021-11-10)


### Bug Fixes

* pass through optional param to verify btc address on device ([#212](https://github.com/shapeshift/lib/issues/212)) ([97811ad](https://github.com/shapeshift/lib/commit/97811adeae1ee51be815f11724afe00a446cd45c))

# [@shapeshiftoss/chain-adapters-v1.13.4](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.3...@shapeshiftoss/chain-adapters-v1.13.4) (2021-11-10)

# [@shapeshiftoss/chain-adapters-v1.13.3](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.2...@shapeshiftoss/chain-adapters-v1.13.3) (2021-11-09)


### Bug Fixes

* update to use latest chain adapter and types ([#201](https://github.com/shapeshift/lib/issues/201)) ([b7ee46d](https://github.com/shapeshift/lib/commit/b7ee46d59b7a35028d46ee3d0f79b355aa8f5724))

# [@shapeshiftoss/chain-adapters-v1.13.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.1...@shapeshiftoss/chain-adapters-v1.13.2) (2021-11-09)


### Bug Fixes

* fees ([#199](https://github.com/shapeshift/lib/issues/199)) ([d83993b](https://github.com/shapeshift/lib/commit/d83993b23c7d25546b4ce0b80064041090f6a6ab))

# [@shapeshiftoss/chain-adapters-v1.13.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.13.0...@shapeshiftoss/chain-adapters-v1.13.1) (2021-11-09)


### Bug Fixes

* bump package versions ([#198](https://github.com/shapeshift/lib/issues/198)) ([da6c8f1](https://github.com/shapeshift/lib/commit/da6c8f13eb361aa520f2f1e9fc3e16a3785ed287))

# [@shapeshiftoss/chain-adapters-v1.13.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.12.1...@shapeshiftoss/chain-adapters-v1.13.0) (2021-11-08)


### Features

* add bitcoin websocket support ([#191](https://github.com/shapeshift/lib/issues/191)) ([3d1226a](https://github.com/shapeshift/lib/commit/3d1226a8a23bc724afb88d8a0ddea439b5514bc6))

# [@shapeshiftoss/chain-adapters-v1.12.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.12.0...@shapeshiftoss/chain-adapters-v1.12.1) (2021-11-06)


### Bug Fixes

* update chain adapters and types to latest ([#195](https://github.com/shapeshift/lib/issues/195)) ([13cf236](https://github.com/shapeshift/lib/commit/13cf236846c9b827b53b109156a54c45f39a5e93))

# [@shapeshiftoss/chain-adapters-v1.12.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.11.3...@shapeshiftoss/chain-adapters-v1.12.0) (2021-11-05)


### Features

* chain specific buildtx ([#193](https://github.com/shapeshift/lib/issues/193)) ([b2411fa](https://github.com/shapeshift/lib/commit/b2411fabd928cce5ab38dcd82d7d800941ef6b46))

# [@shapeshiftoss/chain-adapters-v1.11.3](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.11.2...@shapeshiftoss/chain-adapters-v1.11.3) (2021-11-05)


### Bug Fixes

* update types ([#192](https://github.com/shapeshift/lib/issues/192)) ([a5b5209](https://github.com/shapeshift/lib/commit/a5b5209f404079a5f428855927d9eba640e18240))

# [@shapeshiftoss/chain-adapters-v1.11.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.11.1...@shapeshiftoss/chain-adapters-v1.11.2) (2021-11-04)


### Bug Fixes

* fees part 1 cleanup ([#190](https://github.com/shapeshift/lib/issues/190)) ([c6fb104](https://github.com/shapeshift/lib/commit/c6fb104d282b88c80424ff7e90e25c2998b50feb))

# [@shapeshiftoss/chain-adapters-v1.11.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.11.0...@shapeshiftoss/chain-adapters-v1.11.1) (2021-11-04)

# [@shapeshiftoss/chain-adapters-v1.11.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.10.0...@shapeshiftoss/chain-adapters-v1.11.0) (2021-11-03)


### Features

* dynamic btc fees ([#186](https://github.com/shapeshift/lib/issues/186)) ([c34b4e5](https://github.com/shapeshift/lib/commit/c34b4e517bb54dd7ad8ad5fa84d188c14ddbb1e5))

# [@shapeshiftoss/chain-adapters-v1.10.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.9.0...@shapeshiftoss/chain-adapters-v1.10.0) (2021-11-02)


### Features

* enable getAddress to show on device ([#183](https://github.com/shapeshift/lib/issues/183)) ([62ba8b6](https://github.com/shapeshift/lib/commit/62ba8b682b1809e3fc8a2d1934a7ec212b4ba379))

# [@shapeshiftoss/chain-adapters-v1.9.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.8.0...@shapeshiftoss/chain-adapters-v1.9.0) (2021-11-01)


### Features

* move util functions from web ([#177](https://github.com/shapeshift/lib/issues/177)) ([58002d9](https://github.com/shapeshift/lib/commit/58002d9ca4f8948d5c2f8f28b00cbc35c58971e6))

# [@shapeshiftoss/chain-adapters-v1.8.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.7.3...@shapeshiftoss/chain-adapters-v1.8.0) (2021-10-31)


### Features

* adds support for metamask (hdwallet) ([#173](https://github.com/shapeshift/lib/issues/173)) ([bdb3f74](https://github.com/shapeshift/lib/commit/bdb3f744712ad4a865217f44bc83b44b8fa0871b))

# [@shapeshiftoss/chain-adapters-v1.7.3](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.7.2...@shapeshiftoss/chain-adapters-v1.7.3) (2021-10-27)

# [@shapeshiftoss/chain-adapters-v1.7.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.7.1...@shapeshiftoss/chain-adapters-v1.7.2) (2021-10-26)


### Bug Fixes

* allow switching between segwit, segwit native & legacy ([#164](https://github.com/shapeshift/lib/issues/164)) ([d9c1d3f](https://github.com/shapeshift/lib/commit/d9c1d3f02fdb6501f26e3b020816bd7a1115aadd))

# [@shapeshiftoss/chain-adapters-v1.7.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.7.0...@shapeshiftoss/chain-adapters-v1.7.1) (2021-10-25)

# [@shapeshiftoss/chain-adapters-v1.7.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.6.0...@shapeshiftoss/chain-adapters-v1.7.0) (2021-10-25)


### Features

* tx history data ([#149](https://github.com/shapeshift/lib/issues/149)) ([3405a0a](https://github.com/shapeshift/lib/commit/3405a0aa600363afc1778bd6f07af123591c4e11))

# [@shapeshiftoss/chain-adapters-v1.6.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.5.2...@shapeshiftoss/chain-adapters-v1.6.0) (2021-10-25)


### Features

* fix testing deps ([#101](https://github.com/shapeshift/lib/issues/101)) ([d75f48f](https://github.com/shapeshift/lib/commit/d75f48fec6947eb16eeb112d1b85f2e1840a52d3))

# [@shapeshiftoss/chain-adapters-v1.5.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.5.1...@shapeshiftoss/chain-adapters-v1.5.2) (2021-10-25)


### Bug Fixes

* unchained client update ([#155](https://github.com/shapeshift/lib/issues/155)) ([8cec392](https://github.com/shapeshift/lib/commit/8cec3926cc445c747346f60eb17ea8affc486754))

# [@shapeshiftoss/chain-adapters-v1.5.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.5.0...@shapeshiftoss/chain-adapters-v1.5.1) (2021-10-24)


### Bug Fixes

* get btc sends working by allowing optional to+value to be used instead of recipients ([#150](https://github.com/shapeshift/lib/issues/150)) ([32cc80c](https://github.com/shapeshift/lib/commit/32cc80cf16984753aa130b596682bbb59f58cf32))

# [@shapeshiftoss/chain-adapters-v1.5.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.4.0...@shapeshiftoss/chain-adapters-v1.5.0) (2021-10-22)


### Features

* add swapper cli ([#109](https://github.com/shapeshift/lib/issues/109)) ([191ad32](https://github.com/shapeshift/lib/commit/191ad325a42e676882ff2d25cae6fb773857f287))

# [@shapeshiftoss/chain-adapters-v1.4.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.3.1...@shapeshiftoss/chain-adapters-v1.4.0) (2021-10-21)


### Features

* expose bip32Params and utility function ([#147](https://github.com/shapeshift/lib/issues/147)) ([3abff85](https://github.com/shapeshift/lib/commit/3abff85ecc8f559360f1ca143ea657e418e5b557))

# [@shapeshiftoss/chain-adapters-v1.3.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.3.0...@shapeshiftoss/chain-adapters-v1.3.1) (2021-10-20)


### Bug Fixes

* get pubkey params ([#140](https://github.com/shapeshift/lib/issues/140)) ([2d48c71](https://github.com/shapeshift/lib/commit/2d48c719c8708303f24766b2a5dc1660f365692f))

# [@shapeshiftoss/chain-adapters-v1.3.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.2.2...@shapeshiftoss/chain-adapters-v1.3.0) (2021-10-20)


### Features

* implement websockets for ethereum and improve type naming consistency ([#133](https://github.com/shapeshift/lib/issues/133)) ([d0c7f82](https://github.com/shapeshift/lib/commit/d0c7f82175e3655ea3cf85f040123b68daff47a0))

# [@shapeshiftoss/chain-adapters-v1.2.2](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.2.1...@shapeshiftoss/chain-adapters-v1.2.2) (2021-10-19)


### Bug Fixes

* bitcoin chain adapter tests ([#136](https://github.com/shapeshift/lib/issues/136)) ([594ff8f](https://github.com/shapeshift/lib/commit/594ff8f9ccf554407a7e3975f79cde996d1bf48d))

# [@shapeshiftoss/chain-adapters-v1.2.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.2.0...@shapeshiftoss/chain-adapters-v1.2.1) (2021-10-19)

# [@shapeshiftoss/chain-adapters-v1.2.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.1.1...@shapeshiftoss/chain-adapters-v1.2.0) (2021-10-19)


### Bug Fixes

* generic types and type package organization ([#129](https://github.com/shapeshift/lib/issues/129)) ([3bee811](https://github.com/shapeshift/lib/commit/3bee8111d720857595efdeb8a4de06bd9850ca7a))
* various tweaks to get web back in a working ergonomic state ([#135](https://github.com/shapeshift/lib/issues/135)) ([97e507d](https://github.com/shapeshift/lib/commit/97e507d9d52831309587c8e4ef5c8a7deba4c711))


### Features

* btc chain adapters and unchained ([#124](https://github.com/shapeshift/lib/issues/124)) ([c931a72](https://github.com/shapeshift/lib/commit/c931a727405d19ebcb757c26ef8d13e086c29b20)), closes [#126](https://github.com/shapeshift/lib/issues/126)

# [@shapeshiftoss/chain-adapters-v1.1.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.1.0...@shapeshiftoss/chain-adapters-v1.1.1) (2021-10-12)


### Bug Fixes

* update types ([#115](https://github.com/shapeshift/lib/issues/115)) ([ea989ff](https://github.com/shapeshift/lib/commit/ea989ff67b86ae420b3cd4251401cd5882c791d1))

# [@shapeshiftoss/chain-adapters-v1.1.0](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.0.1...@shapeshiftoss/chain-adapters-v1.1.0) (2021-10-11)


### Features

* be more descriptive with getDefaultPair ([#111](https://github.com/shapeshift/lib/issues/111)) ([13448c2](https://github.com/shapeshift/lib/commit/13448c234c21269c0592ea8dded827dd36f20a60))

# [@shapeshiftoss/chain-adapters-v1.0.1](https://github.com/shapeshift/lib/compare/@shapeshiftoss/chain-adapters-v1.0.0...@shapeshiftoss/chain-adapters-v1.0.1) (2021-10-11)


### Bug Fixes

* update vulnerable axios version ([#102](https://github.com/shapeshift/lib/issues/102)) ([04f132d](https://github.com/shapeshift/lib/commit/04f132d75a5f3f19068857bc32e77830a7f86f6e))

# @shapeshiftoss/chain-adapters-v1.0.0 (2021-10-07)


### Bug Fixes

* fix erc20 send ([#45](https://github.com/shapeshift/lib/issues/45)) ([bc626a5](https://github.com/shapeshift/lib/commit/bc626a5602eb886d836d59659ffc8abbb9de7fee))


### Features

* add contract param to getTxHistory ([#14](https://github.com/shapeshift/lib/issues/14)) ([6cef314](https://github.com/shapeshift/lib/commit/6cef314a3be58c3cc6261749c6643657f783681f))
* update eth adapter ([#10](https://github.com/shapeshift/lib/issues/10)) ([6dcdecd](https://github.com/shapeshift/lib/commit/6dcdecd9838a8fb3e490ff0ecaa85d87e3acbd60))
