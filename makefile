format:
	deno fmt main --config="deno.json"
lint:
	deno lint main --config="deno.json"
test: format lint
	deno test main --coverage=cov_profile
	deno coverage cov_profile
npm:
	rm -rf packages/
	deno run -A main/build.ts