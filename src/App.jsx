import { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import Notification from './components/Notification'
import BlogForm from './components/BlogForm'
import Togglable from './components/Togglable'
import blogService from './services/blogs'
import loginService from './services/login'

const App = () => {
  const [blogs, setBlogs] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [notificationType, setNotificationType] = useState(null)

  useEffect(() => {
    blogService.getAll().then(blogs =>
      setBlogs(blogs)
    )  
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedBlogappUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      if (!user.id && user.token) {
        const tokenPayload = JSON.parse(atob(user.token.split('.')[1]))
        user.id = tokenPayload.id
      }
      setUser(user)
      blogService.setToken(user.token)
    }
  }, [])

  const handleLogin = async event => {
    event.preventDefault()

    try {
      const user = await loginService.login({ username, password })
      
      const tokenPayload = JSON.parse(atob(user.token.split('.')[1]))
      const userWithId = { ...user, id: tokenPayload.id }
      
      window.localStorage.setItem(
        'loggedBlogappUser', JSON.stringify(userWithId)
      )

      blogService.setToken(user.token)
      setUser(userWithId)
      setUsername('')
      setPassword('')
    } catch {
      setErrorMessage('wrong username or password')
      setNotificationType('error')
      setTimeout(() => {
        setErrorMessage(null)
        setNotificationType(null)
      }, 5000)
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedBlogappUser')
    setUser(null)
  }

  const blogFormRef = useRef()

  const addBlog = (blogObject) => {
    blogFormRef.current.toggleVisibility()
    blogService.create(blogObject)
      .then((returnedBlog) => {
        setBlogs(blogs.concat(returnedBlog))
        setErrorMessage(`a new blog ${returnedBlog.title} by ${returnedBlog.author} added`)
        setNotificationType('success')
        setTimeout(() => {
          setErrorMessage(null)
          setNotificationType(null)
        }, 5000)
      })
      .catch((error) => {
        setErrorMessage(`Failed to create blog: ${error.response?.data?.error || error.message}`)
        setNotificationType('error')
        setTimeout(() => {
          setErrorMessage(null)
          setNotificationType(null)
        }, 5000)
      })
  }

  const updateBlog = (id, blogObject) => {
    blogService.update(id, blogObject)
      .then((returnedBlog) => {
        const originalBlog = blogs.find(b => b.id === id)
        const updatedBlog = {
          ...returnedBlog,
          user: originalBlog?.user || returnedBlog.user
        }
        setBlogs(blogs.map(blog => blog.id !== id ? blog : updatedBlog))
      })
      .catch((error) => {
        setErrorMessage(`Failed to update blog: ${error.response?.data?.error || error.message}`)
        setNotificationType('error')
        setTimeout(() => {
          setErrorMessage(null)
          setNotificationType(null)
        }, 5000)
      })
  }

  const deleteBlog = (id) => {
    blogService.remove(id)
      .then(() => {
        setBlogs(blogs.filter(blog => blog.id !== id))
      })
      .catch((error) => {
        setErrorMessage(`Failed to delete blog: ${error.response?.data?.error || error.message}`)
        setNotificationType('error')
        setTimeout(() => {
          setErrorMessage(null)
          setNotificationType(null)
        }, 5000)
      })
  }

  if (user === null) {
    return (
      <div>
        <h2>Log in to application</h2>
        <Notification message={errorMessage} type={notificationType} />
        <form onSubmit={handleLogin}>
          <div>
            <label>
              username
              <input
                type="text"
                value={username}
                onChange={({ target }) => setUsername(target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              password
              <input
                type="password"
                value={password}
                onChange={({ target }) => setPassword(target.value)}
              />
            </label>
          </div>
          <button type="submit">login</button>
        </form>
      </div>
    )
  }

  const blogForm = () => (
    <Togglable buttonLabel="create new blog" ref={blogFormRef}>
      <BlogForm createBlog={addBlog} />
    </Togglable>
  )

  const blogsToShow = [...blogs].sort((a, b) => b.likes - a.likes)

  return (
    <div>
      <h2>blogs</h2>
      <Notification message={errorMessage} type={notificationType} />
      <p>{user.name} logged in <button onClick={handleLogout}>logout</button></p>
      {blogForm()}
      {blogsToShow.map(blog =>
        <Blog key={blog.id} blog={blog} updateBlog={updateBlog} deleteBlog={deleteBlog} user={user} />
      )}
    </div>
  )
}

export default App