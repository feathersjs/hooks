test:
	deno test main/*/test/**.test.ts
npm:
	rm -rf packages/
	deno run -A main/build.ts