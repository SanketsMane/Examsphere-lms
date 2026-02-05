
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { IconPrinter, IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface InvoicePageProps {
    params: Promise<{
        transactionId: string;
    }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
    const userRaw = await requireUser();
    // Resolve params
    const resolvedParams = await params;
    
    // Fetch transaction
    const transaction = await prisma.systemTransaction.findUnique({
        where: { id: resolvedParams.transactionId },
        include: { user: true }
    });

    if (!transaction) {
        return notFound();
    }

    // Security: Only allow owner or admin
    if (transaction.userId !== userRaw.id && (userRaw as any).role !== 'admin') {
        return redirect("/");
    }

    const subTotal = transaction.amount; 
    const tax = 0; // Assuming inclusive for now or 0
    const total = subTotal + tax;

    return (
        <div className="min-h-screen bg-white text-slate-900 p-8 md:p-16 print:p-0">
            <div className="max-w-3xl mx-auto border p-8 shadow-sm print:border-none print:shadow-none">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                     <div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary">INVOICE</h1>
                        <p className="text-muted-foreground mt-1">#{transaction.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">Kidokool LMS</h2>
                        <p className="text-sm text-slate-500">
                            123 Learning Lane<br />
                            EdTech City, 400001<br />
                            India
                        </p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-12 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Bill To</h3>
                         <p className="font-medium">{transaction.user.name}</p>
                         <p className="text-sm text-slate-500">{transaction.user.email}</p>
                    </div>
                    <div className="text-right">
                         <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Date</h3>
                         <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                         
                         <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2 mt-4">Payment Method</h3>
                         <p>Razorpay / Card</p>
                    </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                             <th className="text-left py-3 font-semibold">Description</th>
                             <th className="text-right py-3 font-semibold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="py-4">{transaction.description}</td>
                            <td className="py-4 text-right">{(transaction.amount / 100).toFixed(2)} {transaction.currency}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span>{(subTotal / 100).toFixed(2)} {transaction.currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tax (0%)</span>
                            <span>{(tax / 100).toFixed(2)} {transaction.currency}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span>Total</span>
                            <span>{(total / 100).toFixed(2)} {transaction.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-8 text-center text-sm text-slate-500">
                    <p>Thank you for choosing Kidokool LMS!</p>
                    <p>For any questions, please contact support@kidokool.com</p>
                </div>

                {/* Print Actions (Hidden in Print) */}
                <div className="mt-8 flex justify-center gap-4 print:hidden">
                    <Button onClick={() => window.print()} variant="outline">
                        <IconPrinter className="w-4 h-4 mr-2" />
                        Print Invoice
                    </Button>
                </div>
            </div>
            
            {/* Inject print styles specifically if needed, strictly simpler to just use print: classes */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
}
