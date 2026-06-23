// Setup file for Jest tests
import mongoose from 'mongoose'

// Connect to test database before all tests
beforeAll(async () => {
  // Use a test database
  await mongoose.connect('mongodb://localhost:27017/test_ai_docs_assistant', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close()
})