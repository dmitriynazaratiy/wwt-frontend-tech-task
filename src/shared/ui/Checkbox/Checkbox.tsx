import { InputHTMLAttributes, ReactNode, useId } from 'react'

import checkboxCheckedDisabledIconUrl from '@/shared/assets/icons/checkbox-checked-disabled.svg?url'
import checkboxCheckedIconUrl from '@/shared/assets/icons/checkbox-checked.svg?url'
import checkboxHoverIconUrl from '@/shared/assets/icons/checkbox-hover.svg?url'
import checkboxIconUrl from '@/shared/assets/icons/checkbox.svg?url'

export interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
	/** Text next to the box. Clicking it toggles the checkbox. */
	label: ReactNode
	/**
	 * Longer explanation, shown as a native browser tooltip on hover and read
	 * by screen readers through `aria-describedby`.
	 */
	description?: string
}

// Kept apart from the className interpolation: Tailwind only detects
// classes that are not glued to a `${...}` expression.
const labelClassName =
	'group inline-flex cursor-pointer items-center gap-4 text-body-6 text-grey-500 has-disabled:cursor-not-allowed'

// The Figma state icons use internal ids (masks), so they are rendered as
// images: ids inside an image cannot clash between checkboxes on one page.
const iconClassName =
	'col-start-1 row-start-1 size-6 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grey-500'

/**
 * Figma checkbox (`6927:6869`) with its label: a native checkbox input, so
 * keyboard, form and screen reader behaviour come from the browser.
 */
export const Checkbox = ({
	label,
	description,
	className,
	id,
	...props
}: CheckboxProps) => {
	const generatedId = useId()
	const descriptionId = `${id ?? generatedId}-description`
	// The description sits outside the label so it does not become part of
	// the checkbox's accessible name; sr-only keeps it out of the layout.
	return (
		<>
			<label
				title={description}
				className={`${labelClassName}${className ? ` ${className}` : ''}`}
			>
				<span className="grid shrink-0">
					<input
						{...props}
						id={id}
						type="checkbox"
						aria-describedby={description ? descriptionId : undefined}
						className="peer sr-only"
					/>
					<img
						src={checkboxIconUrl}
						alt=""
						className={`${iconClassName} group-hover:hidden peer-checked:hidden`}
					/>
					<img
						src={checkboxHoverIconUrl}
						alt=""
						className={`${iconClassName} hidden group-hover:block peer-checked:hidden peer-disabled:hidden`}
					/>
					<img
						src={checkboxCheckedIconUrl}
						alt=""
						className={`${iconClassName} hidden peer-checked:block peer-disabled:hidden`}
					/>
					<img
						src={checkboxCheckedDisabledIconUrl}
						alt=""
						className={`${iconClassName} hidden peer-checked:peer-disabled:block`}
					/>
				</span>
				<span>{label}</span>
			</label>
			{description && (
				<span
					id={descriptionId}
					className="sr-only"
				>
					{description}
				</span>
			)}
		</>
	)
}
