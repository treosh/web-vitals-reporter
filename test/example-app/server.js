import express from 'express'
import bodyParser from 'body-parser'
import { join } from 'path'

// init express `app`

const port = 5000
const app = express()

app.use(express.static(join(__dirname, 'public')))

// collect analytics

let latestAnalytics = {}
app.post('/analytics', bodyParser.text(), (req, res) => {
  latestAnalytics = JSON.parse(req.body)
  console.log('receive POST: %s', JSON.stringify(latestAnalytics))
  res.sendStatus(201)
})

export const getLatestAnalytics = () => latestAnalytics
export const resetAnalytics = () => (latestAnalytics = {})

// listen

export const server = app.listen(port, () => {
  console.log('listening on %s', server.address())
})
