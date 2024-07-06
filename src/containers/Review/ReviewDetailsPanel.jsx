// mainly just a wrapper for data fetching

import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { ReviewDetailsPanelWrapper } from './Review.styled'

const ReviewDetailsPanel = ({ versionIds = [], projectName }) => {
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: [projectName] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}

  const entities = versionIds.map((id) => ({ id, projectName, entityType: 'version' }))

  if (!versionIds.length) return null

  return (
    <ReviewDetailsPanelWrapper>
      <DetailsPanel
        entities={entities}
        statusesOptions={projectInfo.statuses || []}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        disabledProjectUsers={[]}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        entityType={'version'}
        scope="review"
        style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="review" />
    </ReviewDetailsPanelWrapper>
  )
}

export default ReviewDetailsPanel
