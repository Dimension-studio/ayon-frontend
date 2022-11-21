import pypeClient from '/src/pype'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import { Panel } from 'openpype-components'

import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { getFolderTypeIcon, getStatusColor } from '/src/utils'

const FOLDER_QUERY = `
    query Folders($projectName: String!, $folders: [String!]!) {
        project(name: $projectName) {
            folders(ids: $folders) {
                edges {
                    node {
                        name
                        folderType
                        path
                        status
                        attrib {
                          #FOLDER_ATTRS#
                        }
                    }
                }
            }
        }
    }

`

const buildFolderQuery = () => {
  let f_attribs = ''
  for (const attrib of pypeClient.settings.attributes) {
    if (attrib.scope.includes('folder')) f_attribs += `${attrib.name}\n`
  }
  return FOLDER_QUERY.replace('#FOLDER_ATTRS#', f_attribs)
}

const FolderDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folders = context.focusedFolders
  const folderId = folders.length === 1 ? folders[0] : null
  const [data, setData] = useState({})

  useEffect(() => {
    const query = buildFolderQuery()
    const variables = { projectName, folders: [folderId] }

    if (!folderId) {
      setData({})
      return
    }

    axios.post('/graphql', { query, variables }).then((response) => {
      if (!(response.data.data && response.data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }

      const edges = response.data.data.project.folders.edges
      if (!edges.length) {
        // TODO: log 404
        return
      }

      setData(edges[0].node)
    })
    //eslint-disable-next-line
  }, [projectName, folderId])

  if (folders.length > 1) {
    return (
      <Panel>
        <span>{folders.length} folders selected</span>
      </Panel>
    )
  }

  const status = (
    <span className="status" style={{ color: getStatusColor(data.status) }}>
      {data.status}
    </span>
  )

  return (
    <Panel>
      <h3>
        <span
          className="material-symbols-outlined"
          style={{ verticalAlign: 'bottom' }}
        >
          {getFolderTypeIcon(data.folderType)}
        </span>
        <span style={{ marginLeft: 10 }}>{data.name}</span>
      </h3>
      <Thumbnail
        projectName={projectName}
        entityType="folder"
        entityId={folderId}
      />
      <AttributeTable
        entityType="folder"
        data={data.attrib}
        additionalData={[
          { title: 'Status', value: status },
          { title: 'Folder type', value: data.folderType },
          { title: 'Path', value: data.path },
        ]}
      />
    </Panel>
  )
}

export default FolderDetail
