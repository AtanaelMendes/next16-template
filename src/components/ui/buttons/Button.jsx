import { cn } from '@/assets/utils';
import React from 'react';

const outlineFocus = 'focus-visible:ring-focus';

const btnType = (outline, bordered, buttonType) => {
	const variants = {
		primary: cn(
			outline
				? 'text-primary-text border-primary hover:bg-primary/10'
				: 'bg-primary text-primary-content hover:bg-primary-hover',
			bordered && 'border border-primary',
			outlineFocus
		),
		secondary: cn(
			outline
				? 'text-content-secondary border-border hover:bg-hover hover:text-content'
				: 'bg-surface-secondary text-content border border-border hover:bg-hover',
			bordered && 'border border-border',
			outlineFocus
		),
		success: cn(
			outline
				? 'text-success border-success hover:bg-success/10'
				: 'bg-success text-success-content hover:bg-success-hover',
			bordered && 'border border-success',
			'focus-visible:ring-success'
		),
		danger: cn(
			outline
				? 'text-danger-text border-danger hover:bg-danger hover:text-danger-content'
				: 'bg-danger text-danger-content hover:bg-danger-hover',
			bordered && 'border border-danger',
			'focus-visible:ring-danger'
		),
		warning: cn(
			outline
				? 'text-warning border-warning hover:bg-warning/15'
				: 'bg-warning text-warning-content hover:bg-warning-hover',
			bordered && 'border border-warning',
			'focus-visible:ring-warning'
		),
		ghost: cn(
			'text-content hover:bg-hover',
			outline && 'text-content-secondary',
			bordered && 'border border-border',
			outlineFocus
		),
	};

	return variants[buttonType] || variants.secondary;
}

export const generateButtonClass = (
	buttonType,
	pill,
	square,
	size,
	block,
	outline,
	bordered,
	disabled
) => {
	const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background';
	const shapeClasses = square ? '' : pill ? 'rounded-full' : 'rounded';
	const sizeClasses = size === 'small' ? 'py-1 px-2' : 'py-2 px-4';
	const blockClasses = block ? 'w-full' : 'w-fit';
	const styleType = buttonType ? btnType(outline, bordered, buttonType) : '';
	const disabledClasses = disabled
		? 'opacity-70 cursor-not-allowed bg-disabled text-disabled-content border-border hover:bg-disabled hover:text-disabled-content'
		: '';
	return cn(baseClasses, shapeClasses, sizeClasses, blockClasses, styleType, disabledClasses);
}

/**
 * Componente Button renderiza um elemento de botão personalizável.
 *
 * @param {Object} props - O objeto de propriedades.
 * @param {string} props.buttonType - O tipo do botão (por exemplo, primary, secondary).
 * @param {string} [props.size="medium"] - O tamanho do botão (por exemplo, small, medium, large).
 * @param {string} [props.type="button"] - O atributo HTML type para o botão.
 * @param {boolean} [props.pill=false] - Se verdadeiro, o botão terá cantos arredondados.
 * @param {boolean} [props.square] - Se verdadeiro, o botão será quadrado.
 * @param {function} [props.onClick=null] - A função de manipulador de evento de clique.
 * @param {React.ReactNode} props.children - O conteúdo a ser exibido dentro do botão.
 * @param {boolean} [props.block=false] - Se verdadeiro, o botão será exibido como um elemento de bloco.
 * @param {boolean} [props.outline=false] - Se verdadeiro, o botão terá um estilo de contorno.
 * @param {boolean} [props.bordered=false] - Se verdadeiro, o botão terá uma borda.
 * @param {string} [props.className=""] - Classes CSS adicionais para aplicar ao botão.
 * @param {boolean} [props.disabled=false] - Se verdadeiro, o botão será desativado.
 * @param {string} [props.title=""] - O atributo title para o botão.
 *
 * @version 1.3.0
 * @returns {JSX.Element} O elemento de botão renderizado.
 */
const Button = ({
	buttonType,
	size = 'medium',
	type = 'button',
	pill = false,
	square,
	onClick = null,
	children,
	block = false,
	outline = false,
	bordered = false,
	className = '',
	disabled = false,
	title = '',
}) => {
	const	handleClick = (evt) => {
		if (type === 'button' && evt) {
			evt.stopPropagation();
		}
		onClick && onClick();
	}

	return (
		<button
			type={type}
			className={cn(
				generateButtonClass(buttonType, pill, square, size, block, outline, bordered, disabled),
				className
			)}
			onClick={handleClick.bind(null, this)}
			disabled={disabled}
			title={title}
		>
			{children}
		</button>
	)
}

export default Button
