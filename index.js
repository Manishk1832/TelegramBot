import express, { response } from "express";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import User from "./models/userSchema.js";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();


const app = express();

app.use(express.json());

const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";



mongoose.connect("mongodb://localhost:27017/telegrambot")
    .then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log('error in database connection', err);
    })


const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
    try {
        const chatId = msg.chat.id;

        const user = await User.findOne({ chatid: chatId })

        if (!user) {
            await bot.sendMessage(chatId, `Welcome to our Weather Reminder!\n Please enter your full name:`);

            bot.once('message', async (message) => {
                if (message.chat.id === chatId) {
                    const fullName = message.text;

                    await bot.sendMessage(chatId, `Thank you 😊 ${fullName},\n \n Now, please enter your city:`);

                    bot.once('message', async (message) => {
                        if (message.chat.id === chatId) {
                            const city = message.text;

                            await bot.sendMessage(chatId, `Thank you, Your city is ${city}. \n Now, please enter your country:`);

                            bot.once('message', async (message) => {
                                if (message.chat.id === chatId) {
                                    const country = message.text;

                                    const user = new User({
                                        chatid: chatId,
                                        username: fullName,
                                        city: city,
                                        country: country 
                                    });
                                    await user.save();

                                    await bot.sendMessage(chatId, "Thank you for providing your information!\n You can use /currentweather command to get weather report . \n You will get weather report in every day at 7:00 AM");
                                }

                            });
                        }
                    });
                }
            });
        }
        else {
            await bot.sendMessage(chatId, `Welcome back! ${user.username}!\n you can use /currentweather command to get weather report.`);

        }


    } catch (error) {
        console.error("Error processing /start command:", error);
    }
});

bot.onText(/\/currentweather/, async (msg) => {
    try {

        const chatId = msg.chat.id;

        const user = await User.findOne({ chatid: chatId })

        if (!user) {
            await bot.sendMessage(chatId, `Welcome to our Weather Reminder! \n Please enter your full name:`);

            bot.once('message', async (message) => {
                if (message.chat.id === chatId) {
                    const fullName = message.text;

                    await bot.sendMessage(chatId, `Thank you, ${fullName}. \n Now, please enter your city:`);

                    bot.once('message', async (message) => {
                        if (message.chat.id === chatId) {
                            const city = message.text;

                            await bot.sendMessage(chatId, `Thank your for providing your city is, ${city}. \n Now, please enter your country:`);

                            bot.once('message', async (message) => {
                                if (message.chat.id === chatId) {
                                    const country = message.text;

                                    const user = new User({
                                        chatid: chatId,
                                        username: fullName,
                                        city: city,
                                        country: country
                                    });
                                    await user.save();

                                    await bot.sendMessage(chatId, "Thank you for providing your information!");
                                }

                            });
                        }
                    });
                }
            });
        }
        else {
            const response = await fetch(apiUrl + user.city + "," + user.country + `&appid=${process.env.API_KEY}`);
            const data = await response.json();
            const temp = data.main.temp;
            const weather = data.weather[0].description;
            const humidity = data.main.humidity;
            const wind = data.wind.speed;
            const message = `Location: ${user.city}, ${user.country}\nTemperature: ${temp}°C\nWeather: ${weather}\nHumidity: ${humidity}%\nWind Speed: ${wind} m/s`;

            await bot.sendMessage(chatId, message);
        }


    }
    catch (error) {
        console.error("Error processing /Weather command:", error);
    }


})

cron.schedule("0 7 * * *", async () => {
    try {
        const users = await User.find();
        for (const user of users) {
            const response = await fetch(`${apiUrl}${user.city},${user.country}&appid=${process.env.API_KEY}`);
            const data = await response.json();
            const temp = data.main.temp;
            const weather = data.weather[0].description;
            const humidity = data.main.humidity;
            const wind = data.wind.speed;
            const message = `Location: ${user.city}, ${user.country}\nTemperature: ${temp}°C\nWeather: ${weather}\nHumidity: ${humidity}%\nWind Speed: ${wind} m/s`;
            await bot.sendMessage(user.chatid, message);
        }
    } catch (error) {
        console.error("Error sending weather report:", error);
    }
});




app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.listen(4000, () => console.log("Server started on port 3000"));