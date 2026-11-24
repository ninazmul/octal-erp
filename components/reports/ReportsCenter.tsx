"use client";

import { useState } from "react";
import { getReportData } from "@/lib/actions/financialReport.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  Printer,
  Search,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Users,
  Receipt,
  Percent,
  Briefcase,
  CreditCard,
  Building,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportMultiSheetExcel } from "@/lib/excel";

const REPORT_DEFINITIONS = [
  { id: "student_admissions", name: "1. Student Admission Report", icon: Users },
  { id: "student_directory", name: "2. Student Directory & Enrollment History", icon: GraduationCap },
  { id: "batch_enrollments", name: "3. Course & Batch-Wise Enrollment", icon: Layers },
  { id: "collections_dues", name: "4. Student Collection & Due Report", icon: Receipt },
  { id: "referral_performance", name: "5. Instructor Batch Earnings", icon: Users },
  { id: "instructor_commissions", name: "6. Instructor Batch Earnings", icon: Percent },
  { id: "batch_settlements", name: "7. Batch Settlement Statements", icon: FileSpreadsheet },
  { id: "staff_payroll_summary", name: "8. Staff Directory & Payroll Summary", icon: Briefcase },
  { id: "employee_salary_history", name: "9. Employee-Wise Salary History", icon: Briefcase },
  { id: "department_payroll", name: "10. Department-Wise Payroll Report", icon: Briefcase },
  { id: "expense_categories", name: "11. Expense Category Report", icon: CreditCard },
  { id: "monthly_expenses", name: "12. Monthly Expense Report", icon: CreditCard },
  { id: "outstanding_liabilities", name: "13. Outstanding Liabilities Report", icon: Building },
  { id: "cashflow_summary", name: "14. Cashflow & Account Balance Summary", icon: Building },
  { id: "income_expense", name: "15. Income & Expense Ledger", icon: CreditCard },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportItem = any;

interface ReportsCenterProps {
  initialReportId?: string;
  initialData?: ReportItem;
}

export default function ReportsCenter({
  initialReportId = "collections_dues",
  initialData = [],
}: ReportsCenterProps) {
  const [activeReportId, setActiveReportId] = useState(initialReportId);
  const [data, setData] = useState<ReportItem>(initialData);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [transactionType, setTransactionType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [loading, setLoading] = useState(false);

  const fetchReport = async (reportId: string, filters?: { startDate?: string; endDate?: string; transactionType?: "ALL" | "CREDIT" | "DEBIT" }) => {
    setLoading(true);
    try {
      const res = await getReportData(reportId, {
        startDate: filters?.startDate ?? (startDate || undefined),
        endDate: filters?.endDate ?? (endDate || undefined),
        transactionType: filters?.transactionType ?? transactionType,
      });
      setData(res);
      setActiveReportId(reportId);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (reportId: string) => {
    fetchReport(reportId);
  };

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      fetchReport(activeReportId, { startDate: undefined, endDate: undefined });
      return;
    }
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    if (preset === "yesterday") {
      start.setDate(start.getDate() - 1);
      end.setTime(start.getTime());
    } else if (preset === "week") {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    } else if (preset === "month") {
      start.setDate(1);
    } else if (preset === "last_month") {
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
    } else if (preset === "year") {
      start.setMonth(0, 1);
    }
    const from = formatDateInput(start);
    const to = formatDateInput(end);
    setStartDate(from);
    setEndDate(to);
    fetchReport(activeReportId, { startDate: from, endDate: to });
  };

  const filteredLedgerData = activeReportId === "income_expense" && Array.isArray(data)
    ? data.filter((row: ReportItem) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [row.entryNo, row.description, row.sourceModule, row.type, row.account?.accountName]
          .some((value) => String(value || "").toLowerCase().includes(term));
      })
    : data;
  const ledgerRows = activeReportId === "income_expense" && Array.isArray(filteredLedgerData) ? filteredLedgerData : [];
  const totalIncome = ledgerRows.reduce((sum: number, row: ReportItem) => sum + (row.type === "CREDIT" ? Number(row.amount || 0) : 0), 0);
  const totalExpense = ledgerRows.reduce((sum: number, row: ReportItem) => sum + (row.type === "DEBIT" ? Number(row.amount || 0) : 0), 0);
  const statementPeriod = startDate || endDate
    ? `${startDate ? new Date(`${startDate}T00:00:00`).toLocaleDateString() : "Beginning"} – ${endDate ? new Date(`${endDate}T00:00:00`).toLocaleDateString() : "Today"}`
    : "All available dates";
  const statementType = transactionType === "ALL" ? "All transactions" : transactionType === "CREDIT" ? "Credit / Income" : "Debit / Expense";

  const exportExcel = async () => {
    try {
      const transactions = ledgerRows.map((row: ReportItem) => ({
        Date: row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : "",
        Reference: row.entryNo || "",
        Description: row.description || "",
        Account: row.account?.accountName || "",
        Category: row.sourceModule || "",
        Debit: row.type === "DEBIT" ? Number(row.amount || 0) : 0,
        Credit: row.type === "CREDIT" ? Number(row.amount || 0) : 0,
        "Balance After": Number(row.balanceAfter || 0),
      }));
      await exportMultiSheetExcel([
        {
          name: "Statement Summary",
          headers: ["Item", "Value"],
          data: [
            { Item: "Institution", Value: "Octal Technical Training Institute" },
            { Item: "Statement Period", Value: statementPeriod },
            { Item: "Transaction Filter", Value: statementType },
            { Item: "Total Income / Credit", Value: totalIncome },
            { Item: "Total Expense / Debit", Value: totalExpense },
            { Item: "Net Cash Flow", Value: totalIncome - totalExpense },
            { Item: "Transaction Count", Value: ledgerRows.length },
            { Item: "Generated At", Value: new Date().toLocaleString() },
          ],
        },
        {
          name: "Transactions",
          headers: ["Date", "Reference", "Description", "Account", "Category", "Debit", "Credit", "Balance After"],
          data: transactions,
        },
      ], `income-expense-statement-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel statement exported.");
    } catch (error) {
      toast.error((error as Error).message || "Could not export Excel statement.");
    }
  };

  const exportCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const reportName =
      REPORT_DEFINITIONS.find((r) => r.id === activeReportId)?.name || "Report";

    const exportData = activeReportId === "income_expense" ? ledgerRows : data;
    if (activeReportId === "income_expense") {
      csvContent += `Income,,${totalIncome}\r\nExpense,,${totalExpense}\r\nNet,,${totalIncome - totalExpense}\r\n\r\n`;
    }
    if (Array.isArray(exportData) && exportData.length > 0) {
      const keys = Object.keys(exportData[0]).filter(
        (k) => typeof exportData[0][k] !== "object"
      );
      csvContent += keys.join(",") + "\r\n";
      exportData.forEach((row: ReportItem) => {
        const line = keys.map((k) => `"${String(row[k] ?? "")}"`).join(",");
        csvContent += line + "\r\n";
      });
    } else {
      csvContent += JSON.stringify(exportData);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export downloaded!");
  };

  const handlePrint = () => {
    if (activeReportId !== "income_expense") {
      window.print();
      return;
    }

    const escapeHtml = (value: unknown) => String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
    const rows = ledgerRows.map((row: ReportItem) => `
      <tr>
        <td>${escapeHtml(row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : "—")}</td>
        <td>${escapeHtml(row.entryNo || "—")}</td>
        <td>${escapeHtml(row.description || "—")}</td>
        <td>${escapeHtml(row.account?.accountName || "—")}</td>
        <td class="number">${row.type === "DEBIT" ? Number(row.amount || 0).toLocaleString() : "—"}</td>
        <td class="number">${row.type === "CREDIT" ? Number(row.amount || 0).toLocaleString() : "—"}</td>
        <td class="number">${Number(row.balanceAfter || 0).toLocaleString()}</td>
      </tr>`).join("");
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      toast.error("Allow pop-ups to export this statement as PDF.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>Income and Expense Statement</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #172033; font: 10px Arial, Helvetica, sans-serif; }
        header { margin-bottom: 22px; }
        .brand { color: #0f2747; font-size: 19px; font-weight: 700; letter-spacing: 1.4px; }
        .subtitle { margin-top: 5px; color: #526176; font-size: 11px; font-weight: 700; letter-spacing: 2px; }
        .rule { height: 1px; margin: 12px 0; background: #b7c4d3; }
        .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 16px; }
        .meta span, .summary span { display: block; margin-bottom: 4px; color: #64748b; font-size: 9px; }
        .meta strong { font-size: 10px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0; }
        .summary div { padding: 10px 12px; border: 1px solid #d8e0e9; border-radius: 5px; }
        .summary strong { color: #0f2747; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        thead { display: table-header-group; }
        th { padding: 8px 7px; border-top: 1px solid #9aa9ba; border-bottom: 1px solid #9aa9ba; background: #eef2f6; color: #26364a; text-align: left; }
        td { padding: 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        .number { text-align: right; white-space: nowrap; }
        tfoot th { background: #f5f7fa; }
        footer { margin-top: 20px; padding-top: 7px; border-top: 1px solid #d8e0e9; color: #64748b; font-size: 8px; }
      </style></head><body>
      <header><div class="brand">OCTAL TECHNICAL TRAINING INSTITUTE</div><div class="subtitle">FINANCIAL ACCOUNT STATEMENT</div><div class="rule"></div>
        <div class="meta"><div><span>Statement period</span><strong>${escapeHtml(statementPeriod)}</strong></div><div><span>Transaction type</span><strong>${escapeHtml(statementType)}</strong></div><div><span>Generated</span><strong>${escapeHtml(new Date().toLocaleString())}</strong></div></div>
      </header>
      <div class="summary"><div><span>Total credits / income</span><strong>৳${totalIncome.toLocaleString()}</strong></div><div><span>Total debits / expense</span><strong>৳${totalExpense.toLocaleString()}</strong></div><div><span>Net cash flow</span><strong>৳${(totalIncome - totalExpense).toLocaleString()}</strong></div></div>
      <table><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Account</th><th class="number">Debit</th><th class="number">Credit</th><th class="number">Balance after</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="padding:24px;text-align:center;color:#64748b">No transactions for the selected period.</td></tr>'}</tbody>
      <tfoot><tr><th colspan="4">Period totals</th><th class="number">৳${totalExpense.toLocaleString()}</th><th class="number">৳${totalIncome.toLocaleString()}</th><th class="number">Net ৳${(totalIncome - totalExpense).toLocaleString()}</th></tr></tfoot></table>
      <footer>This statement was generated electronically by Octal ERP. Please retain it for your records.</footer>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  };

  const currentReportMeta = REPORT_DEFINITIONS.find(
    (r) => r.id === activeReportId
  );

  return (
    <div className="space-y-6">
      {activeReportId === "income_expense" && <section id="bank-statement-print-area" className="hidden" aria-label="Printable bank style financial statement">
        <header className="bank-statement-header">
          <div className="bank-statement-brand">OCTAL TECHNICAL TRAINING INSTITUTE</div>
          <div className="bank-statement-subtitle">FINANCIAL ACCOUNT STATEMENT</div>
          <div className="bank-statement-rule" />
          <div className="bank-statement-meta">
            <div><span>Statement period</span><strong>{statementPeriod}</strong></div>
            <div><span>Transaction type</span><strong>{statementType}</strong></div>
            <div><span>Generated</span><strong>{new Date().toLocaleString()}</strong></div>
          </div>
        </header>
        <div className="bank-statement-totals">
          <div><span>Total credits / income</span><strong>৳{totalIncome.toLocaleString()}</strong></div>
          <div><span>Total debits / expense</span><strong>৳{totalExpense.toLocaleString()}</strong></div>
          <div><span>Net cash flow</span><strong>৳{(totalIncome - totalExpense).toLocaleString()}</strong></div>
        </div>
        <table className="bank-statement-table">
          <thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Account</th><th>Debit</th><th>Credit</th><th>Balance after</th></tr></thead>
          <tbody>
            {ledgerRows.map((row: ReportItem) => <tr key={row._id}>
              <td>{row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : "—"}</td>
              <td>{row.entryNo || "—"}</td><td>{row.description || "—"}</td><td>{row.account?.accountName || "—"}</td>
              <td className="numeric">{row.type === "DEBIT" ? Number(row.amount || 0).toLocaleString() : "—"}</td>
              <td className="numeric">{row.type === "CREDIT" ? Number(row.amount || 0).toLocaleString() : "—"}</td>
              <td className="numeric">{Number(row.balanceAfter || 0).toLocaleString()}</td>
            </tr>)}
            {ledgerRows.length === 0 && <tr><td colSpan={7} className="empty-row">No transactions for the selected period.</td></tr>}
          </tbody>
          <tfoot><tr><th colSpan={4}>Period totals</th><th className="numeric">৳{totalExpense.toLocaleString()}</th><th className="numeric">৳{totalIncome.toLocaleString()}</th><th className="numeric">Net ৳{(totalIncome - totalExpense).toLocaleString()}</th></tr></tfoot>
        </table>
        <footer className="bank-statement-footer">This statement was generated electronically by Octal ERP. Please retain it for your records.</footer>
      </section>}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Operational & Financial Reports Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export official statements across admissions, collections, payroll, instructor batch earnings, and liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReportId === "income_expense" ? <>
            <Button onClick={exportExcel} variant="outline" className="rounded-xl text-xs sm:text-sm gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </Button>
            <Button onClick={handlePrint} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-1.5 shadow-sm">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </> : <>
            <Button onClick={exportCSV} variant="outline" className="rounded-xl text-xs sm:text-sm gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={handlePrint} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm gap-1.5 shadow-sm">
              <Printer className="w-4 h-4" /> Print Report
            </Button>
          </>}
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Report Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Report Selection List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-1 shadow-sm print:hidden">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 block">
            15 Standard Reports
          </span>
          {REPORT_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            const isActive = activeReportId === def.id;

            return (
              <button
                key={def.id}
                onClick={() => handleSelectReport(def.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/50 dark:border-indigo-800/40"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{def.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Report Filters and Data Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 print:hidden">
            <div className="flex-1 flex items-center gap-2 w-full">
              <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
              <Input
                placeholder="Search within report results..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 text-xs shadow-none p-0 h-8"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select aria-label="Report period" value={datePreset} onChange={(e) => applyDatePreset(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="all">All time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="month">This month</option><option value="last_month">Last month</option><option value="year">This year</option><option value="custom">Custom range</option>
              </select>
              {activeReportId === "income_expense" && <select aria-label="Transaction type" value={transactionType} onChange={(e) => { const value = e.target.value as "ALL" | "CREDIT" | "DEBIT"; setTransactionType(value); fetchReport(activeReportId, { transactionType: value }); }} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="ALL">Debit + Credit</option><option value="CREDIT">Credit / Income</option><option value="DEBIT">Debit / Expense</option>
              </select>}
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setDatePreset("custom"); }}
                className="h-8 text-xs w-36"
                placeholder="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setDatePreset("custom"); }}
                className="h-8 text-xs w-36"
                placeholder="End Date"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchReport(activeReportId)}
                disabled={loading}
                className="h-8 px-2 text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Report Viewer Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentReportMeta?.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated on {new Date().toLocaleDateString()} • Octal ERP Unified Ledger
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-bold">
                {Array.isArray(data) ? `${data.length} Records` : "Aggregated View"}
              </Badge>
            </div>

            {/* Dynamic Rendering Based on Active Report */}
            <div className="overflow-x-auto text-xs">
              {activeReportId === "income_expense" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><ArrowUpRight className="h-4 w-4"/><span className="font-semibold">Total Income</span></div>
                    <p className="mt-2 text-xl font-bold text-emerald-800 dark:text-emerald-200">৳{totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300"><ArrowDownRight className="h-4 w-4"/><span className="font-semibold">Total Expense</span></div>
                    <p className="mt-2 text-xl font-bold text-rose-800 dark:text-rose-200">৳{totalExpense.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Net Cash Flow</span>
                    <p className={`mt-2 text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-slate-900 dark:text-white" : "text-rose-700 dark:text-rose-300"}`}>৳{(totalIncome - totalExpense).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {activeReportId === "income_expense" && (
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] dark:border-slate-800">
                    <th className="pb-3 px-3">Date</th><th className="pb-3 px-3">Entry</th><th className="pb-3 px-3">Description</th><th className="pb-3 px-3">Account</th><th className="pb-3 px-3">Category</th><th className="pb-3 px-3">Type</th><th className="pb-3 px-3 text-right">Amount</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ledgerRows.map((row: ReportItem) => <tr key={row._id}>
                      <td className="py-2.5 px-3 whitespace-nowrap">{new Date(row.transactionDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-mono">{row.entryNo}</td><td className="py-2.5 px-3">{row.description}</td>
                      <td className="py-2.5 px-3">{row.account?.accountName || "—"}</td><td className="py-2.5 px-3 capitalize">{String(row.sourceModule || "").replaceAll("_", " ")}</td>
                      <td className={`py-2.5 px-3 font-semibold ${row.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>{row.type === "CREDIT" ? "Credit / Income" : "Debit / Expense"}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">৳{Number(row.amount || 0).toLocaleString()}</td>
                    </tr>)}
                    {ledgerRows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-400">No ledger entries found for the selected filters.</td></tr>}
                  </tbody>
                </table>
              )}
              {/* Report 4: Collections & Dues */}
              {activeReportId === "collections_dues" && Array.isArray(data) && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3 px-3">Student Name</th>
                      <th className="pb-3 px-3">Contact</th>
                      <th className="pb-3 px-3">Course & Batch</th>
                      <th className="pb-3 px-3">Final Payable</th>
                      <th className="pb-3 px-3">Paid</th>
                      <th className="pb-3 px-3">Remaining Due</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((enr: ReportItem) => (
                      <tr key={enr._id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {enr.student?.fullName}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {enr.student?.studentId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{enr.student?.phone}</td>
                        <td className="py-2.5 px-3">
                          {enr.course?.title}
                          <span className="block text-[10px] text-slate-400">
                            {enr.batch?.batchName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          ৳{enr.finalPayableAmount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">
                          ৳{enr.totalCollectedAmount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-600 font-bold">
                          ৳{enr.remainingDue?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {enr.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Report 3: Batch Enrollments */}
              {activeReportId === "batch_enrollments" && Array.isArray(data) && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3 px-3">Batch Code & Name</th>
                      <th className="pb-3 px-3">Course</th>
                      <th className="pb-3 px-3">Enrolled</th>
                      <th className="pb-3 px-3">Total Agreed</th>
                      <th className="pb-3 px-3">Total Collected</th>
                      <th className="pb-3 px-3">Outstanding Due</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((b: ReportItem) => (
                      <tr key={b._id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {b.batchName} ({b.batchCode})
                        </td>
                        <td className="py-2.5 px-3">{b.course?.title}</td>
                        <td className="py-2.5 px-3 font-bold">
                          {b.enrolledCount} / {b.maxCapacity}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          ৳{b.agreed?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">
                          ৳{b.collected?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-600 font-bold">
                          ৳{b.due?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Report 5: Instructor Batch Earnings */}
              {activeReportId === "referral_performance" && Array.isArray(data) && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3 px-3">Instructor</th>
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 px-3">Batches With Payout</th>
                      <th className="pb-3 px-3">Batch Earnings</th>
                      <th className="pb-3 px-3">Paid Out</th>
                      <th className="pb-3 px-3">Remaining Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((item: ReportItem) => (
                      <tr key={item.instructor?._id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {item.instructor?.fullName}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.instructor?.employeeId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{item.instructor?.department}</td>
                        <td className="py-2.5 px-3 font-bold">{item.batchesCount}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          ৳{item.totalEarned?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600">
                          ৳{item.totalPaid?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600">
                          ৳{item.remainingDue?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Report 10: Department Payroll */}
              {activeReportId === "department_payroll" && !Array.isArray(data) && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 px-3">Employee Count</th>
                      <th className="pb-3 px-3">Total Basic Salary</th>
                      <th className="pb-3 px-3">Total Net Payroll Commitment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {Object.entries(data).map(([dept, val]: [string, ReportItem]) => (
                      <tr key={dept}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {dept}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{val.count}</td>
                        <td className="py-2.5 px-3 font-mono">
                          ৳{val.totalBasic?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-sm">
                          ৳{val.totalNet?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Generic Fallback for other reports */}
              {!["collections_dues", "batch_enrollments", "referral_performance", "department_payroll"].includes(activeReportId) && Array.isArray(data) && (
                <div className="space-y-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        {data[0] &&
                          Object.keys(data[0])
                            .filter((k) => typeof data[0][k] !== "object")
                            .slice(0, 7)
                            .map((k) => (
                              <th key={k} className="pb-3 px-3 capitalize">
                                {k.replace(/([A-Z])/g, " $1")}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {data.map((row: ReportItem, i: number) => (
                        <tr key={row._id || i}>
                          {Object.keys(row)
                            .filter((k) => typeof row[k] !== "object")
                            .slice(0, 7)
                            .map((k) => (
                              <td key={k} className="py-2.5 px-3">
                                {typeof row[k] === "number"
                                  ? `৳${row[k].toLocaleString()}`
                                  : String(row[k] ?? "—")}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty state */}
              {(!data || (Array.isArray(data) && data.length === 0)) && (
                <div className="py-12 text-center text-slate-400">
                  <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No data records found for this report and date range.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

