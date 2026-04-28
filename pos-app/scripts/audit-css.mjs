import fs from 'node:fs'
import path from 'node:path'

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, exts, out)
    else if (exts.some((e) => p.endsWith(e))) out.push(p)
  }
  return out
}

const tsFiles = walk('src', ['.tsx', '.ts'])
const cssFiles = walk('src/styles', ['.css'])

const ts = tsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n')

// Extract static tokens from common className patterns.
// Note: We intentionally keep this conservative (only known string segments).
const used = new Set()

function addTokens(str) {
  str
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((c) => used.add(c))
}

let m

// className='a b'
const re1 = /className\s*=\s*['"`]([^'"`]+)['"`]/g
while ((m = re1.exec(ts))) addTokens(m[1])

// className={'a b'}
const re2 = /className\s*=\s*\{\s*['"`]([^'"`]+)['"`]\s*\}/g
while ((m = re2.exec(ts))) addTokens(m[1])

// className={`a b`}
const re3 = /className\s*=\s*\{\s*`([^`]+)`\s*\}/g
while ((m = re3.exec(ts))) addTokens(m[1])

// className={`prefix ${cond ? 'x' : ''} suffix`}
// We only take prefix/suffix static parts.
const re4 = /className\s*=\s*\{\s*`([^`]*)\$\{[^}]*\}([^`]*)`\s*\}/g
while ((m = re4.exec(ts))) addTokens(`${m[1]} ${m[2]}`)

function extractCssClasses(css) {
  const out = new Set()
  const re = /\.([a-zA-Z_][\w-]*)\b/g
  let m
  while ((m = re.exec(css))) out.add(m[1])
  return out
}

const unusedByFile = {}
for (const f of cssFiles) {
  const css = fs.readFileSync(f, 'utf8')
  const classes = [...extractCssClasses(css)]
  const unused = classes.filter((c) => !used.has(c))
  if (unused.length) unusedByFile[f] = unused.sort()
}

console.log(
  JSON.stringify(
    {
      usedCount: used.size,
      tsFiles: tsFiles.length,
      cssFiles: cssFiles.length,
      unusedByFile,
    },
    null,
    2,
  ),
)
