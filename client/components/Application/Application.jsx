import Header from 'Header'
import MessagesList from 'MessagesList'
import NewMessageForm from 'NewMessageForm'
import Indicator from 'Indicator'
import { fadeOutLastMessage, getCommand, getIdentifier, getTimestamp, removeAuthorLastMessage } from 'helpers'
import socketIoClient from 'socket.io-client/dist/socket.io'
import './Application.sass'

export default class Application extends React.Component {
  constructor (props) {
    super(props)

    const userIdentifier = getIdentifier()

    this.state = {
      isWriting: false,
      message: '',
      messages: [],
      othersNick: '',
      userIdentifier
    }

    this.handleMessageInputChange = this.handleMessageInputChange.bind(this)
    this.handleMessageFormSubmit = this.handleMessageFormSubmit.bind(this)
    this.handleIncomingMessage = this.handleIncomingMessage.bind(this)
    this.handleWritingIndicator = this.handleWritingIndicator.bind(this)

    this.socket = socketIoClient('/', { query: { userIdentifier } })
  }

  componentDidMount () {
    this.socket.on('message', this.handleIncomingMessage)
    this.socket.on('isWriting', this.handleWritingIndicator)
  }

  componentDidUpdate (prevProps, prevState) {
    const { userIdentifier, message } = this.state
    !!prevState.message !== !!message && this.socket.emit('isWriting', { userIdentifier, isWriting: !!message })
  }

  handleIncomingMessage (message) {
    if (!message || !message.type) return false;

    ['highlight', 'message', 'think'].includes(message.type) && this.addMessage(message)
    message.type === 'oops' && this.removeAuthorLastMessage(message.author)
    message.type === 'fadelast' && this.fadeOutLastMessage()
    message.type === 'countdown' && this.countdown(message)
    message.type === 'nick' && this.changeNick(message)
  }

  handleMessageFormSubmit (e) {
    e.preventDefault()

    const { message, userIdentifier } = this.state

    if (!message.replace(/\s/g, '').length) {
      return
    }

    const command = getCommand(message)
    const newMessage = { author: userIdentifier, content: message, type: 'message' }

    if (command) {
      newMessage.content = command.content
      newMessage.type = command.type
    }

    this.socket.emit('message', newMessage)
    this.setState({ message: '' })
  }

  handleMessageInputChange (e) {
    this.setState({ message: e.target.value })
  }

  handleWritingIndicator (e) {
    const { userIdentifier, isWriting } = this.state
    e.userIdentifier !== userIdentifier && e.isWriting !== isWriting && this.setState({ isWriting: e.isWriting })
  }

  addMessage (message) {
    this.setState({ messages: [...this.state.messages, message] })
  }

  changeNick (e) {
    e.author !== this.state.userIdentifier && this.setState({ othersNick: e.content })
  }

  countdown (message) {
    if (message.author === this.state.userIdentifier) {
      return
    }

    const [time, url] = message.content.split(' ')

    if (!time || !url) {
      return
    }

    let count = time

    const countdown = setInterval(() => {
      const newMessage = { ...message, type: 'message', content: count.toString(), timestamp: getTimestamp() }

      if (count === 0) {
        clearInterval(countdown)
        window.open(url)
        newMessage.content = `Opening new window and redirecting to ${url}...`
      }

      this.addMessage(newMessage)

      count--
    }, 1000)
  }

  fadeOutLastMessage () {
    this.setState({ messages: fadeOutLastMessage(this.state.messages) })
  }

  removeAuthorLastMessage (userIdentifier) {
    this.setState({ messages: removeAuthorLastMessage(userIdentifier, this.state.messages) })
  }

  render () {
    const { message, messages, userIdentifier, othersNick, isWriting } = this.state

    return (
      <div className='chat'>
        {othersNick && <Header nick={othersNick} />}

        <MessagesList messages={messages} userIdentifier={userIdentifier} />

        <Indicator nick={othersNick} isWriting={isWriting} />

        <NewMessageForm
          message={message}
          onChange={this.handleMessageInputChange}
          onSubmit={this.handleMessageFormSubmit}
        />
      </div>
    )
  }
}
