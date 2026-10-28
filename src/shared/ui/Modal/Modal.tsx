import { ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import CloseIcon from '@/shared/assets/icons/close.svg'

import { Divider } from '../Divider'
import { ModalApplyButton, ModalCancelButton } from './ModalActionButtons'
import { ModalActionHandler, ModalActionsContext } from './modalActions'
import { ModalContainerContext } from './modalContainer'
import { getModalStack } from './modalStack'

/*
 * All DOM access stays inside effects: Modal renders null on the server and
 * during hydration, then mounts its portal container on the client.
 */

export interface ModalProps {
	/**
	 * Whether the modal is shown. The modal is controlled: it never changes this
	 * itself and asks to close through `onClose`. Setting it to `false` plays
	 * the exit animation before the modal leaves the DOM.
	 */
	isOpen: boolean
	/**
	 * Called when the modal asks to close: the close button, `Escape`, a click
	 * on the backdrop, or the default footer buttons once their handlers allow
	 * it. Set `isOpen` to `false` here.
	 */
	onClose: () => void
	/** Heading shown at the top and used as the dialog's accessible name. */
	title: string
	/**
	 * Accessible label of the close (×) button.
	 * @default the `modal:close` translation
	 */
	closeLabel?: string
	/** Modal content, rendered between the header and the footer. */
	children: ReactNode
	/**
	 * Content pinned below `children`, with its items centred 32px apart.
	 * - omitted: the default Cancel and Apply buttons
	 * - `null` or `false`: no footer
	 * - any other node: replaces the defaults. Compose it from
	 *   `ModalCancelButton`, `ModalApplyButton` and your own elements to keep
	 *   or extend them.
	 */
	footer?: ReactNode
	/**
	 * Run by Apply buttons in the footer before the modal closes. Return
	 * `false` to keep it open, or a promise to show the loading state until it
	 * settles. See `ModalActionHandler`.
	 */
	onApply?: ModalActionHandler
	/**
	 * Run by Cancel buttons in the footer before the modal closes, with the
	 * same contract as `onApply`.
	 */
	onCancel?: ModalActionHandler
	/**
	 * Text of Apply buttons in the footer.
	 * @default the `modal:apply` translation
	 */
	applyLabel?: string
	/**
	 * Text of Cancel buttons in the footer.
	 * @default the `modal:cancel` translation
	 */
	cancelLabel?: string
	/**
	 * What scrolls when the modal is taller than the screen. The page behind
	 * stays locked either way.
	 * - `content`: the panel fits the screen and the content between the
	 *   header and the footer scrolls
	 * - `overlay`: the panel keeps its full height and the layer around it
	 *   scrolls, with the header and the footer sticking to the screen edges
	 * @default 'content'
	 */
	scroll?: 'content' | 'overlay'
	/**
	 * Spacing, elevation and separators, per Figma.
	 * - `default`: the filter pop-up, 40px top and bottom padding, no shadow,
	 *   2px dividers closing the header and opening the footer
	 * - `compact`: the confirmation dialog, 32px padding, `shadow-100`, no
	 *   dividers
	 * @default 'default'
	 */
	variant?: 'default' | 'compact'
	/**
	 * Element the modal's container is appended to. It must already be
	 * mounted when the modal opens.
	 * @default document.body
	 */
	portal?: HTMLElement | null
	/**
	 * Blurs the page behind the backdrop.
	 * @default true
	 */
	blurBackdrop?: boolean
	/**
	 * Whether a click on the backdrop calls `onClose`. Only the top modal of a
	 * stack reacts.
	 * @default true
	 */
	closeOnBackdrop?: boolean
	/**
	 * Whether `Escape` calls `onClose`. Only the top modal of a stack reacts.
	 * @default true
	 */
	closeOnEscape?: boolean
}

interface ModalContentProps extends ModalProps {
	container: HTMLElement
	onExited: () => void
}

const rootClassName = 'modal-root pointer-events-none fixed inset-0 isolate'

// The stack marks the top modal with data-top and decides whether the backdrop
// animates: it fades only for the first open and the last close, so switching
// between stacked modals never shows two semi-transparent layers at once.
const backdropClassName = [
	'pointer-events-auto absolute inset-0 z-(--modal-z-backdrop) bg-overlay/30',
	'modal-below:opacity-0',
	'fade-in fade-out',
	'motion-safe:modal-backdrop-motion:state-open:animate-in',
	'motion-safe:modal-backdrop-motion:state-closed:animate-exit'
].join(' ')

const panelClassName = [
	'pointer-events-auto flex min-h-0 w-full max-w-modal flex-col',
	'overflow-clip rounded-2xl bg-white text-grey-500 wrap-break-word',
	'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grey-500',
	'fade-in zoom-in-95 fade-out zoom-out-95',
	'motion-safe:state-open:animate-in motion-safe:state-closed:animate-exit'
].join(' ')

const scrollClassNames = {
	content: {
		positioner: 'items-center',
		panel: 'max-h-full',
		header: '',
		body: 'min-h-0 overflow-y-auto overscroll-contain',
		footer: 'shrink-0'
	},
	// The positioner becomes the scroll container. Auto margins centre a short
	// panel and collapse to zero for a tall one, so its top stays reachable.
	overlay: {
		positioner: 'pointer-events-auto overflow-y-auto overscroll-contain',
		panel: 'my-auto',
		// Sticky offsets are measured inside the positioner padding; the negative
		// values cancel it so the header and footer stick to the screen edges.
		header: 'sticky -top-4 z-10 bg-white md:-top-10 xl:-top-20',
		body: 'overflow-x-auto',
		footer: 'sticky -bottom-4 z-10 bg-white md:-bottom-10 xl:-bottom-20'
	}
}

// Desktop padding and shadow per Figma frame; phones keep 16px either way.
const variantClassNames = {
	default: {
		panel: '',
		header: 'md:pt-10',
		bottom: 'md:pb-10',
		isSeparated: true
	},
	compact: {
		panel: 'shadow-100',
		header: 'md:pt-8',
		bottom: 'md:pb-8',
		isSeparated: false
	}
}

// Figma widths: 220px phone buttons, 280px in the desktop confirmation dialog.
const defaultFooter = (
	<>
		<ModalCancelButton className="w-55 md:w-70" />
		<ModalApplyButton className="w-55 md:w-70" />
	</>
)

const ModalContent = ({
	isOpen,
	container,
	onClose,
	onExited,
	title,
	closeLabel,
	children,
	footer = defaultFooter,
	onApply,
	onCancel,
	applyLabel,
	cancelLabel,
	scroll = 'content',
	variant = 'default',
	blurBackdrop = true,
	closeOnBackdrop = true,
	closeOnEscape = true
}: ModalContentProps) => {
	const { t } = useTranslation('modal')
	const titleId = useId()
	const hasFooter = footer != null && typeof footer !== 'boolean'
	const panelRef = useRef<HTMLDivElement>(null)
	const classNames = scrollClassNames[scroll]
	const variantClasses = variantClassNames[variant]
	// Tracks whether a press began on the empty overlay area, so a text
	// selection dragged out of the panel or a scrollbar drag does not close.
	const isOverlayPressRef = useRef(false)
	const closeRef = useRef({ onClose, closeOnEscape })
	const state = isOpen ? 'open' : 'closed'
	useLayoutEffect(() => {
		closeRef.current = { onClose, closeOnEscape }
	})

	const unregisterRef = useRef<(() => void) | null>(null)

	// Leave the stack as soon as closing starts, so focus, scroll and the modal
	// underneath are released while the exit animation is still playing. This
	// happens in the setup phase, not in a cleanup: after a commit React
	// refocuses the element that was focused before it, which would pull focus
	// back into this modal while it is still mounted.
	useLayoutEffect(() => {
		const panel = panelRef.current
		unregisterRef.current?.()
		unregisterRef.current = null
		container.inert = !isOpen
		if (!isOpen || !panel) {
			return
		}
		const ownerDocument = container.ownerDocument
		unregisterRef.current = getModalStack(ownerDocument).add({
			container,
			panel,
			returnFocus: ownerDocument.activeElement as HTMLElement | null,
			onEscape: () => {
				if (closeRef.current.closeOnEscape) {
					closeRef.current.onClose()
				}
			}
		})
	}, [container, isOpen])

	useLayoutEffect(
		() => () => {
			unregisterRef.current?.()
			unregisterRef.current = null
		},
		[]
	)

	useLayoutEffect(() => {
		if (isOpen) {
			return
		}
		let isCancelled = false
		// No animations (reduced motion, no Web Animations API) resolves at once.
		const animations = container.getAnimations?.({ subtree: true }) ?? []
		Promise.all(animations.map(animation => animation.finished)).then(
			() => {
				if (!isCancelled) {
					onExited()
				}
			},
			// Rejected when an animation is cancelled, e.g. reopened mid-close.
			() => {}
		)
		return () => {
			isCancelled = true
		}
	}, [container, isOpen])

	const closeFromBackdrop = () => {
		if (
			isOpen &&
			closeOnBackdrop &&
			getModalStack(container.ownerDocument).isTop(container)
		) {
			onClose()
		}
	}

	return (
		<ModalContainerContext.Provider value={container}>
			<div
				className={`${backdropClassName}${blurBackdrop ? ' backdrop-blur-overlay' : ''}`}
				data-state={state}
				aria-hidden="true"
				onClick={event => {
					event.stopPropagation()
					closeFromBackdrop()
				}}
			/>
			<div
				className={`absolute inset-0 z-(--modal-z-content) flex justify-center p-4 md:p-10 xl:p-20 ${classNames.positioner}`}
				data-scroll={scroll}
				onPointerDown={event => {
					const positioner = event.currentTarget
					const isOnScrollbar =
						positioner.offsetWidth > positioner.clientWidth &&
						event.clientX - positioner.getBoundingClientRect().left >=
							positioner.clientWidth
					isOverlayPressRef.current =
						event.target === positioner && !isOnScrollbar
				}}
				onClick={event => {
					event.stopPropagation()
					// Only reachable in overlay mode: in content mode the positioner
					// lets clicks through to the backdrop.
					if (
						isOverlayPressRef.current &&
						event.target === event.currentTarget
					) {
						closeFromBackdrop()
					}
					isOverlayPressRef.current = false
				}}
			>
				<div
					ref={panelRef}
					className={`${panelClassName} ${classNames.panel} ${variantClasses.panel}`}
					data-state={state}
					role="dialog"
					aria-labelledby={titleId}
					tabIndex={-1}
				>
					{/* Capped so an extremely long title cannot squeeze the body away */}
					<header
						className={`max-h-modal-header-cap shrink-0 overflow-y-auto px-4 pt-4 md:px-8 ${variantClasses.header} ${classNames.header}`}
					>
						<div className="grid grid-cols-modal-header items-center gap-2 pb-6 md:pb-modal-title-gap">
							<h2
								id={titleId}
								className="col-start-2 min-w-0 text-center text-headline-5 md:text-headline-2 md:leading-12"
							>
								{title}
							</h2>
							<button
								className="col-start-3 -mr-2.5 grid size-11 cursor-pointer place-items-center justify-self-end rounded-lg focus-visible:outline-2 focus-visible:outline-grey-500"
								type="button"
								onClick={onClose}
								aria-label={closeLabel ?? t('close')}
							>
								<CloseIcon aria-hidden="true" />
							</button>
						</div>
						{/* Part of the header, so it stays put while the content scrolls */}
						{variantClasses.isSeparated && <Divider />}
					</header>
					<div
						className={`px-4 md:px-8 ${hasFooter ? '' : `pb-4 ${variantClasses.bottom}`} ${classNames.body}`}
					>
						{children}
					</div>
					{hasFooter && (
						<ModalActionsContext.Provider
							value={{ onClose, onApply, onCancel, applyLabel, cancelLabel }}
						>
							<footer
								className={`px-4 pb-4 md:px-8 ${variantClasses.bottom} ${classNames.footer}`}
							>
								{variantClasses.isSeparated && <Divider className="mb-8" />}
								<div className="flex flex-wrap justify-center gap-8">
									{footer}
								</div>
							</footer>
						</ModalActionsContext.Provider>
					)}
				</div>
			</div>
		</ModalContainerContext.Provider>
	)
}

/**
 * Accessible, stackable modal dialog. Each open modal gets its own container
 * appended to `body`, traps focus, locks page scroll and makes the rest of the
 * page inert. When modals are stacked, only the top one reacts and shows its
 * backdrop.
 *
 * @example
 * <Modal
 * 	isOpen={isOpen}
 * 	onClose={() => setIsOpen(false)}
 * 	title={t('title')}
 * 	onApply={saveFilters}
 * >
 * 	<FilterForm />
 * </Modal>
 */
export const Modal = (props: ModalProps) => {
	const { isOpen, portal } = props
	// Stays true after isOpen turns false until the exit animation finishes.
	const [isMounted, setIsMounted] = useState(isOpen)
	const [container, setContainer] = useState<HTMLElement | null>(null)
	if (isOpen && !isMounted) {
		setIsMounted(true)
	}

	// Unmounting the parent removes the container immediately, without waiting
	// for an exit animation.
	useLayoutEffect(() => {
		if (!isMounted) {
			return
		}
		const target = portal ?? document.body
		const element = target.ownerDocument.createElement('div')
		element.className = rootClassName
		target.appendChild(element)
		setContainer(element)
		return () => {
			element.remove()
			setContainer(null)
		}
	}, [isMounted, portal])

	return isMounted && container
		? createPortal(
				<ModalContent
					{...props}
					container={container}
					onExited={() => setIsMounted(false)}
				/>,
				container
			)
		: null
}
