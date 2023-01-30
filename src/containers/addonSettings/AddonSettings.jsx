import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
//import ReactMarkdown from 'react-markdown'

import { Button, Spacer, Section, Panel, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'
import AddonSettingsPanel from './AddonSettingsPanel'
import SettingsChangesTable from './SettingsChangesTable'

import {
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
} from '/src/services/addonSettings'

/*
 * key is {addonName}|{addonVersion}|{siteId}|{projectKey}
 * if project name or siteid is N/a, use _ instead
 */

const getValueByPath = (obj, path) => {
  // path is an array of keys
  // e.g. ['a', 'b', 'c'] => obj.a.b.c
  // if any key is not found, return undefined
  // if path is empty, return null (to indicate that the value is not set)

  if (path.length === 0) return null
  let value = obj
  for (const key of path) {
    if (value === undefined) return undefined
    value = value[key]
  }
  return value
}

const setValueByPath = (obj, path, value) => {
  const result = { ...obj }
  if (path.length === 0) return
  let target = result
  for (const key of path.slice(0, -1)) {
    if (target[key] === undefined) target[key] = {}
    target = target[key]
  }
  target[path[path.length - 1]] = value
  return result
}

const sameKeysStructure = (obj1, obj2) => {
  for (const type of ['string', 'number', 'boolean']) {
    if (typeof obj1 === type && typeof obj2 === type) {
      return true
    }
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  if (obj1Keys.length !== obj2Keys.length) return false
  for (const key of obj1Keys) {
    if (!obj2Keys.includes(key)) return false
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!sameKeysStructure(obj1[key], obj2[key])) return false
    }
  }
  return true
}

