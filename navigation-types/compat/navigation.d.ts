import type { ReadonlyURLSearchParams } from 'next/navigation'

declare module 'next/navigation' {
  /**
   * Get a read-only URLSearchParams object. For example searchParams.get('foo') would return 'bar' when ?foo=bar
   * Learn more about URLSearchParams here: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
   *
   * If used from `pages/`, the hook may return `null` when the router is not
   * ready.
   */
  export function useSearchParams(): ReadonlyURLSearchParams | null

  /**
   * Get the current pathname. For example, if the URL is
   * https://example.com/foo?bar=baz, the pathname would be /foo.
   *
   * If the hook is accessed from `pages/`, the pathname may be `null` when the
   * router is not ready.
   */
  export function usePathname(): string | null

  // Re-export the types for next/navigation.
  export * from 'next/dist/client/components/navigation'
}
