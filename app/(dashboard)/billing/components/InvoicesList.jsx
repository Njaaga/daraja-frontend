'use client';

export default function InvoicesList({ invoices }) {
  if (!Array.isArray(invoices)) return null;

  const handleDownload = (pdfUrl) => {
    if (!pdfUrl) return alert("PDF not available");
    window.open(pdfUrl, "_blank"); // opens the PDF in a new tab
  };

  return (
    <ul className="space-y-2">
      {invoices.map((inv) => (
        <li key={inv.id} className="flex justify-between items-center">
          <span>
            {new Date(inv.created * 1000).toLocaleDateString()} - ${(inv.amount_due / 100).toFixed(2)} - {inv.status}
          </span>
          {inv.pdf && (
            <button
              className="ml-4 px-2 py-1 bg-blue-600 text-white rounded"
              onClick={() => handleDownload(inv.pdf)}
            >
              Download PDF
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
