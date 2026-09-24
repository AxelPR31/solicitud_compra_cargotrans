"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
}

export function Header({ title, subtitle, breadcrumb }: HeaderProps) {
  return (
    <header className="border-b border-border/50 pb-4 pt-1 sm:pb-5">
      <div className="min-w-0">
        {breadcrumb && (
          <p className="truncate text-xs font-medium text-brand-light sm:text-sm">{breadcrumb}</p>
        )}
        {!breadcrumb && subtitle && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
            {subtitle}
          </p>
        )}
        <h1 className="mt-0.5 truncate font-serif text-xl font-normal text-brand sm:text-2xl lg:text-3xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
