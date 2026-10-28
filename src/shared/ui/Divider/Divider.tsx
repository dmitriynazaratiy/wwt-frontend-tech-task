// Kept apart from the className interpolation: Tailwind only detects
// classes that are not glued to a `${...}` expression.
const dividerClassName = 'border-t-2 border-grey-200'

/**
 * Figma 2px #B4B4B4 divider. Drawn as a border, not a filled box: browsers
 * snap border widths to whole screen pixels, so every divider keeps the same
 * thickness at any zoom or display scaling.
 */
export const Divider = ({ className }: { className?: string }) => (
	<hr className={`${dividerClassName}${className ? ` ${className}` : ''}`} />
)
