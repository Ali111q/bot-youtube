const express = require('express');
const port = 3948;
const app = express();
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

const TelegramBot = require("node-telegram-bot-api");
const ytsr = require('ytsr');
const { google } = require('googleapis');
const {checkMemberShip, inlineKeyboard} = require('./join_check');
const ytdl = require("ytdl-core");
const fs = require("fs");
const { spawn } = require('child_process');
const channelId = -1002017538955;
require("dotenv").config();
const YOUTUBE_API_KEY = 'AIzaSyAgsoJHE4i_F6eiN4tuKLmKWkhmzQlgnOs';
const youtube = google.youtube({ version: 'v3', auth: YOUTUBE_API_KEY });

// Replace YOUR_BOT_TOKEN with your actual bot token
// const token = process.env.B;
const token = "1415219808:AAGinp7uhtVG0AIkcdfG56ejozC9dwYKQQY";

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Function to search for a YouTube video by name
async function searchVideo(chatId, videoName) {

  youtube.search.list({
    part: 'snippet',
    q: videoName, // Your search query
    maxResults: 10,
  }, (err, data) => {
    if (err) {
      console.error('Error:', err);
      bot.sendMessage(chatId, 'data.data.items[0].id.videoId');
    } else {
      console.log(data.data);
      downloadVideo(chatId, `https://www.youtube.com/watch?v=${data.data.items[0].id.videoId}`);
      console.log('Videos:', data.items);
    }
  });
  // try {
  //   const filters = await ytsr.getFilters(videoName);
  //   const filter = filters.get('Type').get('Video');

  //   const options = {
  //     limit: 1,
  //   };

  //   const searchResults = await ytsr(filter.url, options);
  //   if (searchResults.items.length > 0) {
  //     const videoUrl = searchResults.items[0].url;
  //     downloadVideo(chatId, videoUrl);
  //   } else {
  //     bot.sendMessage(chatId, "No video found with that name.");
  //   }
  // } catch (error) {
  //   bot.sendMessage(chatId, "Error searching for video.");
  //   console.error(error);
  // }
}

// Function to download a YouTube video and send it as an MP3 file
async function downloadVideo(chatId, url) {try {
  // Get video information and thumbnail URL
  const message1 = await bot.sendMessage(chatId, "جاري جلب المعلومات ...", {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
  },

  });
  const videoInfo = await ytdl.getInfo(url);
  const title = videoInfo.player_response.videoDetails.title;
  
  // Sanitize the title for creating a valid file name
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Send a message to show the download progress
  const message = await bot.sendMessage(
    chatId,
    `*Downloading video:* ${title}`,
    {
      
     
      reply_markup: {
        inline_keyboard: inlineKeyboard,
    },

    }
  );
await bot.deleteMessage(chatId, message1.message_id);
  // Create a writable stream to store the video file
  const filePath = `${sanitizedTitle}-${chatId}.mp4`;
  const writeStream = fs.createWriteStream(filePath);

  // Start the download and pipe the video data to the writable stream
  ytdl(url, { filter: "audioonly" }).pipe(writeStream);

  // Set up an interval to update the message with the download progress every 5 seconds
  let progress = 0;
  const updateInterval = setInterval(() => {
    progress = writeStream.bytesWritten / (1024 * 1024);
    bot.editMessageText(
      `*Downloading video:* (${progress.toFixed(2)} MB) \u{1F4E6}`,
      {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: "Markdown",
         // use Markdown formatting
         reply_markup: {
          inline_keyboard: inlineKeyboard,
      },
      }
    );
  }, 2000);

  // When the download is complete, send the video and convert it to MP3
  writeStream.on("finish", () => {
    clearInterval(updateInterval); // stop updating the message

    const mp3FilePath = `${sanitizedTitle}-${chatId}.mp3`;

    const ffmpegProcess = spawn('ffmpeg', [
      '-i', filePath,
      '-vn', // Suppress video
      '-acodec', 'libmp3lame', // MP3 codec
      mp3FilePath
    ]);

    ffmpegProcess.on('close', () => {
      // Send the MP3 file
      bot
        .sendAudio(chatId, mp3FilePath, {
          caption: `@GQD99 🏯`,
          thumb: videoInfo.videoDetails.thumbnails[0].url,
          duration: videoInfo.videoDetails.lengthSeconds,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: inlineKeyboard,
        },

        })
        .then(() => {
          bot.deleteMessage(chatId, message.message_id)
          // Delete the temporary files
          fs.unlinkSync(filePath);
          fs.unlinkSync(mp3FilePath);
        })
        .catch((error) => {
          bot.sendMessage(chatId, "Error sending audio.");
          console.error(error);
        });
    });
  });
} catch (error) {
  bot.sendMessage(chatId, "Error downloading video.");
  console.error(error);
}
}


// Listen for the /yt command
bot.onText(/\يوت/, async (msg) => {
  const chatId = msg.chat.id;
  const videoName = msg.text.split(" ")[1];

  // if (!(await checkMemberShip(channelId, chatId, bot))) {
  //   console.log("joined");
  // return;
  // }
  if (videoName) {
    searchVideo(chatId, videoName);
  } else {
    bot.sendMessage(chatId, "Please provide a video name.");
  }
});

bot.onText(/\/start/,async (msg) => {
  const chatId = msg.chat.id;
  // if (!(await checkMemberShip(channelId, chatId, bot))) {
  //   console.log("joined");
  // return;
  // }

  // Send a message with the introduction and instructions
  bot.sendMessage(
    chatId,
    `⌁︙مرحبا عزيزي 
⌁︙ارسل كلمة يوت والبحث`
  );
});


