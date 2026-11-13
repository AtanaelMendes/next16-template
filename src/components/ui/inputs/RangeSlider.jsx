import { cn } from '@/assets/utils'
import { FieldLabel } from '@/components/ui/display/Typography'

const RangeSlider = ({
	value,
	label,
	disabled,
	onChange,
	onClick,
	id,
	enableMinMax,
	min = 10,
	max = 40,
	step = 10,
	renderMinMax,
	className,
	required
}) => {
	const handleChange = evt => {
		onChange(id, evt.target.value)
	}

	const handleClick = val => {
		onClick(id, val)
	}

	const defaultRenderMinMax = () => {
		return Array.from({ length: (max - min) / step + 1 }).map((_, index) => {
			return (
				<span
					key={index}
					className={cn(
						'text-sm font-medium text-content -bottom-6 inset-s-0',
						disabled ? 'cursor-not-allowed text-disabled-content' : 'cursor-pointer'
					)}
					onClick={() => {
						onClick && !disabled && handleClick(10 + index * step)
					}}
				>
					{10 + index * step}%
				</span>
			)
		})
	}

	return (
		<div className={cn('w-full relative', className)}>
			{label && (
				<div className='flex absolute -top-2.25 left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-3 before:-z-10 before:content-[""] before:rounded-lg'>
					<FieldLabel className={cn(required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
						{label}
					</FieldLabel>
				</div>
			)}
			<div className='relative w-full border border-input-border bg-input rounded-lg p-2'>
				<input
					id={id}
					min={min}
					max={max}
					step={step}
					type='range'
					value={value}
					disabled={disabled}
					onChange={onChange && handleChange}
					className={cn(
						'w-full h-2 bg-surface-muted accent-primary rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
						disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
					)}
				/>
				<div className='flex flex-row justify-between'>
					{enableMinMax && (renderMinMax ? renderMinMax : defaultRenderMinMax())}
				</div>
			</div>
		</div>
	)
}

export default RangeSlider
