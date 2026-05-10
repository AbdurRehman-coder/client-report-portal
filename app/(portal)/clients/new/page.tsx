import Link from 'next/link'
import ClientForm from '@/components/forms/ClientForm'

export default function NewClientPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors"
          style={{ borderColor: '#E8E3D8', color: '#6B6560', backgroundColor: 'white' }}
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>Add New Client</h1>
          <p className="text-sm" style={{ color: '#6B6560' }}>Create a new household file</p>
        </div>
      </div>

      <ClientForm />
    </div>
  )
}
