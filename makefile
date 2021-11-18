lint:
	deno lint main --rules-exclude="no-explicit-any,require-await,no-unused-vars,no-self-assign" --rules-tags="recommended"
test:
	deno test main/*/test/**.test.ts --coverage=cov_profile
	deno coverage cov_profile
npm:
	rm -rf packages/
	deno run -A main/build.ts