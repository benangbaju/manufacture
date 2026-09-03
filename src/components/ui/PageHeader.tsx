import ThemeToggle from "./ThemeToggle";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showThemeToggle?: boolean;
}

export default function PageHeader({ 
  title, 
  description, 
  action, 
  showThemeToggle = true 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3.5 mb-6 pb-4 sm:pb-5 border-b border-[#1e2330] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start justify-between sm:block gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#e2e6ed] break-words leading-snug">{title}</h1>
          {description && <p className="text-[#5a6270] text-xs sm:text-sm mt-1 break-words leading-relaxed">{description}</p>}
        </div>
        {/* Mobile Theme Toggle */}
        {showThemeToggle && (
          <div className="sm:hidden pl-2 shrink-0">
            <ThemeToggle variant="compact" />
          </div>
        )}
      </div>

      <div className="mt-1 sm:mt-0 flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        {action}
        {/* Desktop Theme Toggle if no custom action or alongside action */}
        {showThemeToggle && (
          <div className="hidden sm:block">
            <ThemeToggle variant="compact" />
          </div>
        )}
      </div>
    </div>
  );
}

