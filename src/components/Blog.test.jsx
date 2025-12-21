import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Blog from './Blog'

describe('<Blog />', () => {
  const blog = {
    title: 'Test Blog Title',
    author: 'Test Author',
    url: 'https://test.com',
    likes: 5,
    id: '123'
  }

  beforeEach(() => {
    render(<Blog blog={blog} />)
  })

  test('renders blog title and author by default', () => {
    const titleAuthor = screen.getByText('Test Blog Title Test Author')
    expect(titleAuthor).toBeDefined()
  })

  test('does not render URL or likes by default', () => {
    const url = screen.queryByText('https://test.com')
    expect(url).toBeNull()

    const likes = screen.queryByText('likes 5')
    expect(likes).toBeNull()
  })

  test('renders URL and likes when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewButton = screen.getByText('view')
    await user.click(viewButton)

    const url = screen.getByText('https://test.com')
    expect(url).toBeDefined()

    const likes = screen.getByText('likes 5')
    expect(likes).toBeDefined()
  })

  test('clicking like button twice calls event handler twice', async () => {
    const mockUpdateBlog = vi.fn()

    render(<Blog blog={blog} updateBlog={mockUpdateBlog} />)

    const user = userEvent.setup()
    const viewButton = screen.getByText('view')
    await user.click(viewButton)

    const likeButton = screen.getByText('like')
    await user.click(likeButton)
    await user.click(likeButton)

    expect(mockUpdateBlog.mock.calls).toHaveLength(2)
  })
})

