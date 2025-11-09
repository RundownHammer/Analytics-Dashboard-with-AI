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
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Buchhaltung</div>
            <div className="text-xs text-gray-500">by flowbite</div>
          </div>
        </div>
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
            return (
              <Link
                key={item.name}
                href={item.href}
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

      {/* Branding */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
          <span className="text-lg font-bold text-gray-900">Flowbit AI</span>
        </div>
      </div>
    </div>
  )
}
