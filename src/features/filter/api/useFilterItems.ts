import { useQuery } from '@tanstack/react-query'

import { FilterItem } from '@shared/api/types/Filter'

// filterData.json stands in for the API response, so it is loaded the way a
// request would be: asynchronously and cached by react-query.
const loadFilterItems = async () => {
	const { default: data } = await import('@shared/temp/filterData.json')
	// JSON imports type enum values as plain strings
	return data.filterItems as unknown as FilterItem[]
}

export const useFilterItems = () =>
	useQuery({
		queryKey: ['filterItems'],
		queryFn: loadFilterItems,
		staleTime: Infinity
	})
