import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PartyForm from '@/components/PartyForm'

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: party, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !party) {
    redirect('/parties')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parties" className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cariyi Düzenle</h1>
          <p className="text-sm text-slate-500 mt-0.5">{party.name}</p>
        </div>
      </div>

      <PartyForm initialData={party} partyId={party.id} />
    </div>
  )
}
