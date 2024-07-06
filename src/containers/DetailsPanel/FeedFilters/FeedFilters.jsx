import * as Styled from './FeedFilters.styled'
import { useDispatch, useSelector } from 'react-redux'
import { updateDetailsPanelTab, updateFeedFilter } from '@state/details'
import { Spacer } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import { entitiesWithoutFeed } from '../DetailsPanel'

const FeedFilters = ({
  isSlideOut,
  isLoading,
  entityType,
  className,
  overrides = {},
  scope,
  ...props
}) => {
  const dispatch = useDispatch()
  const setFeedFilter = (value) => dispatch(updateFeedFilter({ value, isSlideOut, scope }))
  const setTab = (tab) => dispatch(updateDetailsPanelTab({ isSlideOut, tab, scope }))

  const filtersStateLocation = isSlideOut ? 'slideOut' : 'pinned'

  const selectedFilter = useSelector((state) => state.details[filtersStateLocation][scope].filter)
  const selectedTab = useSelector((state) => state.details[filtersStateLocation][scope].tab)

  const filtersLeft = [
    {
      id: 'activity',
      tooltip: 'All activity',
      icon: 'forum',
    },
    {
      id: 'comments',
      tooltip: 'Comments',
      icon: 'chat',
    },
    {
      id: 'publishes',
      tooltip: 'Published versions',
      icon: 'layers',
    },
    {
      id: 'checklists',
      tooltip: 'Checklists',
      icon: 'checklist',
    },
  ]

  // for each override, find the filter and update it
  Object.entries(overrides).forEach(([id, override]) => {
    const index = filtersLeft.findIndex((filter) => filter.id === id)
    if (index !== -1) {
      filtersLeft[index] = { ...filtersLeft[index], ...override }
    }
  })

  const hideActivityFilters = entitiesWithoutFeed.includes(entityType)

  return (
    <Styled.FiltersToolbar {...props} className={classNames(className, { isLoading })}>
      {!hideActivityFilters &&
        filtersLeft.map((filter) => (
          <Styled.FilterButton
            key={filter.id}
            selected={filter.id === selectedFilter && selectedTab === 'feed'}
            onClick={() => setFeedFilter(filter.id)}
            label={filter.label}
            icon={filter.icon}
            data-tooltip={filter.tooltip}
            data-tooltip-delay={0}
          />
        ))}
      <Spacer />
      {entityType === 'version' && (
        <Styled.FilterButton
          icon="order_play"
          onClick={() => setTab('files')}
          selected={selectedTab === 'files'}
          data-tooltip="Reviewables and Representations"
          data-tooltip-delay={0}
        />
      )}
      <Styled.FilterButton
        icon="segment"
        onClick={() => setTab('attribs')}
        selected={selectedTab === 'attribs'}
        data-tooltip="Attributes"
        data-tooltip-delay={0}
      />
    </Styled.FiltersToolbar>
  )
}

export default FeedFilters
