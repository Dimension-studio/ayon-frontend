import { useEffect, useState, createContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import PubSub from '/src/pubsub'
import arrayEquals from '../helpers/arrayEquals'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { debounce } from 'lodash'
import { ayonApi } from '../services/ayon'
import RefreshToast from '../components/RefreshToast'

export const SocketContext = createContext()

const proto = window.location.protocol.replace('http', 'ws')
const wsAddress = `${proto}//${window.location.host}/ws`

export const SocketProvider = (props) => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  // get user logged in
  const [serverRestartingVisible, setServerRestartingVisible] = useState(false)
  const [topics, setTopics] = useState([])

  const wsOpts = {
    shouldReconnect: () => {
      if (user?.name) setServerRestartingVisible(true)
      return true
    },
  }

  const { sendMessage, readyState, getWebSocket } = useWebSocket(wsAddress, wsOpts)
  const project = useSelector((state) => state.project)
  const projectName = project.name

  const subscribe = () => {
    sendMessage(
      JSON.stringify({
        topic: 'auth',
        token: localStorage.getItem('accessToken'),
        subscribe: topics,
        project: projectName,
      }),
    )
  }

  useEffect(() => {
    console.log('Topics changed', topics)
    subscribe()
  }, [topics, projectName])

  const updateTopicsDebounce = debounce((newTopics) => {
    if (arrayEquals(topics, newTopics)) return
    console.log('WS: Subscriptions changed')
    setTopics(newTopics)
  }, 200)

  PubSub.setOnSubscriptionsChange((newTopics) => updateTopicsDebounce(newTopics))

  const [overloaded, setOverloaded] = useState(false)
  const [toastShown, setToastShown] = useState(false)

  // when overloaded is true, activate toast
  useEffect(() => {
    if (overloaded)
      if (!toastShown) {
        toast.warning(<RefreshToast />, {
          autoClose: false,
          closeButton: false,
        })
        setToastShown(true)
      }

    return () => {
      setOverloaded(false)
    }
  }, [overloaded, setOverloaded])

  // onMessage is a function that is called when a message comes in from the websocket
  // it is a closure that keeps track of the number of calls and the last call time
  let onMessage = (() => {
    let callCount = 0
    let lastCall = Date.now()

    return (message) => {
      // If the function is called more than 10 times per second, return early.
      if (callCount > 100) {
        setOverloaded(true)
        return console.log('WS OVERLOAD!!!!')
      }

      const data = JSON.parse(message.data)
      const { topic, sender, summary } = data || {}
      if (topic === 'heartbeat') return

      if (topic === 'server.restart_requested') setServerRestartingVisible(true)

      if (sender === window.senderId) {
        return // my own message. ignore
      }

      const now = Date.now()
      if (now - lastCall < 1000) {
        callCount += 1
      } else {
        callCount = 0
      }

      lastCall = now

      if (topic === 'shout' && data?.summary?.text) toast.info(summary.text)

      console.log('Event RX', data)
      PubSub.publish(topic, data)
    }
  })()

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      if (serverRestartingVisible) {
        setServerRestartingVisible(false)
        // clear ayonApi
        dispatch(ayonApi.util.resetApiState())
      }
      getWebSocket().onmessage = onMessage
      subscribe()
      // Dispatch a fake event to the frontend components
      // in case they depend on the event stream and may
      // miss some messages - this should force reloading
      // events using graphql
      PubSub.publish('client.connected', {
        topic: 'client.connected',
      })
    }
  }, [readyState, getWebSocket])

  return (
    <SocketContext.Provider
      value={{
        getWebSocket,
        readyState,
        serverRestartingVisible,
      }}
    >
      {props.children}
    </SocketContext.Provider>
  )
}
