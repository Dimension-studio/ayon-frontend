import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Preview.styled'
import VersionSelectorTool from '/src/components/VersionSelectorTool/VersionSelectorTool'
import { useGetPreviewQuery, useGetPreviewVersionsQuery } from '/src/services/preview/getPreview'

const Preview = ({ selected = [], projectName, onClose }) => {
  // get version preview data
  const { data: selectedVersionsData = [], isFetching: isFetchingPreview } = useGetPreviewQuery(
    { projectName, versionIds: selected },
    { skip: !selected.length || !projectName },
  )

  // get all versions for the product ids of the selected versions
  const selectedProductIds = selectedVersionsData?.map(({ productId }) => productId)
  const { data: allVersionsData = [], isFetching: isFetchingVersions } = useGetPreviewVersionsQuery(
    { productIds: selectedProductIds, projectName },
    { skip: !selectedProductIds.length },
  )

  const isLoadingAll = isFetchingPreview || isFetchingVersions

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={allVersionsData}
          selected={selected[0]}
          isLoading={isLoadingAll}
        />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        <h2>Selected Version: {selected.join(', ')}</h2>
      </Styled.Content>
    </Styled.Container>
  )
}

export default Preview
