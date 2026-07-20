import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core'
import { getIpv4Interfaces, rspackCliCopyPlugin, rsbuildCliCopyPlugin } from './index.js'

describe('getIpv4Interfaces', () => {
  it('返回字符串数组，且只包含非内网 IPv4 地址', () => {
    const result = getIpv4Interfaces()
    expect(Array.isArray(result)).toBe(true)
    for (const addr of result) {
      expect(typeof addr).toBe('string')
      expect(addr).not.toMatch(/^127\./)
    }
  })
})

describe('copyNetworkUrl', () => {
  let consoleErrorSpy: ReturnType<typeof rs.spyOn>

  beforeEach(() => {
    consoleErrorSpy = rs.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    rs.resetModules()
    rs.restoreAllMocks()
  })

  it('成功复制时返回 true 且 setText 被调用', async () => {
    const setText = rs.fn()
    rs.doMock('@napi-rs/clipboard', () => ({
      Clipboard: class {
        setText = setText
      }
    }))
    const { copyNetworkUrl } = await import('./index.js')
    const ok = await copyNetworkUrl('http://127.0.0.1:8080')
    expect(ok).toBe(true)
    expect(setText).toHaveBeenCalledWith('http://127.0.0.1:8080')
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('native binding 加载失败时返回 false 且打印错误', async () => {
    rs.doMock('@napi-rs/clipboard', () => {
      throw new Error('Cannot find native binding')
    })
    const { copyNetworkUrl } = await import('./index.js')
    const ok = await copyNetworkUrl('http://127.0.0.1:8080')
    expect(ok).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('setText 抛错时返回 false 且打印错误', async () => {
    rs.doMock('@napi-rs/clipboard', () => ({
      Clipboard: class {
        setText() {
          throw new Error('clipboard access denied')
        }
      }
    }))
    const { copyNetworkUrl } = await import('./index.js')
    const ok = await copyNetworkUrl('http://127.0.0.1:8080')
    expect(ok).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('rspackCliCopyPlugin', () => {
  it('注册 afterCompile hook', () => {
    const tap = rs.fn()
    const compiler = {
      hooks: { afterCompile: { tap } },
      options: { mode: 'development' },
      modifiedFiles: null
    }
    new rspackCliCopyPlugin().apply(compiler as any)
    expect(tap).toHaveBeenCalledWith('NetworkCopyPlugin', expect.any(Function))
  })

  it('生产模式下 hook 回调直接返回，不触发复制', () => {
    let invoked: (() => void) | null = null
    const compiler = {
      hooks: { afterCompile: { tap: (_n: string, cb: () => void) => (invoked = cb) } },
      options: { mode: 'production', devServer: { port: 8080 } },
      modifiedFiles: null
    }
    new rspackCliCopyPlugin().apply(compiler as any)
    expect(invoked).toBeTruthy()
    expect(() => invoked!()).not.toThrow()
  })

  it('devServer 为 false 时 hook 回调直接返回', () => {
    let invoked: (() => void) | null = null
    const compiler = {
      hooks: { afterCompile: { tap: (_n: string, cb: () => void) => (invoked = cb) } },
      options: { mode: 'development', devServer: false },
      modifiedFiles: null
    }
    new rspackCliCopyPlugin().apply(compiler as any)
    expect(() => invoked!()).not.toThrow()
  })
})

describe('rsbuildCliCopyPlugin', () => {
  it('返回插件对象，含 name 和 setup', () => {
    const plugin = rsbuildCliCopyPlugin()
    expect(plugin.name).toBe('rsbuildCliCopyPlugin')
    expect(typeof plugin.setup).toBe('function')
  })

  it('setup 注册 onAfterStartDevServer 回调', () => {
    const onAfterStartDevServer = rs.fn()
    const api = { onAfterStartDevServer }
    rsbuildCliCopyPlugin().setup(api as any)
    expect(onAfterStartDevServer).toHaveBeenCalledWith(expect.any(Function))
  })
})
