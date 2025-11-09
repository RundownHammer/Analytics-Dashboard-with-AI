'use client'

export function TopBar() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">AJ</span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Amit Jadhav</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
}
