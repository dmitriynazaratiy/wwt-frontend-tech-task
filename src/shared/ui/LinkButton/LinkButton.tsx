import { ButtonHTMLAttributes } from 'react'

// Kept apart from the className interpolation: Tailwind only detects
// classes that are not glued to a `${...}` expression.
const linkClassName =
	'link-underline cursor-pointer rounded-sm text-link-2 whitespace-nowrap text-primary-100 hover:text-grey-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-500 active:text-grey-500'

/**
 * Figma "Text (hyperlink)" (`7458:57528`) for actions: looks like a link but
 * is a button, because it acts on the page instead of navigating.
 */
export const LinkButton = ({
	type = 'button',
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		{...props}
		type={type}
		className={`${linkClassName}${className ? ` ${className}` : ''}`}
	/>
)
