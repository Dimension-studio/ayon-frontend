import React, { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMenuOpen } from '/src/features/context'
import * as Styled from './Menu.styled'

const MenuContainer = ({ id, target, children, ...props }) => {
  const dispatch = useDispatch()
  const isOpen = useSelector((state) => state.context.menuOpen) === id
  const handleClose = () => dispatch(setMenuOpen(false))
  const dialogRef = useRef(null)

  // when the menu is open, focus the first element
  // this is used to allow keyboard navigation
  useEffect(() => {
    if (isOpen) {
      const first = dialogRef.current
      first && first.focus()
    }
  }, [isOpen, dialogRef])

  // if target is a element, find it's position bottom and right
  // then set the style of the dialog to position it there

  const pos = useMemo(() => {
    let pos = { top: 0, right: 0 }
    if (target) {
      const rect = target.getBoundingClientRect()
      pos = {
        top: rect.top + rect.height + 8,
        right: window.innerWidth - rect.right,
      }
    }
    return pos
  }, [target])

  // attach the handleClose as a prop to each child
  children = React.Children.map(children, (child, i) => {
    return React.cloneElement(child, { onClose: handleClose, index: i })
  })

  const handleKeyDown = (e) => {
    // close on esc
    if (e.key === 'Escape') handleClose()
  }

  return (
    <Styled.Dialog
      open={isOpen}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      {...props}
      ref={dialogRef}
    >
      <Styled.DialogContent style={{ ...pos }}>{children}</Styled.DialogContent>
    </Styled.Dialog>
  )
}

export default MenuContainer