const AddonSettings = ({ projectName, showSites = false }) => {
  const [showHelp, setShowHelp] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState({})
  const [localData, setLocalData] = useState({})
  const [localOverrides, setLocalOverrides] = useState({})
  const [currentSelection, setCurrentSelection] = useState(null)
  const [selectedSites, setSelectedSites] = useState([])

  const [setAddonSettings] = useSetAddonSettingsMutation()
  const [deleteAddonSettings] = useDeleteAddonSettingsMutation()
  const [modifyAddonOverride] = useModifyAddonOverrideMutation()

  const projectKey = projectName || '_'

  const onSettingsChange = (addonName, addonVersion, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
    setLocalData((localData) => {
      localData[key] = data
      return { ...localData }
    })
  }

  const onSetChangedKeys = (addonName, addonVersion, siteId, data) => {
    setLocalOverrides((localOverrides) => {
      const key = `${addonName}|${addonVersion}|${siteId}|${projectKey}`
      localOverrides[key] = data
      return { ...localOverrides }
    })
  }

  const onSave = async () => {
    let updatedKeys = []
    let allOk = true

    for (const key in localOverrides) {
      if (!localOverrides[key].length) continue
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      if (projectName !== projectKey) continue

      try {
        await setAddonSettings({
          addonName,
          addonVersion,
          projectName,
          siteId,
          data: localData[key],
        }).unwrap()

        updatedKeys.push(key)
      } catch (e) {
        allOk = false
        toast.error(`Unable to save settings of ${addonName} ${addonVersion} `)
        console.error(e)
      }
    } // for key in localData

    setLocalData((localData) => {
      const newData = { ...localData }
      updatedKeys.forEach((key) => delete newData[key])
      return newData
    })

    setLocalOverrides((overrides) => {
      const newOverrides = { ...overrides }
      updatedKeys.forEach((key) => delete newOverrides[key])
      return newOverrides
    })

    const toReload = {}
    for (const key of updatedKeys) {
      toReload[key] = new Date()
    }
    setReloadTrigger(toReload)

    if (allOk) {
      toast.success('Settings saved')
    }
  } // onSave

  const onDismissAllChanges = () => {
    const keys = Object.keys(localOverrides)
    setLocalOverrides({})

    const toReload = {}
    for (const key of keys) toReload[key] = new Date()

    console.log('onDismissChanges', toReload)
    setReloadTrigger(toReload)
  } // end of onDismissChanges

  const onRemoveOverrides = async (addonName, addonVersion, siteId) => {
    try {
      await deleteAddonSettings({
        addonName,
        addonVersion,
        projectName: projectKey,
        siteId,
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove overrides of ${addonName} ${addonVersion} `)
      console.error(e)
      return
    }
    toast.success('Overrides removed')
  }

  const deleteOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        action: 'delete',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to remove override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override removed')
  }

  const pinOverride = async (addon, siteId, path) => {
    try {
      await modifyAddonOverride({
        addonName: addon.name,
        addonVersion: addon.version,
        projectName: projectKey,
        siteId,
        path,
        action: 'pin',
      }).unwrap()
    } catch (e) {
      toast.error(`Unable to pin override of ${addon.name} ${addon.version} `)
      console.error(e)
      return
    }

    toast.success('Override pinned')
  }

  const copySelection = () => {
    const key = `${currentSelection.addon.name}|${currentSelection.addon.version}|${
      currentSelection.siteId || '_'
    }|${projectKey || '_'}`
    const allData = localData[key]
    if (!allData) {
      toast.error('No data to copy')
      return
    }
    const value = getValueByPath(allData, currentSelection.path)
    if (value === undefined) {
      toast.error('No data to copy')
      return
    }

    const text = JSON.stringify(value, null, 2)
    navigator.clipboard.writeText(text)
    console.log('copied', text)
    toast.success('Copied to clipboard')
  }

  const pasteSelection = async () => {
    const key = `${currentSelection.addon.name}|${currentSelection.addon.version}|${
      currentSelection.siteId || '_'
    }|${projectKey || '_'}`
    const allData = localData[key]
    if (!allData) {
      toast.error('No data to paste')
      return
    }
    const oldValue = getValueByPath(allData, currentSelection.path)
    if (oldValue === undefined) {
      toast.error('No data to paste')
      return
    }

    const text = await navigator.clipboard.readText()

    let newValue
    try {
      newValue = JSON.parse(text)
    } catch (e) {
      toast.error('Cannot paste, invalid clipboard contents')
      return
    }

    if (!sameKeysStructure(oldValue, newValue)) {
      toast.error('Cannot paste, incompatible data structure')
      return
    }

    setLocalOverrides((overrides) => {
      const newOverrides = { ...overrides }
      newOverrides[key] = newOverrides[key] || []
      newOverrides[key].push(currentSelection.path)
      return newOverrides
    })

    setLocalData((localData) => {
      const newData = { ...localData }
      const nk = setValueByPath(localData[key], currentSelection.path, newValue)
      newData[key] = nk
      console.log(newData)
      return newData
    })

    console.log('pasted', newValue)
  } // paste

  //
  // RENDER
  //

  const settingsListHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button icon="content_copy" onClick={copySelection} />
        <Button icon="content_paste" onClick={pasteSelection} />
        <Button
          icon="cancel"
          disabled={!currentSelection?.addon?.name}
          tooltip="Remove all addon overrides"
          onClick={() =>
            onRemoveOverrides(
              currentSelection.addon.name,
              currentSelection.addon.version,
              currentSelection.siteId,
            )
          }
        />
        <Button
          icon="push_pin"
          tooltip="Pin default value as an override"
          disabled={false}
          onClick={() =>
            pinOverride(currentSelection.addon, currentSelection.siteId, currentSelection.path)
          }
        />
        <Button
          icon="lock_reset"
          tooltip="Remove override from the selected field"
          disabled={!currentSelection?.addon?.name || !currentSelection.hasOverride}
          onClick={() =>
            deleteOverride(currentSelection.addon, currentSelection.siteId, currentSelection.path)
          }
        />

        <Spacer>
          {currentSelection && (
            <ul className="settings-breadcrumbs">
              <li>{currentSelection.addon?.name}</li>
              {(currentSelection?.path || []).map((breadcrumb, index) => (
                <li key={index}>{breadcrumb}</li>
              ))}
            </ul>
          )}
        </Spacer>

        <Button
          onClick={() => {
            setShowHelp(!showHelp)
          }}
          icon="help"
        />
      </Toolbar>
    )
  }, [showHelp, currentSelection, localOverrides])

  return (
    <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
      <SplitterPanel size={80} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <Section style={{ maxWidth: 400 }}>
          <AddonList
            projectKey={projectKey}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            changedAddons={Object.keys(localData) /* Unused, AddonList doesn't have project&site */}
          />
          {showSites && (
            <SiteList
              value={selectedSites}
              onChange={setSelectedSites}
              style={{ maxHeight: 300 }}
              multiselect={true}
            />
          )}
        </Section>
        <Section className={showHelp && 'settings-help-visible'}>
          {settingsListHeader}
          <Section>
            <ScrollPanel
              className="transparent nopad"
              style={{ flexGrow: 1 }}
              scrollStyle={{ padding: 0 }}
            >
              {selectedAddons
                .filter((addon) => addon.version)
                .reverse()
                .map((addon) => {
                  const sites = showSites ? (selectedSites.length ? selectedSites : []) : ['_']

                  return sites.map((siteId) => {
                    const key = `${addon.name}|${addon.version}|${siteId}|${projectKey}`
                    return (
                      <Panel
                        key={key}
                        style={{ flexGrow: 0 }}
                        className="transparent nopad"
                        size={1}
                      >
                        <AddonSettingsPanel
                          addon={addon}
                          onChange={(data) =>
                            onSettingsChange(addon.name, addon.version, siteId, data)
                          }
                          onSetChangedKeys={(data) =>
                            onSetChangedKeys(addon.name, addon.version, siteId, data)
                          }
                          localData={localData[key]}
                          changedKeys={localOverrides[key]}
                          reloadTrigger={reloadTrigger[key]}
                          onSelect={setCurrentSelection}
                          projectName={projectName}
                          siteId={siteId === '_' ? null : siteId}
                        />
                      </Panel>
                    )
                  })
                })}

              <Spacer />
            </ScrollPanel>
          </Section>
        </Section>
      </SplitterPanel>
      <SplitterPanel>
        <Section className="wrap" style={{ minWidth: 300 }}>
          <Toolbar>
            <Spacer />
            <Button label="Dismiss all changes" icon="refresh" onClick={onDismissAllChanges} />
            <Button label="Save changes" icon="check" onClick={onSave} />
          </Toolbar>
          <SettingsChangesTable changes={localOverrides} />
        </Section>
      </SplitterPanel>
    </Splitter>
  )
}

export default AddonSettings
