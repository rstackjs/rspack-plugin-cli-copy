import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // @rspack/core 与 @rsbuild/core 是宿主提供的类型，
  // 仅在源码中作为 type-only import 使用；它们的 .d.ts 是 CJS 语法，
  // rolldown-plugin-dts 无法 bundle，必须显式 external
  deps: {
    neverBundle: ['@rspack/core', '@rsbuild/core']
  },
  target: 'node10',
  shims: true
})
