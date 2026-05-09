import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AdminActions from './AdminActions'

export const metadata = {
  title: 'Admin Panel | founder ideas.',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // Fetch reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
  }

  // Fetch hidden ideas
  const { data: hiddenIdeas } = await supabase
    .from('ideas')
    .select('id, title, description, author_id, created_at, image_url')
    .eq('is_hidden', true)

  // Fetch hidden problems
  const { data: hiddenProblems } = await supabase
    .from('problems')
    .select('id, title, description, author_id, created_at')
    .eq('is_hidden', true)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Admin Panel</h1>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Hidden Items</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Hidden Ideas</h3>
            {hiddenIdeas?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No hidden ideas.</p>
            ) : (
              <ul className="space-y-4">
                {hiddenIdeas?.map(idea => (
                  <li key={idea.id} className="p-4 border rounded-md shadow-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                    {idea.image_url && (
                      <div className="mb-4 relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={idea.image_url}
                          alt="Hidden Idea Image"
                          fill
                          className="object-contain"
                          unoptimized
                          priority
                        />
                      </div>
                    )}
                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>{idea.title}</h4>
                    <p className="text-sm mt-1 mb-3" style={{ color: 'var(--muted)' }}>{idea.description}</p>
                    <AdminActions targetId={idea.id} targetType="idea" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Hidden Problems</h3>
            {hiddenProblems?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No hidden problems.</p>
            ) : (
              <ul className="space-y-4">
                {hiddenProblems?.map(problem => (
                  <li key={problem.id} className="p-4 border rounded-md shadow-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>{problem.title}</h4>
                    <p className="text-sm mt-1 mb-3" style={{ color: 'var(--muted)' }}>{problem.description}</p>
                    <AdminActions targetId={problem.id} targetType="problem" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Recent Reports</h2>
        {reports?.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No recent reports.</p>
        ) : (
          <div className="overflow-x-auto border rounded-md" style={{ borderColor: 'var(--border)' }}>
            <table className="min-w-full text-sm text-left">
              <thead className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                <tr>
                  <th className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>Target ID</th>
                  <th className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>Type</th>
                  <th className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>Reason</th>
                  <th className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>Reporter</th>
                  <th className="px-4 py-2 font-medium" style={{ color: 'var(--foreground)' }}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {reports?.map(report => (
                  <tr key={report.id} className="hover:bg-opacity-50" style={{ backgroundColor: 'var(--background)' }}>
                    <td className="px-4 py-2 truncate max-w-[150px]" style={{ color: 'var(--foreground)' }} title={report.target_id}>{report.target_id}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{report.target_type}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{report.reason}</td>
                    <td className="px-4 py-2 truncate max-w-[150px]" style={{ color: 'var(--muted)' }} title={report.reporter_id}>{report.reporter_id || 'Unknown'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
