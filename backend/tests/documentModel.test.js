import mongoose from 'mongoose'
import Document from '../models/Document.js'

describe('Document Model', () => {
  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect('mongodb://localhost:27017/test_ai_docs_assistant', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear the database before each test
    await Document.deleteMany({})
  })

  it('should create a document with chapter summaries', async () => {
    const chapterData = [
      {
        chapterNumber: 1,
        title: 'Introduction',
        summary: 'This is an introduction to the document.',
        keyTakeaways: ['Key point 1', 'Key point 2']
      },
      {
        chapterNumber: 2,
        title: 'Main Content',
        summary: 'This covers the main content of the document.',
        keyTakeaways: ['Key point 3', 'Key point 4']
      }
    ]

    const document = new Document({
      userId: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      fileName: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileSize: 1024,
      extractedText: 'This is test content for chapter detection.',
      chapters: chapterData,
      hasChapterSummaries: true,
      chapterSummaryVersion: 'v1.0.0'
    })

    const savedDocument = await document.save()

    expect(savedDocument).toHaveProperty('chapters')
    expect(savedDocument.chapters).toHaveLength(2)
    expect(savedDocument.hasChapterSummaries).toBe(true)
    expect(savedDocument.chapterSummaryVersion).toBe('v1.0.0')
  })

  it('should validate chapter summary fields', async () => {
    const chapterData = [
      {
        chapterNumber: 1,
        title: 'Introduction',
        summary: 'This is an introduction to the document.',
        keyTakeaways: ['Key point 1', 'Key point 2']
      }
    ]

    const document = new Document({
      userId: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      fileName: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileSize: 1024,
      extractedText: 'This is test content for chapter detection.',
      chapters: chapterData,
      hasChapterSummaries: true
    })

    const savedDocument = await document.save()

    expect(savedDocument.chapters[0]).toHaveProperty('chapterNumber')
    expect(savedDocument.chapters[0]).toHaveProperty('title')
    expect(savedDocument.chapters[0]).toHaveProperty('summary')
    expect(savedDocument.chapters[0]).toHaveProperty('keyTakeaways')
  })

  it('should handle empty chapters array', async () => {
    const document = new Document({
      userId: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      fileName: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileSize: 1024,
      extractedText: 'This is test content for chapter detection.',
      chapters: [],
      hasChapterSummaries: false
    })

    const savedDocument = await document.save()

    expect(savedDocument.chapters).toHaveLength(0)
    expect(savedDocument.hasChapterSummaries).toBe(false)
  })

  it('should default chapterSummaryVersion when not provided', async () => {
    const document = new Document({
      userId: new mongoose.Types.ObjectId(),
      title: 'Test Document',
      fileName: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileSize: 1024,
      extractedText: 'This is test content for chapter detection.',
      chapters: []
    })

    const savedDocument = await document.save()

    expect(savedDocument.chapterSummaryVersion).toBe('v1.0.0')
  })
})