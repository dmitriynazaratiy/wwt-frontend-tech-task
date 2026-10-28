import { createContext, useContext } from 'react'

export const ModalContainerContext = createContext<HTMLElement | null>(null)

/**
 * Returns the root element of the closest modal, or null outside a modal.
 * Pass it as the portal target of third-party popovers so they render in the
 * modal's own layer instead of underneath it.
 */
export const useModalContainer = () => useContext(ModalContainerContext)
