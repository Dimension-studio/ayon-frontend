import { Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--base-gap-large);
`

export const Header = styled(Toolbar)``
export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`

export const PreviewPlayerWrapper = styled.div`
  flex: 1;
`

export const PreviewDetailsPanelWrapper = styled.div`
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  max-width: clamp(460px, 50vw, 600px);
  min-width: clamp(460px, 50vw, 600px);
  position: relative;
`
