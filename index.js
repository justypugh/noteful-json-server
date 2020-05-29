require('dotenv').config();
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const noteRouter = require('./src/note-services/note-router')
const folderRouter = require('./src/folder-services/folder-router')
const knex = require('knex')
const { PORT, DB_URL, NODE_ENV } = require('./config')

const app = express()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}))
app.use(cors())
app.use(helmet())

app.use('/notes', noteRouter)
app.use('/folders', folderRouter)

const db = knex({
  client: 'pg',
  connection: DB_URL,
})

app.set('db', db)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})