export const TooltipComponent = ({
    children,
    content,
    side = "top",
}) => {
    const sideClasses = {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2",
        left: "right-full mr-2",
        right: "left-full ml-2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 -translate-y-1",
        bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-1",
        left: "left-full top-1/2 -translate-y-1/2 translate-x-1",
        right: "right-full top-1/2 -translate-y-1/2 -translate-x-1",
    };

    return (
        <div className="relative inline-block group">
            {children}
            <div
                role="tooltip"
                className={`absolute ${sideClasses[side]} left-1/2 -translate-x-1/2 hidden group-hover:block group-focus-within:block z-50 bg-surface-elevated text-content text-xs rounded border border-border px-3 py-1.5 whitespace-nowrap shadow-lg pointer-events-none`}
            >
                {content}
                <div className={`absolute w-2 h-2 bg-surface-elevated border border-border ${arrowClasses[side] || arrowClasses.top}`} />
            </div>
        </div>
    );
};
