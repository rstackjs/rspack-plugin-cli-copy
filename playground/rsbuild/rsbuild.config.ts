import { defineConfig } from '@rsbuild/core'
import { rsbuildCliCopyPlugin } from 'rspack-plugin-cli-copy'

export default defineConfig({
  plugins: [rsbuildCliCopyPlugin()]
})
