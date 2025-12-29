const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Test User',
        username: 'testUser',
        password: 'secret'
      }
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
    await expect(page.getByLabel('username')).toBeVisible()
    await expect(page.getByLabel('password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'testUser', 'secret')
      await expect(page.getByText('Test User logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'testUser', 'wrong')

      const errorDiv = page.getByText('wrong username or password')
      await expect(errorDiv).toBeVisible()
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')

      await expect(page.getByText('Test User logged in')).not.toBeVisible()
    })
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'testUser', 'secret')
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'Test Blog', 'Test Author', 'https://testblog.com')
      await expect(page.getByText('Test Blog by Test Author')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      await createBlog(page, 'Likeable Blog', 'Test Author', 'https://testblog.com')
      
      const blogElement = page.locator('.blog').filter({ hasText: 'Likeable Blog' })
      await blogElement.getByRole('button', { name: 'view' }).click()
      
      await expect(blogElement.getByText('likes 0')).toBeVisible()
      
      await blogElement.getByRole('button', { name: 'like' }).click()
      
      await expect(blogElement.getByText('likes 1')).toBeVisible()
    })

    test('user can delete their own blog', async ({ page }) => {
      await createBlog(page, 'Deletable Blog', 'Test Author', 'https://testblog.com')
      
      const blogElement = page.locator('.blog').filter({ hasText: 'Deletable Blog' })
      await expect(blogElement).toBeVisible()
      
      await blogElement.getByRole('button', { name: 'view' }).click()
      
      const removeButton = blogElement.getByRole('button', { name: 'remove' })
      await expect(removeButton).toBeVisible()
      
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('Remove blog Deletable Blog by Test Author?')
        await dialog.accept()
      })
      
      await removeButton.click()
      
      await expect(blogElement).not.toBeVisible()
    })
  })

  describe('Blog ownership', () => {
    beforeEach(async ({ page, request }) => {
      await request.post('/api/testing/reset')
      await request.post('/api/users', {
        data: {
          name: 'First User',
          username: 'firstUser',
          password: 'secret'
        }
      })
      await request.post('/api/users', {
        data: {
          name: 'Second User',
          username: 'secondUser',
          password: 'secret'
        }
      })

      await page.goto('/')
    })

    test('only the creator sees the delete button', async ({ page }) => {
      await loginWith(page, 'firstUser', 'secret')
      await createBlog(page, 'Owned Blog', 'First User', 'https://testblog.com')
      
      const blogElement = page.locator('.blog').filter({ hasText: 'Owned Blog' })
      await blogElement.getByRole('button', { name: 'view' }).click()
      
      await expect(blogElement.getByRole('button', { name: 'remove' })).toBeVisible()
      
      await page.getByRole('button', { name: 'logout' }).click()
      
      await loginWith(page, 'secondUser', 'secret')
      
      const blogElementSecond = page.locator('.blog').filter({ hasText: 'Owned Blog' })
      await blogElementSecond.getByRole('button', { name: 'view' }).click()
      
      await expect(blogElementSecond.getByRole('button', { name: 'remove' })).not.toBeVisible()
    })
  })

  describe('Blog ordering', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'testUser', 'secret')
    })

    test('blogs are ordered by likes, most likes first', async ({ page }) => {
      await createBlog(page, 'Blog with 0 likes', 'Author', 'https://test.com')
      await createBlog(page, 'Blog with 2 likes', 'Author', 'https://test.com')
      await createBlog(page, 'Blog with 1 like', 'Author', 'https://test.com')

      const blogWith2Likes = page.locator('.blog').filter({ hasText: 'Blog with 2 likes' })
      await blogWith2Likes.getByRole('button', { name: 'view' }).click()
      await blogWith2Likes.getByRole('button', { name: 'like' }).click()
      await expect(blogWith2Likes.getByText('likes 1')).toBeVisible()
      await blogWith2Likes.getByRole('button', { name: 'like' }).click()
      await expect(blogWith2Likes.getByText('likes 2')).toBeVisible()

      const blogWith1Like = page.locator('.blog').filter({ hasText: 'Blog with 1 like' })
      await blogWith1Like.getByRole('button', { name: 'view' }).click()
      await blogWith1Like.getByRole('button', { name: 'like' }).click()
      await expect(blogWith1Like.getByText('likes 1')).toBeVisible()

      await expect(page.locator('.blog').first()).toContainText('Blog with 2 likes')
      await expect(page.locator('.blog').nth(1)).toContainText('Blog with 1 like')
      await expect(page.locator('.blog').nth(2)).toContainText('Blog with 0 likes')
    })
  })
})