import { fireEvent, render, screen } from '@testing-library/react'

import { Checkbox } from './Checkbox'

const label = 'Breakfast'
const description = 'Served every morning'

describe('Checkbox', () => {
	it('toggles when its label is clicked', () => {
		render(<Checkbox label={label} />)

		fireEvent.click(screen.getByText(label))

		expect(screen.getByRole('checkbox', { name: label })).toBeChecked()
	})

	it('exposes the description as a tooltip and to screen readers', () => {
		render(
			<Checkbox
				label={label}
				description={description}
			/>
		)
		const checkbox = screen.getByRole('checkbox', { name: label })

		expect(checkbox).toHaveAccessibleDescription(description)
		expect(checkbox.closest('label')).toHaveAttribute('title', description)
	})
})
