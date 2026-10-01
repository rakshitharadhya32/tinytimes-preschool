import { useEffect, useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import api from '../../lib/api';

const statusStyles = {
  paid: 'bg-sprout-100 text-sprout-700',
  unpaid: 'bg-sun-100 text-sun-500',
  overdue: 'bg-bloom-100 text-bloom-600',
  cancelled: 'bg-slate-100 text-slate-400',
};

function formatMoney(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function ParentBilling() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    api.get('/billing/invoices').then((res) => setInvoices(res.data));
  }, []);

  const due = useMemo(
    () => invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="font-heading mb-1 text-lg font-semibold text-slate-800">Billing</h1>
        <p className="text-sm text-slate-400">Fees and payment status for your children.</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-400">Total due</p>
        <p className="font-heading text-2xl font-semibold text-bloom-600">{formatMoney(due)}</p>
      </div>

      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{inv.description}</p>
                <p className="text-xs text-slate-400">
                  {inv.studentFirstName} {inv.studentLastName} · Due {inv.dueDate}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[inv.status]}`}>
                {inv.status}
              </span>
            </div>
            <p className="mt-2 font-heading text-lg font-semibold text-slate-700">{formatMoney(inv.amount)}</p>
          </div>
        ))}
        {invoices.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            <Receipt size={22} className="mx-auto mb-2 text-slate-300" />
            No invoices yet.
          </div>
        )}
      </div>
    </div>
  );
}
