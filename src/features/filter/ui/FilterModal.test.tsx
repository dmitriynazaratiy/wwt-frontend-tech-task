import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import '@/shared/i18n'

import { App } from '../../../pages/Home'
import { useFilterStore } from '../model/filterStore'

const renderApp = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<App />
		</QueryClientProvider>
	)

const getJson = () => JSON.parse(screen.getByText(/^\[/).textContent ?? '')

const openFilters = async () => {
	fireEvent.click(screen.getByRole('button', { name: 'Open filters' }))
	return screen.findByRole('checkbox', { name: 'Breakfast included' })
}

const waitForModalsToClose = () =>
	waitFor(() =>
		expect(document.querySelectorAll('.modal-root')).toHaveLength(0)
	)

describe('Filter flow', () => {
	beforeEach(() => useFilterStore.setState({ appliedFilters: [] }))

	it('saves the selection only after the user confirms it', async () => {
		renderApp()
		fireEvent.click(await openFilters())
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

		expect(
			screen.getByRole('dialog', { name: 'Do you want to apply new filter' })
		).toBeInTheDocument()
		expect(getJson()).toEqual([])

		fireEvent.click(screen.getByRole('button', { name: 'Apply new filter' }))

		await waitForModalsToClose()
		expect(getJson()).toEqual([
			{ id: 'MEAL_OPTIONS', type: 'OPTION', optionsIds: ['breakfast'] }
		])
	})

	it('pre-fills saved filters and keeps them when the user picks the old filter', async () => {
		useFilterStore.setState({
			appliedFilters: [
				{
					id: 'MEAL_OPTIONS',
					type: 'OPTION' as never,
					optionsIds: ['breakfast']
				}
			]
		})
		renderApp()
		const breakfast = await openFilters()

		expect(breakfast).toBeChecked()

		fireEvent.click(breakfast)
		fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
		fireEvent.click(screen.getByRole('button', { name: 'Use old filter' }))

		await waitForModalsToClose()
		expect(getJson()).toEqual([
			{ id: 'MEAL_OPTIONS', type: 'OPTION', optionsIds: ['breakfast'] }
		])
		expect(await openFilters()).toBeChecked()
	})

	it('clears every option in the draft', async () => {
		useFilterStore.setState({
			appliedFilters: [
				{ id: 'BED_TYPE', type: 'OPTION' as never, optionsIds: ['twin-beds'] }
			]
		})
		renderApp()
		await openFilters()

		fireEvent.click(
			screen.getByRole('button', { name: 'Clear all parameters' })
		)

		expect(
			screen
				.getAllByRole('checkbox')
				.filter(box => (box as HTMLInputElement).checked)
		).toHaveLength(0)
	})
})
