'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Invoice {
  id: string
  invoiceNumber: string
  vendor: { name: string }
  issueDate: string
  totalAmount: number
  status: string
}

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const query = search ? `?q=${encodeURIComponent(search)}` : ''
    fetch(`/api/invoices${query}`)
      .then(res => res.json())
      .then(setInvoices)
      .catch(console.error)
  }, [search])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Invoices by Vendor</CardTitle>
        <CardDescription className="text-xs">Top vendors by invoice count.</CardDescription>
        <Input
          type="text"
          placeholder="Search..."
          className="mt-2 h-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-right text-xs">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 5).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="text-xs">{invoice.vendor.name}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">
                    €{Number(invoice.totalAmount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
