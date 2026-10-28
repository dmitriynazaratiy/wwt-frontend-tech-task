import { fireEvent, render, screen } from '@testing-library/react'

import { Button } from './Button'

const applyLabel = 'Apply'
const cancelLabel = 'Cancel'

describe('Button', () => {
	it('is a non-submitting button by default', () => {
		render(<Button>{applyLabel}</Button>)

		const button = screen.getByRole('button', { name: 'Apply' })
		expect(button).toHaveAttribute('type', 'button')
		expect(button).toHaveAttribute('data-state', 'idle')
		expect(button).toHaveAttribute('data-size', 'lg')
	})

	it.each(['md', 'sm', 'responsive'] as const)('renders the %s size', size => {
		render(<Button size={size}>{applyLabel}</Button>)

		expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute(
			'data-size',
			size
		)
	})

	it('blocks clicks while loading without the disabled look', () => {
		const onClick = vi.fn()
		render(
			<Button
				isLoading
				onClick={onClick}
			>
				{applyLabel}
			</Button>
		)
		const button = screen.getByRole('button', { name: 'Apply' })

		fireEvent.click(button)

		expect(onClick).not.toHaveBeenCalled()
		expect(button).toBeDisabled()
		expect(button).toHaveAttribute('aria-busy', 'true')
		expect(button).toHaveAttribute('data-state', 'loading')
	})

	it('prefers the disabled state over loading', () => {
		render(
			<Button
				variant="outline"
				isLoading
				disabled
			>
				{cancelLabel}
			</Button>
		)

		expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
			'data-state',
			'disabled'
		)
	})
})
