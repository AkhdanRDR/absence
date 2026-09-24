import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  return createBrowserClient(supabaseUrl, supabaseKey)
}

// ponytail: lazy proxy singleton -> direct instance when build-time env guaranteed
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = createClient()
    const val = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
