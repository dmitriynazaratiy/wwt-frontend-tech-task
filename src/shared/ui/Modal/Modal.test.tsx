import { useState } from 'react'

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Initialize real translations for component tests.
// Required side effect: keep this import even though it binds no values.
import '@shared/i18n'

import { Modal, ModalProps } from './Modal'
import { ModalApplyButton, ModalCancelButton } from './ModalActionButtons'

const getRoots = () =>
	Array.from(document.body.querySelectorAll<HTMLElement>('.modal-root'))

const getBackdrop = (root: HTMLElement) => root.firstElementChild as HTMLElement

const getPositioner = (root: HTMLElement) =>
	root.querySelector<HTMLElement>('[data-scroll]') as HTMLElement

const Harness = () => {
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<button
				aria-label="Open"
				onClick={() => setIsOpen(true)}
			/>
			<Modal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title="Single"
				closeLabel="Close single"
			>
				<input aria-label="Field" />
			</Modal>
		</>
	)
}

describe('Modal', () => {
	it('appends its root to the end of body while open and removes it on close', async () => {
		const { rerender } = render(
			<Modal
				isOpen
				onClose={() => {}}
				title="First"
				closeLabel="Close first"
			>
				<input aria-label="Field" />
			</Modal>
		)

		expect(getRoots()).toHaveLength(1)
		expect(document.body.lastElementChild).toBe(getRoots()[0])
		expect(screen.getByRole('dialog', { name: 'First' })).toBeInTheDocument()

		rerender(
			<Modal
				isOpen={false}
				onClose={() => {}}
				title="First"
				closeLabel="Close first"
			>
				<input aria-label="Field" />
			</Modal>
		)

		await waitFor(() => expect(getRoots()).toHaveLength(0))
	})

	it('removes its root immediately when the parent unmounts', () => {
		const { unmount } = render(
			<Modal
				isOpen
				onClose={() => {}}
				title="First"
				closeLabel="Close first"
			>
				<input aria-label="Field" />
			</Modal>
		)

		unmount()

		expect(getRoots()).toHaveLength(0)
		expect(document.body.style.overflow).toBe('')
	})

	it('lets only the top modal react to Escape and backdrop clicks', () => {
		const onCloseFirst = vi.fn()
		const onCloseSecond = vi.fn()
		render(
			<>
				<Modal
					isOpen
					onClose={onCloseFirst}
					title="First"
					closeLabel="Close first"
				>
					<input aria-label="First field" />
				</Modal>
				<Modal
					isOpen
					onClose={onCloseSecond}
					title="Second"
					closeLabel="Close second"
				>
					<input aria-label="Second field" />
				</Modal>
			</>
		)
		const [first, second] = getRoots()

		expect(first.dataset.top).toBe('false')
		expect(second.dataset.top).toBe('true')
		expect(first.style.getPropertyValue('--modal-layer')).toBe('0')
		expect(second.style.getPropertyValue('--modal-layer')).toBe('1')
		expect(second.dataset.backdropMotion).toBe('false')
		expect(screen.getByRole('dialog', { name: 'Second' })).toHaveAttribute(
			'aria-modal',
			'true'
		)

		fireEvent.keyDown(document, { key: 'Escape' })
		fireEvent.click(getBackdrop(first))

		expect(onCloseFirst).not.toHaveBeenCalled()
		expect(onCloseSecond).toHaveBeenCalledTimes(1)

		fireEvent.click(getBackdrop(second))

		expect(onCloseSecond).toHaveBeenCalledTimes(2)
	})

	it('scrolls the content by default and renders the footer after it', () => {
		render(
			<Modal
				isOpen
				onClose={() => {}}
				title="First"
				closeLabel="Close first"
				footer={<button aria-label="Apply" />}
			>
				<input aria-label="Field" />
			</Modal>
		)
		const [root] = getRoots()
		const footer = screen.getByRole('contentinfo')

		expect(getPositioner(root).dataset.scroll).toBe('content')
		expect(footer).toContainElement(
			screen.getByRole('button', { name: 'Apply' })
		)
		expect(
			screen
				.getByRole('textbox', { name: 'Field' })
				.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
	})

	it('closes from the empty overlay area only when the press starts there', () => {
		const onClose = vi.fn()
		render(
			<Modal
				isOpen
				onClose={onClose}
				title="First"
				closeLabel="Close first"
				scroll="overlay"
			>
				<input aria-label="Field" />
			</Modal>
		)
		const positioner = getPositioner(getRoots()[0])

		expect(positioner.dataset.scroll).toBe('overlay')

		// A press that starts inside the panel, e.g. a text selection dragged out.
		fireEvent.pointerDown(screen.getByRole('textbox', { name: 'Field' }))
		fireEvent.click(positioner)
		expect(onClose).not.toHaveBeenCalled()

		fireEvent.pointerDown(positioner)
		fireEvent.click(positioner)
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('moves focus inside, traps Tab and returns focus to the opener', async () => {
		render(<Harness />)
		const opener = screen.getByRole('button', { name: 'Open' })
		opener.focus()
		fireEvent.click(opener)

		const closeButton = screen.getByRole('button', { name: 'Close single' })
		// The default footer's Apply button is the last focusable element.
		const applyButton = screen.getByRole('button', { name: 'Apply' })
		expect(closeButton).toHaveFocus()

		applyButton.focus()
		fireEvent.keyDown(document, { key: 'Tab' })
		expect(closeButton).toHaveFocus()

		fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
		expect(applyButton).toHaveFocus()

		fireEvent.keyDown(document, { key: 'Escape' })

		expect(opener).toHaveFocus()
		await waitFor(() => expect(getRoots()).toHaveLength(0))
	})

	it('keeps its root until the exit animation finishes and reuses it when reopened', async () => {
		let finish = () => {}
		const finished = new Promise<void>(resolve => {
			finish = resolve
		})
		// jsdom has no Web Animations API, so stub a pending exit animation.
		const getAnimations = vi.fn(() => [{ finished } as unknown as Animation])
		HTMLElement.prototype.getAnimations = getAnimations
		const renderModal = (isOpen: boolean) => (
			<Modal
				isOpen={isOpen}
				onClose={() => {}}
				title="First"
				closeLabel="Close first"
			>
				<input aria-label="Field" />
			</Modal>
		)

		const { rerender } = render(renderModal(true))
		const [root] = getRoots()

		rerender(renderModal(false))
		expect(getRoots()).toEqual([root])
		expect(root.inert).toBe(true)
		expect(document.body.style.overflow).toBe('')

		rerender(renderModal(true))
		await act(async () => finish())

		expect(getRoots()).toEqual([root])
		expect(root.inert).toBe(false)
		expect(screen.getByRole('dialog', { name: 'First' })).toHaveAttribute(
			'data-state',
			'open'
		)

		getAnimations.mockReturnValue([])
		rerender(renderModal(false))

		await waitFor(() => expect(getRoots()).toHaveLength(0))
		delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations
	})
})

describe('Modal footer', () => {
	const renderModal = (props: Partial<ModalProps> = {}) => {
		const onClose = vi.fn()
		render(
			<Modal
				isOpen
				onClose={onClose}
				title="First"
				{...props}
			>
				<input aria-label="Field" />
			</Modal>
		)
		return onClose
	}

	it('renders Cancel and Apply by default, calling their callbacks before closing', () => {
		const onCancel = vi.fn()
		const onApply = vi.fn()
		const onClose = renderModal({ onCancel, onApply })

		expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
			'data-size',
			'responsive'
		)

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onClose).toHaveBeenCalledTimes(1)

		fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
		expect(onApply).toHaveBeenCalledTimes(1)
		expect(onClose).toHaveBeenCalledTimes(2)
		expect(onCancel.mock.invocationCallOrder[0]).toBeLessThan(
			onClose.mock.invocationCallOrder[0]
		)
	})

	it.each([null, false])('renders no footer for %s', footer => {
		renderModal({ footer })

		expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Apply' })
		).not.toBeInTheDocument()
	})

	it('stays open when the handler returns false', () => {
		const onClose = renderModal({ onApply: () => false })

		fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

		expect(onClose).not.toHaveBeenCalled()
	})

	it('shows the loading state for a promise and closes once it resolves', async () => {
		let resolve = () => {}
		const onClose = renderModal({
			onApply: () =>
				new Promise<void>(done => {
					resolve = done
				})
		})
		const apply = screen.getByRole('button', { name: 'Apply' })

		fireEvent.click(apply)

		expect(apply).toHaveAttribute('aria-busy', 'true')
		expect(apply).toBeDisabled()
		expect(onClose).not.toHaveBeenCalled()

		await act(async () => resolve())

		expect(onClose).toHaveBeenCalledTimes(1)
		expect(apply).not.toHaveAttribute('aria-busy')
	})

	it('composes a custom footer from the default buttons and extra elements', () => {
		const onApply = vi.fn()
		const onOwnApply = vi.fn()
		const saveLabel = 'Save'
		const onClose = renderModal({
			onApply,
			applyLabel: 'Apply all',
			footer: (
				<>
					<button aria-label="Reset" />
					<ModalApplyButton />
					<ModalApplyButton onClick={onOwnApply}>{saveLabel}</ModalApplyButton>
				</>
			)
		})
		const footer = screen.getByRole('contentinfo')

		expect(footer).toContainElement(
			screen.getByRole('button', { name: 'Reset' })
		)
		expect(
			screen.queryByRole('button', { name: 'Cancel' })
		).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		expect(onOwnApply).toHaveBeenCalledTimes(1)
		expect(onApply).not.toHaveBeenCalled()
		expect(onClose).toHaveBeenCalledTimes(1)

		fireEvent.click(screen.getByRole('button', { name: 'Apply all' }))
		expect(onApply).toHaveBeenCalledTimes(1)
	})

	it('refuses to render an action button outside a modal', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

		expect(() => render(<ModalCancelButton />)).toThrow(
			'Modal action buttons must be rendered inside a Modal'
		)

		consoleError.mockRestore()
	})
})
