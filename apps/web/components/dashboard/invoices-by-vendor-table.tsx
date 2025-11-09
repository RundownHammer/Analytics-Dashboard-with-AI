'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Invoice = {
  id: string
  invoiceNumber: string
  issueDate: string
  totalAmount: string
  vendor: {
    name: string
  }
}

type SortField = 'vendor' | 'issueDate' | 'totalAmount'
type SortDirection = 'asc' | 'desc'

export function InvoicesByVendorTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('issueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetch('/api/invoices?pageSize=50')
      .then(async res => {
        if (!res.ok) return []
        try { return await res.json() } catch { return [] }
      })
      .then((result: any) => {
        const data = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : [])
        setInvoices(data)
        setFilteredInvoices(data)
      })
      .catch(() => {
        setInvoices([])
        setFilteredInvoices([])
      })
  }, [])

  // Filter invoices based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredInvoices(invoices)
      return
    }

    const filtered = invoices.filter((invoice) =>
      invoice.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredInvoices(filtered)
  }, [searchTerm, invoices])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: any, bValue: any

    if (sortField === 'vendor') {
      aValue = a.vendor?.name || ''
      bValue = b.vendor?.name || ''
    } else if (sortField === 'issueDate') {
      aValue = new Date(a.issueDate).getTime()
      bValue = new Date(b.issueDate).getTime()
    } else if (sortField === 'totalAmount') {
      aValue = parseFloat(a.totalAmount)
      bValue = parseFloat(b.totalAmount)
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-900">Invoices by Vendor</CardTitle>
        <Input
          type="text"
          placeholder="Search by vendor or invoice number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-3"
        />
      </CardHeader>
      <CardContent className="overflow-hidden px-2 pb-4">
        <div className="overflow-auto h-[265px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b">
              <tr>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-gray-50 text-xs font-medium"
                  onClick={() => handleSort('vendor')}
                >
                  Vendor {getSortIcon('vendor')}
                </th>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-gray-50 text-xs font-medium"
                  onClick={() => handleSort('issueDate')}
                >
                  Invoice Date {getSortIcon('issueDate')}
                </th>
                <th
                  className="text-right p-2 cursor-pointer hover:bg-gray-50 text-xs font-medium"
                  onClick={() => handleSort('totalAmount')}
                >
                  Net Value {getSortIcon('totalAmount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 text-xs py-8">
                    {searchTerm ? 'No matching invoices found' : 'No invoices found'}
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-xs font-medium text-gray-900">
                      {invoice.vendor?.name || 'Unknown Vendor'}
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-2 text-xs text-right font-semibold text-gray-900">
                      €{parseFloat(invoice.totalAmount).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
