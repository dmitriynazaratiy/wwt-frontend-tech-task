import { ButtonHTMLAttributes } from 'react'

import LoadingDarkIcon from '@assets/icons/loading-dark.svg'
import LoadingLightIcon from '@assets/icons/loading-light.svg'

export type ButtonVariant = 'primary' | 'outline'

/**
 * `lg`: 64px desktop. `md` and `sm`: 48px and 40px phone buttons.
 * `responsive`: `md` below the md breakpoint, `lg` from it.
 * Figma has no 40px grey outline; `sm` outline reuses the 48px colours.
 */
export type ButtonSize = 'lg' | 'md' | 'sm' | 'responsive'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
	/** Shows the spinner and blocks clicks without switching to the disabled look. */
	isLoading?: boolean
}

const baseClassName = [
	'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2',
	'text-button whitespace-nowrap',
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-500',
	'state-disabled:cursor-not-allowed state-loading:cursor-wait'
].join(' ')

// Paddings are the --spacing-button-* tokens in main.css.
const desktopSize = 'h-16'
const phoneSize = 'px-button-phone state-loading:px-button-phone-loading'

// Figma desktop "Button - Apply" and phone "Big/Small Phone Button - Primary".
// Colours match across sizes; phones have no hover state.
const primary = {
	colors: [
		'border-brand-200 bg-brand-200 text-white',
		'state-idle:active:border-brand-300 state-idle:active:bg-brand-300',
		'state-disabled:border-grey-100 state-disabled:bg-grey-100 state-disabled:text-grey-300'
	].join(' '),
	desktop:
		'px-button-primary state-loading:px-button-primary-loading state-idle:hover:border-brand-100 state-idle:hover:bg-brand-100',
	responsiveDesktop:
		'md:px-button-primary md:state-loading:px-button-primary-loading md:state-idle:hover:border-brand-100 md:state-idle:hover:bg-brand-100'
}

// Figma desktop "Big Desktop Button (Cancel)" and phone "Big Phone Button -
// Outline (48 px)". The phone set presses to #FF5F00 and keeps the light grey
// border when disabled or loading; desktop presses to #FF3D00 and darkens it.
const outline = {
	colors: [
		'border-grey-200 bg-white text-grey-400',
		'state-idle:active:text-white',
		'state-disabled:bg-grey-100 state-disabled:text-grey-300'
	].join(' '),
	phone: 'state-idle:active:border-brand-200 state-idle:active:bg-brand-200',
	desktop: [
		'px-button-outline state-loading:px-button-outline-loading state-idle:hover:bg-grey-100',
		'state-idle:active:border-brand-300 state-idle:active:bg-brand-300',
		'state-disabled:border-grey-300 state-loading:border-grey-400'
	].join(' '),
	responsiveDesktop: [
		'md:px-button-outline md:state-loading:px-button-outline-loading md:state-idle:hover:bg-grey-100',
		'md:state-idle:active:border-brand-300 md:state-idle:active:bg-brand-300',
		'md:state-disabled:border-grey-300 md:state-loading:border-grey-400'
	].join(' ')
}

const variantClassNames: Record<ButtonVariant, Record<ButtonSize, string>> = {
	primary: {
		lg: `${desktopSize} ${primary.colors} ${primary.desktop}`,
		md: `h-12 ${phoneSize} ${primary.colors}`,
		sm: `h-10 ${phoneSize} ${primary.colors}`,
		responsive: `h-12 md:h-16 ${phoneSize} ${primary.colors} ${primary.responsiveDesktop}`
	},
	outline: {
		lg: `${desktopSize} ${outline.colors} ${outline.desktop}`,
		md: `h-12 ${phoneSize} ${outline.colors} ${outline.phone}`,
		sm: `h-10 ${phoneSize} ${outline.colors} ${outline.phone}`,
		responsive: `h-12 md:h-16 ${phoneSize} ${outline.colors} ${outline.phone} ${outline.responsiveDesktop}`
	}
}

const spinners: Record<ButtonVariant, typeof LoadingLightIcon> = {
	primary: LoadingLightIcon,
	outline: LoadingDarkIcon
}

/** `className` is meant for layout such as width; colours come from `variant`. */
export const Button = ({
	variant = 'primary',
	size = 'lg',
	isLoading = false,
	disabled,
	type = 'button',
	className,
	children,
	...props
}: ButtonProps) => {
	const state = disabled ? 'disabled' : isLoading ? 'loading' : 'idle'
	const Spinner = spinners[variant]
	return (
		<button
			{...props}
			type={type}
			disabled={disabled || isLoading}
			aria-busy={isLoading || undefined}
			data-state={state}
			data-size={size}
			className={`${baseClassName} ${variantClassNames[variant][size]}${className ? ` ${className}` : ''}`}
		>
			{state === 'loading' && (
				<Spinner
					aria-hidden="true"
					className="shrink-0 motion-safe:animate-spin"
				/>
			)}
			<span className="text-trim">{children}</span>
		</button>
	)
}
