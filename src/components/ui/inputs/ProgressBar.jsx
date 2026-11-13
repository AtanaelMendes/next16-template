import { Caption } from '@/components/ui/display/Typography';
import { useEffect, useState } from "react";
import { cn } from "@/assets/utils";

const ProgressBar = ({ id, width, value }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(value || 0);
    }, [value]);

    return (
        <>
            <Caption className={"me-2"}>Limite:</Caption>
            <div id={id} className={cn("bg-surface-muted rounded-full h-2", width || "w-50")}>
                {/* Usando `style={{ width: progress + '%' }}` para evitar erro no Tailwind */}
                <div
                    className={cn("bg-primary h-2 rounded-full transition-all duration-300")}
                    style={{ width: `${Math.min(progress, 100)}%` }} // Evita que ultrapasse 100%
                ></div>
            </div>
            <span className="text-xs ml-2 text-content-secondary">{progress}%</span>
        </>
    );
};

export default ProgressBar;