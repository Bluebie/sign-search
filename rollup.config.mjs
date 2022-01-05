import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import cssOnly from 'rollup-plugin-css-only'
import { readdirSync } from 'fs'

const files = readdirSync('ui').filter(x => x.endsWith('.svelte'))

/**
 * @type {import('rollup').RollupOptions}
 */
export default files.flatMap(svelteFile => {
  const basename = svelteFile.replace(/\.svelte$/, '')
  return [
    // build client component
    {
      input: `ui/${svelteFile}`,
      output: {
        file: `ui/build/${basename}.mjs`,
        format: 'esm'
      },
      plugins: [
        svelte({
          // disable embedding css in js, feed it to cssOnly for export
          emitCss: true,
          compilerOptions: {
            hydratable: true,
            customElement: false
          }
        }),
        // resolve any references to node_modules packages, using nodejs resolution algo
        resolve({ browser: true }),
        // export .css file
        cssOnly({
          output: `${basename}.css`
        })
      ]
    },
    // build ssr component
    {
      input: `ui/${svelteFile}`,
      output: {
        file: `ui/build/ssr/${basename}.mjs`,
        format: 'esm'
      },
      plugins: [
        svelte({
          // disable embedding css in js, feed it to cssOnly for export
          emitCss: true,
          compilerOptions: {
            hydratable: true,
            generate: 'ssr'
          }
        }),
        // resolve any references to node_modules packages, using nodejs resolution algo
        // resolve({ browser: true }),
        // don't export css
        cssOnly({ output: false })
      ]
    }
  ]
})
