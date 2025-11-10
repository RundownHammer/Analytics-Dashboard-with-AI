import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Define enum values directly since they're not exported yet
enum InvoiceStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  PARTIAL = "PARTIAL"
}

interface ExtractedDocument {
  _id: string;
  name: string;
  status: string;
  createdAt: { $date: string };
  extractedData?: {
    llmData?: {
      invoice?: {
        value?: {
          invoiceId?: { value: string };
          invoiceDate?: { value: string };
          deliveryDate?: { value: string };
        };
      };
      vendor?: {
        value?: {
          vendorName?: { value: string };
          vendorAddress?: { value: string };
          vendorTaxId?: { value: string };
        };
      };
      customer?: {
        value?: {
          customerName?: { value: string };
          customerAddress?: { value: string };
        };
      };
      payment?: {
        value?: {
          dueDate?: { value: string };
          paymentTerms?: { value: string };
        };
      };
      summary?: {
        value?: {
          subTotal?: { value: number };
          totalTax?: { value: number };
          invoiceTotal?: { value: number };
        };
      };
      lineItems?: {
        value?: {
          items?: Array<{
            description?: { value: string };
            quantity?: { value: number };
            unitPrice?: { value: number };
            totalPrice?: { value: number };
          }>;
        };
      };
    };
  };
  validatedData?: {
    status: string;
  };
  processedAt?: { $date: string };
}

function mapStatus(statusField: string, validatedStatus?: string): InvoiceStatus {
  const status = validatedStatus || statusField;
  
  // Better distribution of statuses for demo data
  const rand = Math.random();
  if (status === "validated") {
    // 70% PAID, 30% PARTIAL for validated invoices
    return rand < 0.7 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
  }
  
  if (status === "processed") {
    // Mix of PENDING and OVERDUE for processed invoices
    return rand < 0.6 ? InvoiceStatus.PENDING : InvoiceStatus.OVERDUE;
  }
  
  // Default mix
  if (rand < 0.4) return InvoiceStatus.PENDING;
  if (rand < 0.6) return InvoiceStatus.OVERDUE;
  if (rand < 0.8) return InvoiceStatus.PARTIAL;
  return InvoiceStatus.PAID;
}

function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  try {
    return new Date(dateStr);
  } catch {
    return new Date();
  }
}

function getVendorCategory(vendorName?: string): string {
  if (!vendorName) return "Uncategorized";
  const name = vendorName.toLowerCase();
  
  // More specific category mapping
  if (name.includes("tech") || name.includes("software") || name.includes("digital") || name.includes("systems")) return "Technology";
  if (name.includes("marketing") || name.includes("media") || name.includes("advertis")) return "Marketing";
  if (name.includes("consulting") || name.includes("services") || name.includes("facility") || name.includes("maintenance")) return "Facilities";
  if (name.includes("supply") || name.includes("global") || name.includes("logistics") || name.includes("material")) return "Operations";
  
  // Better distribution: use hash-based fallback instead of defaulting everything to Operations
  const categories = ["Technology", "Operations", "Marketing", "Facilities"];
  const hash = vendorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return categories[hash % categories.length];
}

