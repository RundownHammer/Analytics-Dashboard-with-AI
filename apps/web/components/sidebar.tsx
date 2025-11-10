'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Layers, Users, Settings, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoice', href: '/invoice', icon: FileText },
  { name: 'Other files', href: '/files', icon: Layers },
  { name: 'Departments', href: '/departments', icon: Layers },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Simple Brand */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="text-lg font-bold text-gray-900">Flowbit</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          General
        </div>
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isDisabled = !['/dashboard', '/chat'].includes(item.href)
            return (
              <Link
                key={item.name}
                href={isDisabled ? '#' : item.href}
                onClick={(e) => { if (isDisabled) e.preventDefault() }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Chat with Data - Bottom Section */}
      <div className="p-3 border-t border-gray-200">
        <Link
          href="/chat"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
            pathname === '/chat'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <MessageSquare className="h-5 w-5" />
          Chat with Data
        </Link>
      </div>

      {/* Footer Spacer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        © {new Date().getFullYear()} Flowbit
      </div>
    </div>
  )
}
