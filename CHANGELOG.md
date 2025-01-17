## [4.3.1](https://github.com/seleb/bipsi-hacks/compare/v4.3.0...v4.3.1) (2023-07-17)


### Bug Fixes

* **sounds:** if "touch-sound" is text & doesn't match library audio, fail silently ([#12](https://github.com/seleb/bipsi-hacks/issues/12)) ([b928440](https://github.com/seleb/bipsi-hacks/commit/b9284401d48da975890c91e2ec4b57133b7c6a27))

# [4.3.0](https://github.com/seleb/bipsi-hacks/compare/v4.2.1...v4.3.0) (2023-07-14)


### Features

* **sounds:** `touch-sound` field can now be text ([#11](https://github.com/seleb/bipsi-hacks/issues/11)) ([8399258](https://github.com/seleb/bipsi-hacks/commit/8399258cd09eb888cef2bd5ca92184efb6aba0c2))

## [4.2.1](https://github.com/seleb/bipsi-hacks/compare/v4.2.0...v4.2.1) (2023-07-11)


### Bug Fixes

* **sounds:** play immediately on touch, avoid restarting loops, better invalid volume checks ([14cd556](https://github.com/seleb/bipsi-hacks/commit/14cd556d6ac53ae8bcb129b1e69496ee86dc92f1)), closes [#10](https://github.com/seleb/bipsi-hacks/issues/10)

# [4.2.0](https://github.com/seleb/bipsi-hacks/compare/v4.1.0...v4.2.0) (2023-07-11)


### Features

* add `sounds` and `sound dialogue` hacks ([#8](https://github.com/seleb/bipsi-hacks/issues/8)) ([f1ce312](https://github.com/seleb/bipsi-hacks/commit/f1ce3120258dd07a01b5c7e4fc9561cac6fc2d24)), closes [#5](https://github.com/seleb/bipsi-hacks/issues/5)

# [4.1.0](https://github.com/seleb/bipsi-hacks/compare/v4.0.0...v4.1.0) (2023-07-11)


### Features

* **dialogue portraits:** expose current event, support changing within a single page ([#7](https://github.com/seleb/bipsi-hacks/issues/7)) ([35536a5](https://github.com/seleb/bipsi-hacks/commit/35536a567f25b616ffafde0cfcd7bfe1bdbbba59))

# [4.0.0](https://github.com/seleb/bipsi-hacks/compare/v3.0.2...v4.0.0) (2023-07-11)


### Bug Fixes

* adjusted plugin file naming ([#6](https://github.com/seleb/bipsi-hacks/issues/6)) ([d2948b1](https://github.com/seleb/bipsi-hacks/commit/d2948b1ccce19e846f6d52cdd41385ab9bfeb862)), closes [#5](https://github.com/seleb/bipsi-hacks/issues/5)


### BREAKING CHANGES

* `dialogue-portraits` renamed to `dialogue portraits`
* `mirrored-event-graphics` renamed to `mirrored event
graphics`

Co-authored-by: Jonathan Heard <jon.heard.tutor@gmail.com>

## [3.0.2](https://github.com/seleb/bipsi-hacks/compare/v3.0.1...v3.0.2) (2023-07-08)


### Bug Fixes

* remove redundant versions ([c39e7e4](https://github.com/seleb/bipsi-hacks/commit/c39e7e4d7da51a381eaad7105f90c705dc44ca7c))

## [3.0.1](https://github.com/seleb/bipsi-hacks/compare/v3.0.0...v3.0.1) (2023-07-08)


### Bug Fixes

* `dist` not being cleaned before build ([f078395](https://github.com/seleb/bipsi-hacks/commit/f078395bc96422dc721745bcde778fb77bf28168))
* remove unused `index` ([e7728e2](https://github.com/seleb/bipsi-hacks/commit/e7728e2c5c27b70d1bca946f20919285c42dca8f))

# [3.0.0](https://github.com/seleb/bipsi-hacks/compare/v2.2.1...v3.0.0) (2023-07-08)


### Features

* support file-based portraits ([71b1acf](https://github.com/seleb/bipsi-hacks/commit/71b1acf8518fb323c6c33c7ba7942eddab74303d))


### BREAKING CHANGES

* `speech-portraits-from-tiles` hack renamed to `dialogue-portraits`, and now supports files

## [2.2.1](https://github.com/seleb/bipsi-hacks/compare/v2.2.0...v2.2.1) (2023-07-07)


### Bug Fixes

* minor issues with "mirrored events" and "speech portraits" hacks ([7e2e5e4](https://github.com/seleb/bipsi-hacks/commit/7e2e5e48fa2821d56a6d142a60fccc1da529dac8))

# [2.2.0](https://github.com/seleb/bipsi-hacks/compare/v2.1.0...v2.2.0) (2023-07-06)


### Features

* add "mirrored events" and "speech portraits" hacks ([7f8f647](https://github.com/seleb/bipsi-hacks/commit/7f8f6479b0e797d55625b584b34b9e7ff044d4fe))

# [2.1.0](https://github.com/seleb/bipsi-hacks/compare/v2.0.0...v2.1.0) (2023-07-01)


### Features

* add tall character plugin ([1b02309](https://github.com/seleb/bipsi-hacks/commit/1b023098ff9006dad05fae2d504e7bf025b3b6a3)), closes [#1](https://github.com/seleb/bipsi-hacks/issues/1)

# [2.0.0](https://github.com/seleb/bipsi-hacks/compare/v1.0.1...v2.0.0) (2022-02-06)


### Bug Fixes

* use modern js ([0e20d53](https://github.com/seleb/bipsi-hacks/commit/0e20d5384615f90ec2f2ffe57b00cba19116025b))


### Features

* use bipsi plugin options ([24022f1](https://github.com/seleb/bipsi-hacks/commit/24022f186342e3f51ac81712c23e97c2969e85ec))


### BREAKING CHANGES

* uses bipsi's `//!CONFIG` syntax to provide options + defaults instead of expecting you to modify the hack's main javascript field

Co-Authored-By: mark wonnacott <527158+ragzouken@users.noreply.github.com>

## [1.0.1](https://github.com/seleb/bipsi-hacks/compare/v1.0.0...v1.0.1) (2022-02-03)


### Bug Fixes

* replace empty fragment shader with `undefined` to avoid runtime error ([54de6de](https://github.com/seleb/bipsi-hacks/commit/54de6ded936a9223d17a243e114fd4cf8ea9674d))

# 1.0.0 (2022-02-03)


### Features

* initial build ([f39a657](https://github.com/seleb/bipsi-hacks/commit/f39a657b55078b70403a88d4bc384d8690a63d33))
