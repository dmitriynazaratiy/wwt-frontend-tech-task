import { create } from 'zustand'

import { SearchRequestFilter } from '@shared/api/types/SearchRequest/SearchRequestFilter'

interface FilterState {
	/** Filters confirmed in the filter modal; the app's global filter state. */
	appliedFilters: SearchRequestFilter
	applyFilters: (filters: SearchRequestFilter) => void
}

export const useFilterStore = create<FilterState>()(set => ({
	appliedFilters: [],
	applyFilters: appliedFilters => set({ appliedFilters })
}))
