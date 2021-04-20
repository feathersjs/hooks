# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.6.5](https://github.com/feathersjs/hooks/compare/v0.6.4...v0.6.5) (2021-04-20)


### Bug Fixes

* **typescript:** Tighten up TypeScript settings to be ECMAScript and Deno compatible ([#81](https://github.com/feathersjs/hooks/issues/81)) ([28fe875](https://github.com/feathersjs/hooks/commit/28fe8758b4764981473830db4a0013dd1beca489))





## [0.6.4](https://github.com/feathersjs/hooks/compare/v0.6.3...v0.6.4) (2021-04-11)


### Bug Fixes

* allow to hooks a function without middleware ([#77](https://github.com/feathersjs/hooks/issues/77)) ([38b44c3](https://github.com/feathersjs/hooks/commit/38b44c3ba1bd7753cdb81492b517e4fd3a6af50e))
* conserve fn.length and fn.name ([#79](https://github.com/feathersjs/hooks/issues/79)) ([d9bc9af](https://github.com/feathersjs/hooks/commit/d9bc9af689f15398168ce4493fcfb23af0f3ef05))





## [0.6.3](https://github.com/feathersjs/hooks/compare/v0.6.2...v0.6.3) (2021-03-31)


### Bug Fixes

* **hooks:** Add Deno tests and build, CI and fix build ([#73](https://github.com/feathersjs/hooks/issues/73)) ([44787cd](https://github.com/feathersjs/hooks/commit/44787cd2106c6d1ff4fe8bc5d59362e14427c468))





## [0.6.2](https://github.com/feathersjs/hooks/compare/v0.6.1...v0.6.2) (2021-02-08)


### Bug Fixes

* **hooks:** Allow to set context.result to undefined ([#70](https://github.com/feathersjs/hooks/issues/70)) ([7b5807f](https://github.com/feathersjs/hooks/commit/7b5807f8a31b0e4859eaabdbcc8b49fc3b544548))





## [0.6.1](https://github.com/feathersjs/hooks/compare/v0.6.0...v0.6.1) (2020-12-11)


### Bug Fixes

* **hooks:** fix some errors for feathers integration ([#67](https://github.com/feathersjs/hooks/issues/67)) ([fcfc0ca](https://github.com/feathersjs/hooks/commit/fcfc0ca6423a8062959d41f34e673f81d3c006dd))
* **hooks:** Remove redundant method call ([#65](https://github.com/feathersjs/hooks/issues/65)) ([4ff10a9](https://github.com/feathersjs/hooks/commit/4ff10a9935682276b8ca3ffb699275b627230dfa))
* **hooks:** Stricter condition ([#64](https://github.com/feathersjs/hooks/issues/64)) ([6de77a1](https://github.com/feathersjs/hooks/commit/6de77a1afcbee4867b7e464be0b556a8dc9656e3))





# [0.6.0](https://github.com/feathersjs/hooks/compare/v0.5.0...v0.6.0) (2020-11-12)


### Features

* **hooks:** Revert refactoring into separate hooks (PR [#37](https://github.com/feathersjs/hooks/issues/37)) ([#57](https://github.com/feathersjs/hooks/issues/57)) ([56a44be](https://github.com/feathersjs/hooks/commit/56a44beb3388873f7bef12ac640f115beffceb95))





# [0.5.0](https://github.com/feathersjs/hooks/compare/v0.5.0-alpha.0...v0.5.0) (2020-06-01)


### Features

* **hooks:** Finalize default initializer functionality ([#35](https://github.com/feathersjs/hooks/issues/35)) ([d380d76](https://github.com/feathersjs/hooks/commit/d380d76891b28160c992438bfb3f28493eacddc4))
* **hooks:** Refactor .params, .props and .defaults into hooks ([#37](https://github.com/feathersjs/hooks/issues/37)) ([9b13b7d](https://github.com/feathersjs/hooks/commit/9b13b7de6b708a2152927335aae25dd320b4cfeb))
* **typescript:** Improve type indexes for stricter object and class hooks ([699f2fd](https://github.com/feathersjs/hooks/commit/699f2fd973eb72c0d7c3aefff7b230a7a8a2918a))





# [0.5.0-alpha.0](https://github.com/feathersjs/hooks/compare/v0.4.0-alpha.0...v0.5.0-alpha.0) (2020-04-05)

**Note:** Version bump only for package @feathersjs/hooks





# [0.4.0-alpha.0](https://github.com/feathersjs/hooks/compare/v0.3.1...v0.4.0-alpha.0) (2020-02-19)


### Bug Fixes

* conserve props from original method ([#19](https://github.com/feathersjs/hooks/issues/19)) ([9a77e81](https://github.com/feathersjs/hooks/commit/9a77e81a8b0912a8d3275a2d18e19616d4e4d37e))
* remove walkOriginal ([df1f7ff](https://github.com/feathersjs/hooks/commit/df1f7ffa73ea087d487582efa3c8c7f5be992ab9))
* Update withParams ([#16](https://github.com/feathersjs/hooks/issues/16)) ([b89d044](https://github.com/feathersjs/hooks/commit/b89d0443680d1a30f0875d1b817ddf9ad6220ffe))
* use collector of each .original ([#17](https://github.com/feathersjs/hooks/issues/17)) ([33fd2cb](https://github.com/feathersjs/hooks/commit/33fd2cb3a66301e76be6e83c5a7d6248434c7fd0))


### Features

* add setMiddleware ([#18](https://github.com/feathersjs/hooks/issues/18)) ([7d0113d](https://github.com/feathersjs/hooks/commit/7d0113d4e6c972983e6384ff892cb5ca8c70365c))
* Chainable configuration ([#23](https://github.com/feathersjs/hooks/issues/23)) ([c534827](https://github.com/feathersjs/hooks/commit/c534827d539faab885f84d035e2edb912770759f))





## [0.3.1](https://github.com/feathersjs/hooks/compare/v0.3.0...v0.3.1) (2020-01-29)


### Bug Fixes

* Fix dependency entries ([4a15e74](https://github.com/feathersjs/hooks/commit/4a15e74f83247833edf7de8ea26b908115a5ab7a))





# [0.3.0](https://github.com/feathersjs/hooks/compare/v0.2.0...v0.3.0) (2020-01-29)


### Features

* Allow multiple context initializers ([#12](https://github.com/feathersjs/hooks/issues/12)) ([a556272](https://github.com/feathersjs/hooks/commit/a556272f535c7d2a25bcbc12d8473cdaefaf8c56))





# [0.2.0](https://github.com/feathersjs/hooks/compare/v0.1.0...v0.2.0) (2020-01-14)


### Bug Fixes

* Add tests for fn.original and update documentation ([#5](https://github.com/feathersjs/hooks/issues/5)) ([f4c1955](https://github.com/feathersjs/hooks/commit/f4c195512c2f24d4d9abb68d39275f2287574162))


### Features

* Add browser build ([#8](https://github.com/feathersjs/hooks/issues/8)) ([d6162ca](https://github.com/feathersjs/hooks/commit/d6162caccabe43c468df9360f7f03362ad36c41d))
* Add build script and publish a version for Deno ([#6](https://github.com/feathersjs/hooks/issues/6)) ([f2b5697](https://github.com/feathersjs/hooks/commit/f2b56972fa2ef21799bc6e531644ef9e751bd25b))
* Refactoring to pass an option object to initialize hooks more explicitly ([#7](https://github.com/feathersjs/hooks/issues/7)) ([8f2453f](https://github.com/feathersjs/hooks/commit/8f2453f3e230f6c17989f244cc3dc8126a895eeb))





# 0.1.0 (2020-01-05)


### Features

* Finalize functionality for initial release of @feathersjs/hooks package ([#1](https://github.com/feathersjs/feathers/issues/1)) ([edab7a1](https://github.com/feathersjs/feathers/commit/edab7a1d24b2f25f59af01aad1275ea74dee3879))
