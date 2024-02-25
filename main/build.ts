import * as path from 'https://deno.land/std@0.115.1/path/mod.ts';
import { build } from 'https://deno.land/x/dnt@0.40.0/mod.ts';
import hooksPackage from './hooks/package.json.ts';

const __dirname = new URL('.', import.meta.url).pathname;

const buildModule = async (name: string) => {
  const inDir = path.join(__dirname, name);
  const outDir = path.join(__dirname, '..', `packages/${name}`);
  const filesToCopy = ['LICENSE', 'README.md'];

  await build({
    entryPoints: [path.join(inDir, 'src/index.ts')],
    outDir,
    test: false,
    shims: {},
    compilerOptions: {
      importHelpers: false
    },
    package: hooksPackage
  });

  filesToCopy.forEach((filename) =>
    Deno.copyFileSync(path.join(inDir, filename), path.join(outDir, filename))
  );
};

await buildModule('hooks');
