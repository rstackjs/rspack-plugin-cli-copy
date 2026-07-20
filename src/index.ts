import { type NetworkInterfaceInfo, networkInterfaces } from 'node:os'
import type { RspackPluginInstance, Compiler } from '@rspack/core'
import type { RsbuildPlugin } from '@rsbuild/core'

export class rspackCliCopyPlugin implements RspackPluginInstance {
  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tap('NetworkCopyPlugin', () => {
      if (compiler.options.mode !== 'development') return
      if (compiler.modifiedFiles?.size) return
      const devServer = compiler.options.devServer
      if (devServer === false) return
      const port = devServer?.port
      if (!port) return
      const localIPv4 = getIpv4Interfaces()[0]
      if (!localIPv4) return
      void print(`http://${localIPv4}:${port}`)
    })
  }
}

export const rsbuildCliCopyPlugin = (): RsbuildPlugin => ({
  name: 'rsbuildCliCopyPlugin',
  setup(api) {
    api.onAfterStartDevServer(server => {
      const localIPv4 = getIpv4Interfaces()[0]
      if (!localIPv4) return
      void print(`http://${localIPv4}:${server.port}`)
    })
  }
})

export async function copyNetworkUrl(url: string): Promise<boolean> {
  try {
    const { Clipboard } = await import('@napi-rs/clipboard')
    new Clipboard().setText(url)
    return true
  } catch (error) {
    console.error(`\n  ${red('Failed to copy to clipboard Network URL:')} ${JSON.stringify(error)} \n`)
    return false
  }
}

async function print(url: string) {
  const ok = await copyNetworkUrl(url)
  console.log(`\n  ${cyan(ok ? 'Copied to clipboard Network URL:' : 'Network URL:')} ${url} \n`)
}

export function getIpv4Interfaces(): string[] {
  const interfaces = networkInterfaces()
  const ipv4Interfaces: Map<string, NetworkInterfaceInfo> = new Map()
  for (const key of Object.keys(interfaces)) {
    const list = interfaces[key]
    if (!list) continue
    for (const detail of list) {
      if (detail.internal) continue
      const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4
      if (detail.family === familyV4Value && !ipv4Interfaces.has(detail.address)) {
        ipv4Interfaces.set(detail.address, detail)
      }
    }
  }
  return Array.from(ipv4Interfaces.keys())
}

function cyan(str: string) {
  return `\x1b[36m${str}\x1b[0m`
}

function red(str: string) {
  return `\x1b[31m${str}\x1b[0m`
}
