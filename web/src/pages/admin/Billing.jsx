import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Trash2, CheckCircle2, Receipt, Layers } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  paid: 'bg-sprout-100 text-sprout-700',
  unpaid: 'bg-sun-100 text-sun-500',
  overdue: 'bg-bloom-100 text-bloom-600',
  cancelled: 'bg-slate-100 text-slate-400',
};

function formatMoney(amount) {
  const n = Number(amount);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function emptyPlanForm() {
  return { name: '', amount: '', frequency: 'monthly', description: '' };
}

function emptyInvoiceForm() {
  return { studentId: '', feePlanId: '', description: '', amount: '', dueDate: '' };
}

export default function Billing() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('invoices');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlanForm());

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm());

  function load() {
    api.get('/billing/plans').then((res) => setPlans(res.data));
    api.get('/billing/invoices').then((res) => setInvoices(res.data));
    api.get('/students').then((res) => setStudents(res.data.filter((s) => s.stage === 'enrolled')));
  }
  useEffect(load, []);

  const visibleInvoices = useMemo(
    () => (statusFilter === 'all' ? invoices : invoices.filter((i) => i.status === statusFilter)),
    [invoices, statusFilter]
  );

  const totals = useMemo(() => {
    const due = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
    const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    return { due, collected };
  }, [invoices]);

  async function savePlan(e) {
    e.preventDefault();
    await api.post('/billing/plans', planForm);
    setShowPlanForm(false);
    setPlanForm(emptyPlanForm());
    load();
  }

  async function removePlan(id) {
    if (!confirm('Delete this fee plan? Existing invoices created from it are unaffected.')) return;
    await api.delete(`/billing/plans/${id}`);
    load();
  }

  function onPlanPick(feePlanId) {
    const plan = plans.find((p) => p.id === Number(feePlanId));
    setInvoiceForm((f) => ({
      ...f,
      feePlanId,
      amount: plan ? plan.amount : f.amount,
      description: plan ? plan.name : f.description,
    }));
  }

  async function saveInvoice(e) {
    e.preventDefault();
    await api.post('/billing/invoices', invoiceForm);
    setShowInvoiceForm(false);
    setInvoiceForm(emptyInvoiceForm());
    load();
  }

  async function markPaid(id) {
    await api.patch(`/billing/invoices/${id}`, { status: 'paid' });
    load();
  }

  async function markUnpaid(id) {
    await api.patch(`/billing/invoices/${id}`, { status: 'unpaid' });
    load();
  }

  async function cancelInvoice(id) {
    if (!confirm('Cancel this invoice?')) return;
    await api.patch(`/billing/invoices/${id}`, { status: 'cancelled' });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-800">Billing</h1>
          <p className="text-sm text-slate-400">Fee plans and per-family invoices.</p>
        </div>
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            onClick={() => setTab('invoices')}
            className={`rounded-xl px-3 py-1.5 ${tab === 'invoices' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
          >
            Invoices
          </button>
          <button
            onClick={() => setTab('plans')}
            className={`rounded-xl px-3 py-1.5 ${tab === 'plans' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
          >
            Fee plans
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
          <p className="text-xs text-slate-400">Outstanding</p>
          <p className="font-heading text-xl font-semibold text-bloom-600">{formatMoney(totals.due)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
          <p className="text-xs text-slate-400">Collected</p>
          <p className="font-heading text-xl font-semibold text-sprout-600">{formatMoney(totals.collected)}</p>
        </div>
      </div>

      {tab === 'invoices' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {user?.role !== 'parent' && (
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-200 hover:bg-brand-600"
              >
                <Plus size={16} /> New invoice
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {inv.studentFirstName} {inv.studentLastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inv.description}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatMoney(inv.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button
                          onClick={() => markPaid(inv.id)}
                          className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-sprout-600 hover:text-sprout-700"
                        >
                          <CheckCircle2 size={13} /> Mark paid
                        </button>
                      )}
                      {inv.status === 'paid' && (
                        <button onClick={() => markUnpaid(inv.id)} className="mr-2 text-xs font-semibold text-slate-400 hover:text-slate-600">
                          Undo
                        </button>
                      )}
                      {inv.status !== 'cancelled' && (
                        <button onClick={() => cancelInvoice(inv.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowPlanForm(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-200 hover:bg-brand-600"
            >
              <Plus size={16} /> New fee plan
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <Layers size={17} />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs capitalize text-slate-400">{p.frequency.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button onClick={() => removePlan(p.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="mt-3 font-heading text-lg font-semibold text-slate-700">{formatMoney(p.amount)}</p>
                {p.description && <p className="mt-1 text-xs text-slate-400">{p.description}</p>}
              </div>
            ))}
            {plans.length === 0 && (
              <p className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                No fee plans yet.
              </p>
            )}
          </div>
        </div>
      )}

      {showPlanForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-slate-800">New fee plan</h2>
              <button onClick={() => setShowPlanForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={savePlan} className="space-y-3">
              <input
                required
                placeholder="Plan name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={planForm.amount}
                  onChange={(e) => setPlanForm({ ...planForm, amount: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={planForm.frequency}
                  onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
              <textarea
                placeholder="Description (optional)"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                Create plan
              </button>
            </form>
          </div>
        </div>
      )}

      {showInvoiceForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-slate-800">New invoice</h2>
              <button onClick={() => setShowInvoiceForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveInvoice} className="space-y-3">
              <select
                required
                value={invoiceForm.studentId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
              <select
                value={invoiceForm.feePlanId}
                onChange={(e) => onPlanPick(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Custom amount (no fee plan)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.amount)}
                  </option>
                ))}
              </select>
              <input
                placeholder="Description"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <button className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 flex items-center justify-center gap-2">
                <Receipt size={15} /> Create invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
