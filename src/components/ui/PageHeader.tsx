interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-6 pb-5 border-b border-[#1e2330] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#e2e6ed] sm:text-2xl">{title}</h1>
        {description && <p className="text-[#5a6270] text-xs sm:text-sm mt-1">{description}</p>}
      </div>
      {action && <div className="mt-1 sm:mt-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