async function main() {
  const dataPath = path.resolve(process.cwd(), "data", "Analytics_Test_Data.json");
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Missing dataset at ${dataPath}. Place Analytics_Test_Data.json in /data.`);
  }

  console.log("🔄 Loading data from:", dataPath);
  const rawDocuments: ExtractedDocument[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`📄 Found ${rawDocuments.length} documents`);

  let processedCount = 0;
  let skippedCount = 0;
  const usedInvoiceNumbers = new Set<string>();

  for (const doc of rawDocuments) {
    try {
      const llm = doc.extractedData?.llmData;
      if (!llm || !llm.invoice || !llm.vendor || !llm.summary) {
        console.log(`⏭️  Skipping ${doc.name} - missing required data`);
        skippedCount++;
        continue;
      }

      const baseInvoiceId = llm.invoice.value?.invoiceId?.value || doc._id.slice(0, 8);
      
      // Make invoice number unique by appending counter if duplicate
      let invoiceId = baseInvoiceId;
      let counter = 1;
      while (usedInvoiceNumbers.has(invoiceId)) {
        invoiceId = `${baseInvoiceId}-${counter}`;
        counter++;
      }
      usedInvoiceNumbers.add(invoiceId);

      const vendorName = llm.vendor.value?.vendorName?.value || "Unknown Vendor";
      const customerName = llm.customer?.value?.customerName?.value || null;
      const invoiceDate = llm.invoice.value?.invoiceDate?.value;
      let dueDate = llm.payment?.value?.dueDate?.value;
      
      // If no due date or if we want better distribution across aging buckets, generate one
      if (!dueDate || Math.random() < 0.3) { // 30% chance to override for better distribution
        const now = new Date();
        const daysOffset = Math.floor(Math.random() * 180) - 90; // Random between -90 and +90 days
        const generatedDate = new Date(now);
        generatedDate.setDate(generatedDate.getDate() + daysOffset);
        dueDate = generatedDate.toISOString();
      }
      
      const invoiceTotal = llm.summary.value?.invoiceTotal?.value || 0;
      const subTotal = llm.summary.value?.subTotal?.value || invoiceTotal;
      const totalTax = llm.summary.value?.totalTax?.value || 0;
      
      // Safely handle line items - ensure it's an array
      let lineItems: any[] = [];
      if (llm.lineItems?.value?.items && Array.isArray(llm.lineItems.value.items)) {
        lineItems = llm.lineItems.value.items;
      }

      // Create/update vendor
      const vendor = await prisma.vendor.upsert({
        where: { name: vendorName },
        create: {
          name: vendorName,
          category: getVendorCategory(vendorName),
        },
        update: {},
      });

      // Create/update customer if exists
      let customerId: string | null = null;
      if (customerName) {
        const customer = await prisma.customer.upsert({
          where: { name: customerName },
          create: { name: customerName },
          update: {},
        });
        customerId = customer.id;
      }

      // Create invoice
      const invoiceStatus = mapStatus(doc.status, doc.validatedData?.status);
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceId,
          vendorId: vendor.id,
          customerId,
          status: invoiceStatus,
          issueDate: parseDate(invoiceDate || doc.createdAt.$date),
          dueDate: dueDate ? parseDate(dueDate) : null,
          subTotal: Math.abs(subTotal),
          taxAmount: Math.abs(totalTax),
          totalAmount: Math.abs(invoiceTotal),
        },
      });

      // Create line items (only if we have any)
      if (lineItems.length > 0) {
        for (const item of lineItems) {
          if (item.description?.value) {
            await prisma.lineItem.create({
              data: {
                invoiceId: invoice.id,
                description: item.description.value,
                quantity: item.quantity?.value || 1,
                unitPrice: Math.abs(item.unitPrice?.value || 0),
                totalPrice: Math.abs(item.totalPrice?.value || 0),
              },
            });
          }
        }
      } else {
        // Create a default line item if none exist
        await prisma.lineItem.create({
          data: {
            invoiceId: invoice.id,
            description: "Invoice item",
            quantity: 1,
            unitPrice: Math.abs(invoiceTotal),
            totalPrice: Math.abs(invoiceTotal),
          },
        });
      }

      // Create payment based on invoice status (already computed above)
      if (invoiceStatus === InvoiceStatus.PAID && doc.processedAt) {
        // Full payment for PAID invoices
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            paidDate: parseDate(doc.processedAt.$date),
            amount: Math.abs(invoiceTotal),
            paymentMethod: "Bank Transfer",
          },
        });
      } else if (invoiceStatus === InvoiceStatus.PARTIAL) {
        // Partial payment (30-70% of total)
        const partialPercent = 0.3 + Math.random() * 0.4;
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            paidDate: parseDate(doc.processedAt?.$date || doc.createdAt.$date),
            amount: Math.abs(invoiceTotal * partialPercent),
            paymentMethod: "Bank Transfer",
          },
        });
      }
      // No payment for PENDING and OVERDUE invoices

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`✅ Processed ${processedCount} invoices...`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${doc.name}:`, error);
      skippedCount++;
    }
  }

  console.log("\n🎉 Seed completed!");
  console.log(`✅ Successfully processed: ${processedCount} invoices`);
  console.log(`⏭️  Skipped: ${skippedCount} documents`);
}

main()
  .then(() => console.log("\n✨ Database seeding finished successfully"))
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
