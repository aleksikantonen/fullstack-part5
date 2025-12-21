import { render, screen } from '@testing-library/react'
import Blog from './Blog'

test('renders blog title and author by default', () => {
  const blog = {
    title: 'Test Blog Title',
    author: 'Test Author',
    url: 'https://test.com',
    likes: 5,
    id: '123'
  }

  render(<Blog blog={blog} />)

  const titleAuthor = screen.getByText('Test Blog Title Test Author')
  expect(titleAuthor).toBeDefined()
})

test('does not render URL or likes by default', () => {
  const blog = {
    title: 'Test Blog Title',
    author: 'Test Author',
    url: 'https://test.com',
    likes: 5,
    id: '123'
  }

  render(<Blog blog={blog} />)

  const url = screen.queryByText('https://test.com')
  expect(url).toBeNull()

  const likes = screen.queryByText('likes 5')
  expect(likes).toBeNull()
})

