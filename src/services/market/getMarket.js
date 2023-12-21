import { ayonApi } from '../ayon'

const getMarket = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // getMarketAddons
    getMarketAddons: build.query({
      query: () => ({
        url: `/api/market/addons`,
        method: 'GET',
      }),
      providesTags: (addons) => addons?.map(({ id }) => ({ type: 'marketAddon', id })) || [],
      transformResponse: (response) => response?.addons || [],
    }),
    // getMarketAddon
    getMarketAddon: build.query({
      query: (id) => ({
        url: `/api/market/addons/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'marketAddon', id }],
    }),
  }), // endpoints
})

export const { useGetMarketAddonsQuery, useGetMarketAddonQuery, useLazyGetMarketAddonQuery } =
  getMarket
