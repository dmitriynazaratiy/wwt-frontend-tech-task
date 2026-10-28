import { createContext, useContext } from 'react'

/**
 * Runs before the modal closes. Return `false` to keep it open. Return a
 * promise to show the loading state; the modal closes once it resolves to
 * anything but `false`, and stays open if it rejects.
 */
export type ModalActionHandler = () => unknown

export interface ModalActions {
	onClose: () => void
	onApply?: ModalActionHandler
	onCancel?: ModalActionHandler
	applyLabel?: string
	cancelLabel?: string
}

export const ModalActionsContext = createContext<ModalActions | null>(null)

export const useModalActions = () => {
	const actions = useContext(ModalActionsContext)
	if (!actions) {
		throw new Error('Modal action buttons must be rendered inside a Modal')
	}
	return actions
}
