format:
	deno fmt main --config="deno.json"

lint:
	deno lint main --config="deno.json"

test: format lint
	deno test main/

coverage: format lint
	deno test main/ --coverage=coverage
	deno coverage coverage

npm:
	rm -rf packages/
	deno run -A main/build.ts
	npx lerna bootstrap

publish: npm
	npx lerna publish
