import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/assets/utils';

export const CardActions = ({ children, align }) => {
    const position = {
        center: "text-center",
        right: "text-right",
        left: "text-left"
    }
    return (
        <div className={cn("inline-block w-full max-h-14 p-1 xl:p-2 border-t-2 border-border", position[(align || "left")])}>
            {children}
        </div>
    );
}

export const CardTitle = ({ children, primary, success, warning, danger, color, onClick, button }) => {
    const getColor = () => {
        if (color === 'primary' || primary) return 'bg-primary text-primary-content';
        if (color === 'success' || success) return 'bg-success text-success-content';
        if (color === 'warning' || warning) return 'bg-warning text-warning-content';
        if (color === 'danger' || danger) return 'bg-danger text-danger-content';
        return 'text-content-secondary';
    }

    const handleClick = () => {
        if (typeof onClick === "function") {
            onClick();
        }
    };

    return (
        <div className={cn(`mb-2 text-lg xl:text-xl font-bold tracking-tight w-full p-1 xl:p-2 border-b-2 border-border relative rounded-t-lg h-fit`, getColor())}>
            {button && <div className='float-right z-10 rounded-full p-1 hover:bg-hover cursor-pointer drop-shadow' onClick={handleClick}>
                <FontAwesomeIcon icon={faEllipsisVertical} width="20" height="20" />
            </div>}
            <span className='drop-shadow'>
                {children}
            </span>
        </div>
    );
}

export const CardBody = ({ children }) => {
    return (
        <div className="flex flex-col w-full text-content-secondary p-1 xl:p-2">
            {children}
        </div>
    );
}

export const CardImage = ({ src, alt, height, title, button, onClick }) => {
    const handleClick = () => {
        if (typeof onClick === "function") {
            onClick();
        }
    };
    return (
        <div className="relative w-full overflow-hidden" style={{ height: (height ? height + "px" : "200px") }}>
            {title && (
                <div className='absolute top-2 left-2 z-10 px-3 py-1.5 text-sm font-semibold text-white bg-slate-900/80 backdrop-blur-sm rounded-md shadow'>
                    {title}
                </div>
            )}

            {button && (
                <div
                    className='absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900/90 cursor-pointer shadow transition-colors'
                    onClick={handleClick}
                >
                    <FontAwesomeIcon icon={faEllipsisVertical} width="16" height="16" className="text-white" />
                </div>
            )}

            <Image
                src={src || "/images/defult-no-image.png"}
                alt={alt || "imagem"}
                fill
                className="object-cover"
            />
        </div>
    );
}

const Card = ({ children, width, className }) => {
    return (
        <div className={cn(`flex flex-row flex-wrap bg-surface border border-border rounded-lg shadow`, width || "w-full", className )}>
            {children}
        </div>
    );
}

export default Card;
