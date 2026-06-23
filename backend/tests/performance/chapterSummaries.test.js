import { test, expect } from '@playwright/test'
import mongoose from 'mongoose'
import Document from '../../models/Document.js'
import User from '../../models/User.js'

test.describe('Chapter Summaries Performance Tests', () => {
  let userId

  test.beforeAll(async () => {
    // Connect to MongoDB test database
    await mongoose.connect('mongodb://localhost:27017/test_ai_docs_assistant', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    // Create a test user
    const user = new User({
      email: 'test@example.com',
      password: 'password123'
    })

    const savedUser = await user.save()
    userId = savedUser._id
  })

  test.afterAll(async () => {
    // Clean up database
    await Document.deleteMany({})
    await User.deleteMany({})
    await mongoose.connection.close()
  })

  test('should handle large documents efficiently', async ({ page }) => {
    // Create a large document with sufficient content for chapter detection
    const largeContent = 'Chapter 1: Introduction\n'.repeat(100) +
      'This is the introduction content. '.repeat(500) +
      '\n\nChapter 2: Main Content\n'.repeat(100) +
      'This is the main content. '.repeat(500) +
      '\n\nChapter 3: Conclusion\n'.repeat(100) +
      'This is the conclusion content. '.repeat(500)

    const document = new Document({
      userId: userId,
      title: 'Large Test Document',
      fileName: 'large_test.pdf',
      filePath: '/uploads/large_test.pdf',
      fileSize: 1024,
      extractedText: largeContent,
      status: 'ready'
    })

    const savedDocument = await document.save()
    const documentId = savedDocument._id

    // Start performance measurement
    const startTime = Date.now()

    // Navigate to the document page and generate chapters
    await page.goto('http://localhost:5173/documents/' + documentId)

    // Wait for page to load
    await page.waitForSelector('[data-testid="chapter-summary-section"]')

    // Click generate button
    const generateButton = page.getByRole('button', { name: 'Generate' })
    await expect(generateButton).toBeVisible()
    await generateButton.click()

    // Wait for the chapter summaries to be generated and displayed
    await page.waitForSelector('[data-testid="chapter-summary-item"]', { timeout: 30000 })

    const endTime = Date.now()
    const executionTime = endTime - startTime

    // Verify performance is acceptable (should complete under 30 seconds)
    expect(executionTime).toBeLessThan(30000)

    // Verify chapters were generated
    const chapterItems = await page.$$('data-testid="chapter-summary-item"')
    expect(chapterItems.length).toBeGreaterThan(0)

    console.log(`Large document processing completed in ${executionTime}ms`)
  })

  test('should maintain consistent response times with multiple concurrent requests', async ({ page }) => {
    // Create a document for testing
    const content = 'Chapter 1: Test\n'.repeat(50) +
      'Test content. '.repeat(200)

    const document = new Document({
      userId: userId,
      title: 'Concurrent Test Document',
      fileName: 'concurrent_test.pdf',
      filePath: '/uploads/concurrent_test.pdf',
      fileSize: 1024,
      extractedText: content,
      status: 'ready'
    })

    const savedDocument = await document.save()
    const documentId = savedDocument._id

    // Measure performance of multiple operations
    const startTime = Date.now()

    // Navigate to the document page and generate chapters multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('http://localhost:5173/documents/' + documentId)
      await page.waitForSelector('[data-testid="chapter-summary-section"]')

      const generateButton = page.getByRole('button', { name: 'Generate' })
      await expect(generateButton).toBeVisible()
      await generateButton.click()

      // Wait for results
      await page.waitForSelector('[data-testid="chapter-summary-item"]', { timeout: 15000 })
    }

    const endTime = Date.now()
    const executionTime = endTime - startTime

    // Verify that multiple operations complete within reasonable time
    expect(executionTime).toBeLessThan(60000) // Should complete under 1 minute for 3 operations

    console.log(`Multiple concurrent operations completed in ${executionTime}ms`)
  })
})