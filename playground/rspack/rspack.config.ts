import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import { rspackCliCopyPlugin } from 'rspack-plugin-cli-copy'

export default defineConfig({
  context: __dirname,
  entry: { main: './src/main.ts' },
  resolve: { extensions: ['...', '.ts'] },
  plugins: [new rspack.HtmlRspackPlugin({ template: './index.html' }), new rspackCliCopyPlugin()]
})
