/**
 * Created by thomasjeanneau on 16/07/2017.
 */

import _ from 'lodash'
import cron from 'cron'
import moment from 'moment-timezone'
import asyncForEach from 'async-foreach'

import { bots } from './config'
import {
  getAllMembers,
  getMoods,
  getMember,
  getEmoji,
  getColor
} from '../methods'
import giveMood from './giveMood'

const { CronJob } = cron
const { forEach } = asyncForEach

const askMood = new CronJob({
  cronTime: '00 00 15 * * 1-5',
  onTick: function () {
    _.forEach(bots, async (bot) => {
      const members = await getAllMembers(bot)
      _.forEach(members, ({ name, id }) => {
        bot.startPrivateConversation({ user: id }, (err, convo) => {
          if (err) return console.log(err)
          giveMood(convo, name, id)
        })
      })
    })
  },
  start: false,
  timeZone: 'Europe/Paris'
})

const sendMood = new CronJob({
  cronTime: '00,10,20,30,40,50 * * * * *',
  onTick: function () {
    _.forEach(bots, async (bot) => {
      try {
        const moods = await getMoods()
        const attachments = []
        if (moods.length >= 1) {
          forEach(moods, async function (mood) {
            const done = this.async()
            const { fields: user } = await getMember(mood['Member'][0])
            attachments.push({
              'title': `${getEmoji(mood['Level'])} <${user['Slack Handle']}> is at ${mood['Level']}/5`,
              'text': mood['Comment'],
              'color': getColor(mood['Level']),
              'thumb_url': user['Profile Picture'][0].url,
              'footer': moment(mood['Date']).tz('Europe/Paris').format('MMM Do [at] h:mm A')
            })
            done()
          }, () => bot.say({
            text: 'Hi dream team! Here is your mood daily digest :sparkles:',
            channel: '#dev-test',
            attachments
          }, (err) => {
            if (err) console.log(err)
          }))
        }
      } catch (e) {
        console.log(e)
        bot.say({
          text: `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``,
          channel: '#moods'
        })
      }
    })
  },
  start: false,
  timeZone: 'Europe/Paris'
})

askMood.start()
sendMood.start()
