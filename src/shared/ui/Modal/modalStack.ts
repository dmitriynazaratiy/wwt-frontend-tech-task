interface ModalEntry {
	container: HTMLElement
	panel: HTMLElement
	returnFocus: HTMLElement | null
	onEscape: () => void
}

const focusableSelector =
	'button, [href], input, select, textarea, [tabindex], [contenteditable="true"]'

const getFocusable = (panel: HTMLElement) =>
	Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
		element => {
			if (
				element.tabIndex < 0 ||
				element.matches(':disabled') ||
				element.closest('[hidden], [inert]')
			) {
				return false
			}
			let ancestor: HTMLElement | null = element
			while (ancestor && ancestor !== panel.parentElement) {
				const style =
					ancestor.ownerDocument.defaultView?.getComputedStyle(ancestor)
				if (style?.display === 'none' || style?.visibility === 'hidden') {
					return false
				}
				ancestor = ancestor.parentElement
			}
			return true
		}
	)

const focusPanel = (panel: HTMLElement) => {
	;(getFocusable(panel)[0] ?? panel).focus({ preventScroll: true })
}

const createStack = (ownerDocument: Document) => {
	const entries: ModalEntry[] = []
	const inertElements = new Map<HTMLElement, boolean>()
	let restoreScroll = () => {}
	const top = () => entries.at(-1)

	const restoreInert = () => {
		inertElements.forEach((wasInert, element) => {
			element.inert = wasInert
		})
		inertElements.clear()
	}

	const sync = () => {
		restoreInert()
		entries.forEach((entry, index) => {
			entry.container.style.setProperty('--modal-layer', String(index))
			entry.container.dataset.top = String(entry === top())
			entry.panel.setAttribute('aria-modal', String(entry === top()))
		})

		// Only inert siblings along the active portal's ancestor path. This also
		// works when the portal lives inside the application instead of body.
		let activeBranch: HTMLElement | undefined = top()?.container
		while (activeBranch && activeBranch !== ownerDocument.body) {
			const parent = activeBranch.parentElement
			if (!parent) {
				break
			}
			Array.from(parent.children).forEach(sibling => {
				if (sibling !== activeBranch && sibling instanceof HTMLElement) {
					inertElements.set(sibling, sibling.inert)
					sibling.inert = true
				}
			})
			activeBranch = parent
		}
	}

	const onKeyDown = (event: KeyboardEvent) => {
		const active = top()
		if (!active) {
			return
		}
		if (event.key === 'Escape') {
			event.preventDefault()
			event.stopImmediatePropagation()
			active.onEscape()
		}
		if (event.key === 'Tab') {
			const focusable = getFocusable(active.panel)
			const index = focusable.indexOf(
				ownerDocument.activeElement as HTMLElement
			)
			if (
				index === -1 ||
				(event.shiftKey && index === 0) ||
				(!event.shiftKey && index === focusable.length - 1)
			) {
				event.preventDefault()
				const destination = event.shiftKey ? focusable.at(-1) : focusable[0]
				;(destination ?? active.panel).focus({ preventScroll: true })
			}
		}
	}

	const onFocusIn = (event: FocusEvent) => {
		const active = top()
		if (active && !active.panel.contains(event.target as Node)) {
			focusPanel(active.panel)
		}
	}

	const lockScroll = () => {
		const body = ownerDocument.body
		const properties = ['overflow', 'padding-right']
		const previous = properties.map(property => ({
			property,
			value: body.style.getPropertyValue(property),
			priority: body.style.getPropertyPriority(property)
		}))
		const viewport = ownerDocument.defaultView
		const width = ownerDocument.documentElement.clientWidth
		const scrollbarWidth = viewport && width ? viewport.innerWidth - width : 0
		if (viewport && scrollbarWidth > 0) {
			const padding =
				Number.parseFloat(viewport.getComputedStyle(body).paddingRight) || 0
			body.style.setProperty('padding-right', `${padding + scrollbarWidth}px`)
		}
		body.style.setProperty('overflow', 'hidden')
		restoreScroll = () => {
			previous.forEach(({ property, value, priority }) => {
				if (value) {
					body.style.setProperty(property, value, priority)
				} else {
					body.style.removeProperty(property)
				}
			})
		}
	}

	return {
		isTop: (container: HTMLElement) => top()?.container === container,
		add: (entry: ModalEntry) => {
			if (!entries.length) {
				lockScroll()
				ownerDocument.addEventListener('keydown', onKeyDown, true)
				ownerDocument.addEventListener('focusin', onFocusIn)
			}
			// Only the first modal fades its backdrop in; a stacked one replaces
			// the visible backdrop instantly.
			entry.container.dataset.backdropMotion = String(!entries.length)
			entries.push(entry)
			sync()
			focusPanel(entry.panel)

			return () => {
				const wasTop = top() === entry
				const index = entries.indexOf(entry)
				if (index === -1) {
					return
				}
				entries.splice(index, 1)
				// A closing modal keeps its backdrop only if it was the last one;
				// otherwise the backdrop of the new top takes over instantly.
				entry.container.dataset.backdropMotion = String(!entries.length)
				if (entries.length) {
					entry.container.dataset.top = 'false'
				}
				entries.forEach(remaining => {
					if (
						remaining.returnFocus &&
						entry.container.contains(remaining.returnFocus)
					) {
						remaining.returnFocus = entry.returnFocus
					}
				})
				sync()
				if (!entries.length) {
					restoreScroll()
					ownerDocument.removeEventListener('keydown', onKeyDown, true)
					ownerDocument.removeEventListener('focusin', onFocusIn)
				}
				if (wasTop) {
					const active = top()
					if (
						entry.returnFocus?.isConnected &&
						!entry.returnFocus.closest('[inert]') &&
						(!active || active.panel.contains(entry.returnFocus))
					) {
						entry.returnFocus.focus({ preventScroll: true })
					} else if (active) {
						focusPanel(active.panel)
					}
				}
			}
		}
	}
}

const stacks = new WeakMap<Document, ReturnType<typeof createStack>>()

export const getModalStack = (ownerDocument: Document) => {
	let stack = stacks.get(ownerDocument)
	if (!stack) {
		stack = createStack(ownerDocument)
		stacks.set(ownerDocument, stack)
	}
	return stack
}
