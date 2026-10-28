import { FilterItem } from '@/shared/api/types/Filter'

import { toSearchRequest, toSelection, toggleOption } from './selection'

const items = [
	{
		id: 'MEAL',
		name: 'Meal',
		type: 'OPTION',
		options: [
			{ id: 'breakfast', name: 'Breakfast' },
			{ id: 'dinner', name: 'Dinner' }
		]
	},
	{
		id: 'BED',
		name: 'Bed',
		type: 'OPTION',
		options: [{ id: 'twin', name: 'Twin' }]
	}
] as unknown as FilterItem[]

describe('filter selection', () => {
	it('keeps the API order and leaves out filters with nothing ticked', () => {
		expect(
			toSearchRequest(items, {
				BED: [],
				MEAL: ['dinner', 'breakfast', 'unknown']
			})
		).toEqual([
			{ id: 'MEAL', type: 'OPTION', optionsIds: ['breakfast', 'dinner'] }
		])
	})

	it('round-trips through the search request format', () => {
		const selection = { MEAL: ['breakfast'], BED: ['twin'] }

		expect(toSelection(toSearchRequest(items, selection))).toEqual(selection)
	})

	it('ticks and unticks options without duplicates', () => {
		const ticked = toggleOption({}, 'MEAL', 'breakfast', true)

		expect(toggleOption(ticked, 'MEAL', 'breakfast', true)).toEqual({
			MEAL: ['breakfast']
		})
		expect(toggleOption(ticked, 'MEAL', 'breakfast', false)).toEqual({
			MEAL: []
		})
	})
})
