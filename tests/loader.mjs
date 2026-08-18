/**
 * Minimal ESM resolver hook so `node --test` can run the TypeScript sources
 * directly. Node >= 22 strips types natively, but its resolver still requires
 * explicit file extensions, which the Next.js/TS sources do not use. It also
 * teaches Node about the `@/` path alias from tsconfig.json.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const SUFFIXES = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const isAlias = specifier.startsWith("@/");

  if (isRelative || isAlias) {
    const base = isAlias
      ? resolvePath(projectRoot, specifier.slice(2))
      : resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);

    for (const suffix of SUFFIXES) {
      const candidate = base + suffix;
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    if (existsSync(base)) {
      return { url: pathToFileURL(base).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
