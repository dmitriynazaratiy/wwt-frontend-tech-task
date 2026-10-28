import { FilterItem } from '@shared/api/types/Filter'
import { SearchRequestFilter } from '@shared/api/types/SearchRequest/SearchRequestFilter'

/** Ticked option ids per filter id, as edited in the filter modal. */
export type FilterSelection = Record<string, string[]>

export const toSelection = (filters: SearchRequestFilter): FilterSelection =>
	Object.fromEntries(filters.map(filter => [filter.id, filter.optionsIds]))

/**
 * Keeps the API order of filters and options. Filters with nothing ticked are
 * left out, since an empty `optionsIds` carries no information.
 */
export const toSearchRequest = (
	items: FilterItem[],
	selection: FilterSelection
): SearchRequestFilter =>
	items.flatMap(item => {
		const ticked = new Set(selection[item.id])
		const optionsIds = item.options
			.filter(option => ticked.has(option.id))
			.map(option => option.id)
		return optionsIds.length
			? [{ id: item.id, type: item.type, optionsIds }]
			: []
	})

export const toggleOption = (
	selection: FilterSelection,
	filterId: string,
	optionId: string,
	isChecked: boolean
): FilterSelection => {
	const optionsIds = (selection[filterId] ?? []).filter(id => id !== optionId)
	return {
		...selection,
		[filterId]: isChecked ? [...optionsIds, optionId] : optionsIds
	}
}
