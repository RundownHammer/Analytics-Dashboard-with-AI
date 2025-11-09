import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { InvoiceTrendChart } from '@/components/dashboard/invoice-trend-chart'
import { VendorSpendChart } from '@/components/dashboard/vendor-spend-chart'
import { CategorySpendChart } from '@/components/dashboard/category-spend-chart'
import { CashOutflowChart } from '@/components/dashboard/cash-outflow-chart'
import { InvoicesByVendorTable } from '@/components/dashboard/invoices-by-vendor-table'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="p-6">
            {/* Stats Cards */}
            <StatsCards />

            {/* First Row: Invoice Trend + Vendor Spend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <InvoiceTrendChart />
              <VendorSpendChart />
            </div>

            {/* Second Row: Category Spend (Pie) + Cash Outflow (Bar) + Invoices Table (1.5x single chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mt-6">
              {/* Category Spend (Pie Chart): 2 cols */}
              <div className="lg:col-span-2">
                <CategorySpendChart />
              </div>
              
              {/* Cash Outflow (Bar Chart): 2 cols */}
              <div className="lg:col-span-2">
                <CashOutflowChart />
              </div>
              
              {/* Invoices Table: 3 cols (1.5x of 2 cols) */}
              <div className="lg:col-span-3">
                <InvoicesByVendorTable />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
