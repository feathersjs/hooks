// ex. scripts/build_npm.ts
import { build } from 'https://deno.land/x/dnt/mod.ts';

await build({
  entryPoints: ['./src/index.ts'],
  outDir: './npm',
  test: false,
  package: {
    // package.json properties
    name: 'your-package',
    version: Deno.args[0],
    description: 'Your package.',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/username/package.git',
    },
    bugs: {
      url: 'https://github.com/username/package/issues',
    }
  }
});

// post build steps
Deno.copyFileSync('LICENSE', 'npm/LICENSE');
Deno.copyFileSync('CHANGELOG.md', 'npm/CHANGELOG.md');
Deno.copyFileSync('README.md', 'npm/README.md');
