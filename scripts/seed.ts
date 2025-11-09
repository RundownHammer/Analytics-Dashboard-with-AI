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
  if (status === "validated") return InvoiceStatus.PAID;
  if (status === "processed") return InvoiceStatus.PENDING;
  return InvoiceStatus.PENDING;
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
  if (name.includes("tech") || name.includes("software")) return "Technology";
  if (name.includes("supply") || name.includes("global")) return "Operations";
  if (name.includes("marketing") || name.includes("media")) return "Marketing";
  if (name.includes("consulting") || name.includes("services")) return "Facilities";
  return "Operations";
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
      const dueDate = llm.payment?.value?.dueDate?.value;
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
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceId,
          vendorId: vendor.id,
          customerId,
          status: mapStatus(doc.status, doc.validatedData?.status),
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

      // Create payment if invoice is validated/paid
      if (doc.validatedData?.status === "validated" && doc.processedAt) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            paidDate: parseDate(doc.processedAt.$date),
            amount: Math.abs(invoiceTotal),
            paymentMethod: "Bank Transfer",
          },
        });
      }

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
