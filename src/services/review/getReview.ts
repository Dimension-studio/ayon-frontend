import PubSub from '@/pubsub'
import { $Any } from '@/types'
import api from '@api'
import { TagTypes, UpdatedDefinitions, Summary } from './types'

const enhancedReview = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getReviewablesForProduct: {},
    getReviewablesForVersion: {
      providesTags: (result, _error, { versionId }) =>
        result
          ? [
              { type: 'review', id: versionId },
              ...(result.reviewables?.map((reviewable) => ({
                type: 'review',
                id: reviewable.activityId,
              })) || []),
            ]
          : [{ type: 'review', id: versionId }],
      async onCacheEntryAdded(
        _args,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: $Any) => {
            if (topic !== 'reviewable.process') return

            const summary = (message?.summary as Summary) || {}

            const cache = getCacheEntry()

            // check if the reviewable is in the cache
            const index = cache.data?.reviewables?.findIndex(
              (r) => r?.fileId === summary.sourceFileId,
            )

            if (index && index !== -1 && message.status !== 'finished') {
              // update the progress of the reviewable
              const progress = message?.progress || 0

              // update the cache reviewable

              updateCachedData((data) => {
                const reviewables = data.reviewables

                // check if there are reviewables
                if (!reviewables) return
                const processing = reviewables[index].processing

                // update the reviewable with the new progress
                reviewables[index] = {
                  ...reviewables[index],
                  processing: {
                    ...processing,
                    progress,
                  },
                }
              })
            } else {
              console.log('New reviewable found:', summary.sourceFileId, summary.versionId)
              // get data for this new reviewable
              dispatch(api.util.invalidateTags([{ type: 'review', id: summary.versionId }]))
            }
          }

          // sub to websocket topic
          token = PubSub.subscribe('reviewable.process', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    },
  },
})

export const { useGetReviewablesForProductQuery, useGetReviewablesForVersionQuery } = enhancedReview
