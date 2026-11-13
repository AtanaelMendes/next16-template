const Blockquote = ({ children, type, className, size }) => {
    const blockType = {
        danger: " border-danger bg-danger-subtle text-danger-subtle-content",
        success: " border-success bg-success-subtle text-success-subtle-content",
        warning: " border-warning bg-warning-subtle text-warning-subtle-content",
        primary: " border-primary bg-info-subtle text-info-subtle-content",
        default: " border-border bg-surface-muted text-content-secondary"
    }

    const blockSize = {
        xs: 'p-1 text-xs',
        sm: 'p-2 text-sm',
        md: 'py-4 px-2 text-base',
        lg: 'py-5 px-2 text-lg'
    }
    return (
        <div className={`rounded text-wrap break-words border-l-4 ${blockSize[size || "sm"]} ${blockType[type || "default"]} ${className}`}>
            {children}
        </div>
    );
}
export default Blockquote;
