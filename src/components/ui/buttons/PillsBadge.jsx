import { cn } from "@/assets/utils";

const PILL_STYLES = {
    default: "bg-surface-muted text-content-secondary border border-border",
    primary: "bg-info-subtle text-info-subtle-content border border-info-border",
    "primary-dark": "bg-primary text-primary-content border border-primary",
    danger: "bg-danger-subtle text-danger-subtle-content border border-danger-border",
    success: "bg-success-subtle text-success-subtle-content border border-success-border",
    warning: "bg-warning-subtle text-warning-subtle-content border border-warning-border",
    "warning-dark": "bg-warning text-warning-content border border-warning",
};

/**
 * Component that renders a pill/badge element
 * @param {Object} props
 * @param {string} [props.type='default'] - Style variant: default, primary, primary-dark, danger, success, warning, warning-dark
 * @param {React.ReactNode} props.children - Content to display
 * @param {boolean} [props.small=false] - Render smaller version
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactNode}
 */
const PillsBadge = ({ type, children, small, className }) => {
    const baseClasses = cn(
        "inline-flex items-center font-medium whitespace-nowrap",
        small ? "px-1.5 py-0.5" : "px-2 py-0.5",
        "rounded-full"
    );
    const sizeClasses = small ? "text-xs" : "text-sm";

    return (
        <span className={cn(baseClasses, PILL_STYLES[type || "default"], sizeClasses, className)}>
            {children}
        </span>
    );
};

export default PillsBadge;
