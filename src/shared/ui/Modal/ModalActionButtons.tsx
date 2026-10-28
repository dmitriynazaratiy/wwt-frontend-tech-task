import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, ButtonProps } from '../Button'
import { ModalActionHandler, useModalActions } from './modalActions'

/** Props of `ModalCancelButton` and `ModalApplyButton`. */
export interface ModalActionButtonProps
	extends Omit<ButtonProps, 'onClick' | 'variant'> {
	/**
	 * Replaces the modal's `onCancel` or `onApply` for this button only, with
	 * the same contract: return `false` to keep the modal open, or a promise
	 * to show the loading state until it settles.
	 */
	onClick?: ModalActionHandler
	/**
	 * Button height: 48px on phones and 64px from the md breakpoint by default.
	 * @default 'responsive'
	 */
	size?: ButtonProps['size']
	/** Button text. Overrides the modal's label and the translated default. */
	children?: ButtonProps['children']
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
	typeof (value as PromiseLike<unknown> | null)?.then === 'function'

const useCloseAfter = (handler: ModalActionHandler | undefined) => {
	const { onClose } = useModalActions()
	const [isLoading, setIsLoading] = useState(false)

	// A rejected promise is not caught: the modal stays open and the error
	// surfaces instead of being silently swallowed.
	const run = async () => {
		const result = handler?.()
		if (!isPromiseLike(result)) {
			if (result !== false) {
				onClose()
			}
			return
		}
		setIsLoading(true)
		try {
			if ((await result) !== false) {
				onClose()
			}
		} finally {
			setIsLoading(false)
		}
	}

	return { isLoading, run }
}

/**
 * Grey outline Cancel button for a modal footer. Runs `onClick` or the
 * modal's `onCancel`, then closes the modal. Must be rendered inside a Modal.
 */
export const ModalCancelButton = ({
	onClick,
	size = 'responsive',
	isLoading,
	children,
	...props
}: ModalActionButtonProps) => {
	const { t } = useTranslation('modal')
	const { onCancel, cancelLabel } = useModalActions()
	const action = useCloseAfter(onClick ?? onCancel)
	return (
		<Button
			{...props}
			variant="outline"
			size={size}
			isLoading={isLoading || action.isLoading}
			onClick={action.run}
		>
			{children ?? cancelLabel ?? t('cancel')}
		</Button>
	)
}

/**
 * Orange Apply button for a modal footer. Runs `onClick` or the modal's
 * `onApply`, then closes the modal. Must be rendered inside a Modal.
 *
 * @example
 * // Apply only, opening a confirmation instead of closing
 * <Modal footer={<ModalApplyButton onClick={() => { openConfirm(); return false }} />} …>
 */
export const ModalApplyButton = ({
	onClick,
	size = 'responsive',
	isLoading,
	children,
	...props
}: ModalActionButtonProps) => {
	const { t } = useTranslation('modal')
	const { onApply, applyLabel } = useModalActions()
	const action = useCloseAfter(onClick ?? onApply)
	return (
		<Button
			{...props}
			variant="primary"
			size={size}
			isLoading={isLoading || action.isLoading}
			onClick={action.run}
		>
			{children ?? applyLabel ?? t('apply')}
		</Button>
	)
}
