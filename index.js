const Discord = require('discord.js')
const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')
const cors = require('cors')

const statusRoutes = require('./routes/statusRoutes')
const queueRoutes = require('./routes/queueRoutes')
const countRoutes = require('./routes/countRoutes')
const userRouter = require('./routes/userRoute')

const session = require('express-session')
const redis = require('redis')
let RedisStore = require('connect-redis')(session)

const {
  prefix,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require('./config/config')

let redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
})

const app = express()
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => console.log('successfully connected to db'))
    .catch((e) => {
      console.log(e)
      setTimeout(connectWithRetry, 5000)
    })
}

connectWithRetry()
app.use(cors({}))

const BOT_TOKEN = require('./config/TOKEN')
const Status = require('./models/statusModel')
//const Queue = require('./models/queueModels')

//----------------------discord-------------------------------
class Client extends Discord.Client {
  queue = new Map()
}

const client = new Client()

client.commands = new Discord.Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}

console.log(client.commands)

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (msg) => {
  if (msg.author.bot || !msg.guild) return
  if (!msg.content.startsWith(prefix) || msg.author.bot) return
  const args = msg.content.slice(prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()
  if (!client.commands.has(command)) return

  // console.log(`--msg is ${msg}`)

  let BOT = await Status.find({ title: 'bot_status' })
  try {
    bot_status = BOT[0].status
    //console.log(`--in try is **${bot_status}**`)
  } catch (error) {
    var awesome_instance = new Status({ title: 'bot_status', status: 'on' })
    awesome_instance.save(function (err) {
      if (err) return handleError(err)
    })
    bot_status = awesome_instance.status
  }

  try {
    console.log(`--bot ran ${command}`)
    client.commands.get(command).execute(msg, bot_status)
  } catch (error) {
    console.error(error)
    msg.reply('there was an error trying to execute that command!')
  }
})
//-----------------------------------------------------
try {
  client.login(BOT_TOKEN)
} catch (error) {
  console.log('add token at ./config/TOKEN.js')
}

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      //https://www.npmjs.com/package/express-session --> ## Options
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
)

app.use(express.json())

function errorHandler(err, req, res, next) {
  // res.json({ err: err })
  if (err) {
    res.send('<h1> There was an error, please try again later</h1>')
  }
}

app.get('/', (req, res) => {
  res.send('<h1>bot discord</h1>')
  //req.session.viewCount
  console.log('yeah it ran')
})

//const protect = require('./middleware/authMiddleware')
//app.use(protect)
app.use('/api/v1/status', statusRoutes)
app.use('/api/v1/queue', queueRoutes)
app.use('/api/v1/count', countRoutes)
app.use('/api/v1/user', userRouter)

// app.use(errorHandler) // add next() to all controllers

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))
