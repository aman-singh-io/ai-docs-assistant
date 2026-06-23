import { test, expect } from '@playwright/test'
import mongoose from 'mongoose'
import Document from '../../models/Document.js'
import User from '../../models/User.js'

// Test setup and teardown
let userId
let documentId

test.describe('Chapter Summaries Integration Tests', () => {
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

  test('should generate and store chapter summaries', async ({ page }) => {
    // Mock document with sufficient content for chapter detection
    const mockDocumentContent = `
      Chapter 1: Introduction to AI
      Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals.

      Key points:
      - AI systems can process large amounts of data
      - Machine learning is a subset of AI
      - Neural networks are used for pattern recognition

      Chapter 2: Machine Learning Fundamentals
      Machine learning is a method of data analysis that automates analytical model building.

      Key points:
      - Supervised learning uses labeled examples
      - Unsupervised learning finds hidden patterns in data
      - Reinforcement learning learns through interaction with environment

      Chapter 3: Deep Learning Applications
      Deep learning has revolutionized computer vision, natural language processing, and speech recognition.

      Key points:
      - Convolutional neural networks for image analysis
      - Recurrent neural networks for sequence modeling
      - Transformer models for text understanding
    `

    // Create a document with content that can be processed
    const document = new Document({
      userId: userId,
      title: 'Test AI Document',
      fileName: 'test_ai_document.pdf',
      filePath: '/uploads/test_ai_document.pdf',
      fileSize: 1024,
      extractedText: mockDocumentContent,
      status: 'ready'
    })

    const savedDocument = await document.save()
    documentId = savedDocument._id

    // Navigate to the document page and trigger chapter generation
    await page.goto('http://localhost:5173/documents/' + documentId)

    // Wait for page to load and find chapter summary section
    await page.waitForSelector('[data-testid="chapter-summary-section"]')

    // Click generate chapters button
    const generateButton = page.getByRole('button', { name: 'Generate' })
    await expect(generateButton).toBeVisible()
    await generateButton.click()

    // Wait for the chapter summaries to be generated and displayed
    await page.waitForSelector('[data-testid="chapter-summary-item"]', { timeout: 10000 })

    // Verify that chapters are displayed
    const chapterItems = await page.$$('data-testid="chapter-summary-item"')
    expect(chapterItems.length).toBeGreaterThan(0)

    // Verify specific chapter data is present
    const firstChapterTitle = await page.textContent('text=Introduction to AI')
    expect(firstChapterTitle).toContain('Introduction to AI')

    // Verify cache functionality by generating again
    await generateButton.click()

    // Should still show the same chapters (cached)
    const cachedChapters = await page.$$('data-testid="chapter-summary-item"')
    expect(cachedChapters.length).toBeGreaterThan(0)
  })

  test('should handle document with insufficient content', async ({ page }) => {
    // Create a short document
    const shortDocumentContent = 'This is a short document with only a few words.'

    const document = new Document({
      userId: userId,
      title: 'Short Test Document',
      fileName: 'short_test.pdf',
      filePath: '/uploads/short_test.pdf',
      fileSize: 1024,
      extractedText: shortDocumentContent,
      status: 'ready'
    })

    const savedDocument = await document.save()
    documentId = savedDocument._id

    // Navigate to the document page
    await page.goto('http://localhost:5173/documents/' + documentId)

    // Wait for page to load and find chapter summary section
    await page.waitForSelector('[data-testid="chapter-summary-section"]')

    // Try to generate chapters - should show error
    const generateButton = page.getByRole('button', { name: 'Generate' })
    await expect(generateButton).toBeVisible()
    await generateButton.click()

    // Should display an error message about document being too short
    await page.waitForSelector('[data-testid="error-message"]')

    const errorMessage = await page.textContent('[data-testid="error-message"]')
    expect(errorMessage).toContain('too short')
  })
})