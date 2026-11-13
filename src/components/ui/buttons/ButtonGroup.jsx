import { cn } from "@/assets/utils";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";

const ButtonGroup = ({ buttons, small, className, vertical }) => {
	const handleClick = (callback) => {
		if (typeof callback === "function") {
			callback();
		}
	};

	const renderButtons = () => {
		return buttons?.map((btn, index) => {
			return (
				<div
					key={`${btn.id}_${index + 1}`}
					id={`${btn.id}_${index + 1}`}
					className={`${className} ${btn?.className}`}
				>
					<TooltipComponent
						content={
							<span className="font-semibold">{`${
								btn.tooltip || ""
							}`}</span>
						}
						asChild
					>
						<button
							type="button"
							onClick={() => handleClick(btn?.onclick)}
							disabled={btn.disabled}
							className={cn(
								"text-sm font-medium bg-surface text-content border border-border",
								"hover:bg-hover hover:text-primary-text",
								"focus:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background",
								"disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-disabled disabled:text-disabled-content disabled:border-border disabled:hover:bg-disabled disabled:hover:text-disabled-content",
								small ? " px-2 py-1 " : "px-4 py-2",
								btn.className
							)}
						>
							{btn.label}
						</button>
					</TooltipComponent>
				</div>
			);
		});
	};

	return (
		<div className={`flex ${vertical ? "flex-col" : "flex-row"}`}>
			{renderButtons()}
		</div>
	);
};

export default ButtonGroup;
