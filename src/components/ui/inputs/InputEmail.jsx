import { cn } from '@/assets/utils'
import { FieldLabel } from '@/components/ui/display/Typography'
import { TooltipComponent } from '@/components/ui/overlays/TooltipComponent'
import { faAsterisk, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const InputEmail = ({
    id,
    name,
    label,
    hint,
    helperText,
    error,
    required = false,
    small = false,
    large = false,
    className,
    containerClassName,
    ...inputProps
}) => {
    const helperTextId = helperText && id ? `${id}-helper` : undefined
    const errorId = error && id ? `${id}-error` : undefined
    const describedBy = [inputProps['aria-describedby'], helperTextId, errorId].filter(Boolean).join(' ') || undefined

    return (
        <div className={cn('relative w-full', containerClassName)}>
            {label && (
                <div className='flex absolute -top-2.25 left-2 w-fit z-10 text-xs px-0.5 rounded-md text-nowrap before:bg-white before:top-0.5 before:left-0 before:absolute before:w-full before:h-3 before:-z-10 before:content-[""] before:rounded-lg'>
                    <label htmlFor={id}>
                        <FieldLabel className={cn(required ? 'ml-4' : 'ml-0', 'mb-0 pb-0 text-gray-500')}>{label}</FieldLabel>
                    </label>
                    {required && <FontAwesomeIcon icon={faAsterisk} width='10' height='10' color='red' className='self-start absolute' />}
                    {hint && (
                        <TooltipComponent content={hint} asChild>
                            <FontAwesomeIcon icon={faInfoCircle} width='16' height='16' color='blue' className='self-start ml-2' tabIndex={-1} />
                        </TooltipComponent>
                    )}
                </div>
            )}

            <input
                {...inputProps}
                id={id}
                name={name || id}
                type='email'
                required={required}
                aria-invalid={inputProps['aria-invalid'] ?? Boolean(error)}
                aria-describedby={describedBy}
                className={cn(
                    'block w-full rounded-lg border text-gray-900 focus:ring-blue-500 focus:border-blue-500',
                    small ? 'p-1.5 text-xs' : large ? 'p-3 text-base' : 'p-2 text-sm',
                    error ? 'border-red-500' : 'border-gray-300',
                    className
                )}
            />

            {error && <div id={errorId} className='text-xs text-red-600'>{error === true ? 'E-mail inválido' : error}</div>}
            {helperText && <div id={helperTextId} className='text-xs text-blue-600'>{helperText}</div>}
        </div>
    )
}

export default InputEmail
