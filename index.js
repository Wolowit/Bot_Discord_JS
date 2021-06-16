const Discord = require('discord.js')
const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')

const postRoutes = require('./routes/postRoutes')
const queueRoutes = require('./routes/queueRoutes')
const countRoutes = require('./routes/countRoutes')
const BOT_TOKEN = require('./config/TOKEN')
const {
  prefix,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
} = require('./config/config')

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

  // Post.find({ title: 'bot_status' }, function (err, author) {
  //   if (err) throw err
  //   bot_status = author[0].body
  //   console.log(author[0].body) //output => 'on'
  // })
  // console.log(`result = ${bot_status}`)
}
//const { log } = require('console')

connectWithRetry()
//bot_start()

//-----------------------database testing stuff------------------------------
const Post = require('./models/postModels')
const Queue = require('./models/queueModels')

// var awesome_instance = new Queue({
//   song: 'Astrid S - It´s Ok If You Forget Me (Live Acoustic)',
//   url: 'https://youtu.be/4F923YigtG8',
// })
// awesome_instance.save(function (err) {
//   if (err) return handleError(err)
// })
// console.log(awesome_instance.body)

// Queue.find({ song: 'Olivia Rodrigo - deja vu (Live)' }, function (err, author) {
//   if (err) throw err
//   //bot_status = author[0].song
//   console.log(author[0].url)
// })

Queue.find()
  //.sort({ _id: 1 })
  .exec(function (err, post) {
    if (err) throw err
    //console.log(post.length)
    //console.log(post[0]._id)
  })

Queue.find()
  //.sort({ _id: 1 })
  .exec(function (err, post) {
    if (err) throw err
    //bot_status = author[0].song
    //console.log(post[1].song)
    //console.log(undefined == post[2])
  })

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

  let BOT = await Post.find({ title: 'bot_status' })
  try {
    bot_status = BOT[0].body
    //console.log(`--in try is **${bot_status}**`)
  } catch (error) {
    var awesome_instance = new Post({ title: 'bot_status', body: 'on' })
    awesome_instance.save(function (err) {
      if (err) return handleError(err)
    })
    console.log(awesome_instance.body)
    bot_status = awesome_instance.body
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

client.login(BOT_TOKEN)

app.get('/', (req, res) => {
  res.send('<h1>bot discord</h1>')
  console.log('yeah it ran')
})

app.use(express.json())

app.use('/api/v1/posts', postRoutes)
app.use('/api/v1/queue', queueRoutes)
app.use('/api/v1/count', countRoutes)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on port ${port}`))
