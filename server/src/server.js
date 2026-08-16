import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sensusRouter from './routes/sensus.js'
import individuRouter from './routes/individu.js'
import spatialRouter from './routes/spatial.js'
import authRouter from './routes/auth.js'
import logsRouter from './routes/logs.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/sensus', sensusRouter)
app.use('/api/individu', individuRouter)
app.use('/api/spatial', spatialRouter)
app.use('/api/auth', authRouter)
app.use('/api/logs', logsRouter)

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ message: 'Terjadi kesalahan server.' })
})

app.listen(port, () => {
  console.log(`Backend BI Tabek Patah berjalan di http://localhost:${port}`)
})
