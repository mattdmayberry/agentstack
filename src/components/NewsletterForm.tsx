import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'

type NewsletterFormProps = {
  compact?: boolean
  buttonLabel?: string
}

export function NewsletterForm({ compact = false, buttonLabel }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('idle')

    if (!supabase) {
      setStatus('success')
      setEmail('')
      return
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase() })

    if (error) {
      setStatus('error')
      return
    }

    setStatus('success')
    setEmail('')
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        required
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.com"
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-500/60 placeholder:text-zinc-500 focus:ring"
      />
      <button
        className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        type="submit"
      >
        {buttonLabel ?? (compact ? 'Subscribe' : 'Join newsletter')}
      </button>
      {status === 'success' && (
        <span className="text-xs text-emerald-400">
          You are on the list.
        </span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-400">Subscription failed.</span>
      )}
    </form>
  )
}
