"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icon, type IconName } from "@/components/icon";

/* ==========================================================================
   1. AppButton
   ========================================================================== */
export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  icon?: IconName;
  iconPosition?: "left" | "right";
}

export function AppButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  icon,
  iconPosition = "left",
  disabled,
  children,
  className = "",
  ...props
}: AppButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-all rounded-xl select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[32px]",
    md: "px-4 py-2 text-xs sm:text-sm gap-2 min-h-[40px]",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5 min-h-[46px]",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#1355FF] text-white hover:bg-[#0D47E6] focus:ring-[#1355FF]/40 shadow-xs active:bg-[#0935B3]",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 active:bg-slate-300",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-300 active:bg-slate-100",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs active:bg-rose-800",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 focus:ring-slate-200",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{loadingText || "Processando..."}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Icon name={icon} size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
          )}
          {children}
          {icon && iconPosition === "right" && (
            <Icon name={icon} size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
          )}
        </>
      )}
    </button>
  );
}

/* ==========================================================================
   2. AppInput
   ========================================================================== */
export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
}

export function AppInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  required,
  id,
  className = "",
  ...props
}: AppInputProps) {
  const inputId = id || (label ? `app-input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            <Icon name={leftIcon} size={16} />
          </span>
        )}

        <input
          id={inputId}
          required={required}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            leftIcon ? "pl-9" : ""
          } ${rightIcon ? "pr-9" : ""} ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
              : "border-slate-300 focus:border-[#1355FF] focus:ring-[#1355FF]/20"
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
            <Icon name={rightIcon} size={16} />
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
          <Icon name="alert-triangle" size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   3. AppModal
   ========================================================================== */
export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = "md",
  children,
  footer,
}: AppModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto animate-in fade-in-50 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidthStyles} rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 my-8 animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar modal"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="text-slate-700">{children}</div>

        {footer && <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. AppConfirmDialog
   ========================================================================== */
export interface AppConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function AppConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  isLoading = false,
}: AppConfirmDialogProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <AppButton variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </AppButton>
          <AppButton
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </AppButton>
        </>
      }
    >
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </AppModal>
  );
}

/* ==========================================================================
   5. AppTable
   ========================================================================== */
export interface AppTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export function AppTable({ children, className = "", containerClassName = "", ...props }: AppTableProps) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white [scrollbar-width:thin] ${containerClassName}`}
    >
      <table className={`w-full text-left text-xs sm:text-sm text-slate-700 divide-y divide-slate-100 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

/* ==========================================================================
   6. AppSkeleton
   ========================================================================== */
export interface AppSkeletonProps {
  variant?: "card" | "table" | "stat" | "feed" | "text" | "avatar";
  count?: number;
  className?: string;
}

export function AppSkeleton({ variant = "card", count = 1, className = "" }: AppSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "stat") {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
            <div className="h-7 w-16 bg-slate-200 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse ${className}`}>
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        </div>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
            <div className="h-4 w-1/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/4 bg-slate-100 rounded" />
            <div className="h-4 w-1/4 bg-slate-100 rounded" />
            <div className="h-4 w-1/6 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-4 w-28 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={`space-y-2 animate-pulse ${className}`}>
        {items.map((i) => (
          <div key={i} className="h-4 bg-slate-200 rounded w-full last:w-3/4" />
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className={`flex items-center gap-3 animate-pulse ${className}`}>
        <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-3 w-40 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Default: Card
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   7. AppEmptyState
   ========================================================================== */
export interface AppEmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  action?: {
    label: string;
    onClick: () => void;
    icon?: IconName;
  };
  className?: string;
}

export function AppEmptyState({
  title,
  description,
  icon = "inbox",
  action,
  className = "",
}: AppEmptyStateProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-3 ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon name={icon} size={24} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="pt-2">
          <AppButton variant="primary" size="sm" onClick={action.onClick} icon={action.icon}>
            {action.label}
          </AppButton>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   8. AppErrorState
   ========================================================================== */
export interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function AppErrorState({
  title = "Ocorreu um erro ao carregar os dados",
  description = "Não foi possível sincronizar as informações com o servidor. Verifique sua conexão e tente novamente.",
  onRetry,
  retryText = "Tentar novamente",
  className = "",
}: AppErrorStateProps) {
  return (
    <div className={`rounded-2xl border border-rose-200 bg-rose-50/50 p-8 sm:p-10 text-center space-y-3 ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <Icon name="alert-triangle" size={24} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-rose-900">{title}</h4>
        <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <AppButton variant="outline" size="sm" onClick={onRetry} icon="refresh" className="border-rose-300 text-rose-800 hover:bg-rose-100/60">
            {retryText}
          </AppButton>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   9. AppPagination
   ========================================================================== */
export interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  className = "",
}: AppPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-600 ${className}`}>
      <div>
        {totalItems ? (
          <span>
            Mostrando <strong>{startItem}</strong>-<strong>{endItem}</strong> de <strong>{totalItems}</strong> registros
          </span>
        ) : (
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <AppButton
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon="chevron-left"
          aria-label="Página anterior"
        />

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const hasGap = prev && p - prev > 1;

            return (
              <React.Fragment key={p}>
                {hasGap && <span className="px-1 text-slate-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    p === currentPage
                      ? "bg-[#1355FF] text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <AppButton
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          icon="chevron-right"
          aria-label="Próxima página"
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   10. AppSearch
   ========================================================================== */
export interface AppSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export function AppSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  onClear,
  className = "",
}: AppSearchProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
        <Icon name="search" size={15} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1355FF] focus:outline-none focus:ring-2 focus:ring-[#1355FF]/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            if (onClear) onClear();
          }}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 rounded-full p-0.5 hover:bg-slate-100"
          aria-label="Limpar busca"
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   11. AppFilter
   ========================================================================== */
export interface AppFilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface AppFilterProps {
  options: AppFilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function AppFilter({ options, selectedId, onSelect, className = "" }: AppFilterProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? "bg-[#1355FF] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
