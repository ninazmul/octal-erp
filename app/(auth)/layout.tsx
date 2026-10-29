import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-b from-slate-100 via-sky-50/40 to-slate-100 dark:from-[#050811] dark:via-[#090e1d] dark:to-[#050811] px-3 py-6 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="relative isolate mx-auto flex w-full max-w-5xl flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 backdrop-blur-2xl shadow-[0_30px_80px_-28px_rgba(15,23,42,0.35)] lg:min-h-[580px] lg:flex-row overflow-hidden my-auto">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-[-5rem] h-64 w-64 rounded-full bg-sky-500/20 blur-3xl sm:right-[-2rem]" />
          <div className="absolute -bottom-20 left-[-5rem] h-72 w-72 rounded-full bg-blue-600/15 blur-3xl sm:left-[-2rem]" />
        </div>

        {/* Sidebar Brand info for desktop */}
        <aside className="relative hidden lg:flex lg:w-5/12 flex-col items-center justify-center border-r border-slate-200/80 dark:border-slate-800 p-8 xl:p-10 text-center bg-slate-50/50 dark:bg-slate-950/30">
          <div className="relative flex flex-col items-center space-y-5">
            <Image
              src="/erp-logo.png"
              alt="Octal ERP"
              width={120}
              height={120}
              className="h-28 w-28 rounded-2xl object-cover shadow-md border border-slate-200/80 dark:border-slate-800"
              priority
            />

            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Octal ERP
              </span>
              <p className="max-w-xs text-xs xl:text-sm text-slate-500 dark:text-slate-400">
                Course, Student, Staff, Payroll & Financial Management System
              </p>
            </div>
          </div>
        </aside>

        {/* Form Container */}
        <main className="relative flex w-full lg:w-7/12 flex-col justify-center items-center p-4 sm:p-8 md:p-10 overflow-y-auto">
          {/* Mobile Header */}
          <div className="flex flex-col items-center lg:hidden mb-4 sm:mb-6 text-center w-full max-w-sm">
            <Image
              src="/erp-logo.png"
              alt="Octal ERP"
              width={80}
              height={80}
              className="h-16 w-16 rounded-xl object-cover shadow-sm mb-2"
              priority
            />
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Octal ERP
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Academic operations, staff, payroll & finance
            </p>
          </div>

          <div className="w-full max-w-[440px] sm:max-w-[460px] mx-auto flex justify-center items-center">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
