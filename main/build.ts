import * as path from 'https://deno.land/std/path/mod.ts';
import { build } from 'https://deno.land/x/dnt/mod.ts';
import hooksPackage from './hooks/package.json.ts';

const __dirname = new URL('.', import.meta.url).pathname;

const buildModule = async (name: string) => {
  const inDir = path.join(__dirname, name);
  const outDir = path.join(__dirname, '..', `packages/${name}`);

  await build({
    entryPoints: [ path.join(inDir, 'src/index.ts') ],
    outDir,
    test: false,
    package: hooksPackage
  });

  Deno.copyFileSync(path.join(inDir, 'LICENSE'), 'npm/LICENSE');
  Deno.copyFileSync(path.join(inDir, 'README.md'), 'npm/README.md');
}

await buildModule('hooks');
