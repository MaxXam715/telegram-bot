const { Telegraf, Markup, Extra } = require('telegraf'),
    bot = new Telegraf('6131084878:AAE4fZ4i2EfQnZu8jR_qrBs_jVmAD6EAO78'),
    dataQuest = require("./questions/data.json"),
    dataQuestLength = dataQuest.questions.length;

var chatId = 0,
    initQuiz = false,
    itemQuest,
    msgPreStart,
    dataRequestClient = {
        "name_quiz": dataQuest.name,
        "author_quiz": dataQuest.author,
        "data_creat_quiz": dataQuest.date_creat,
        "data_completion_quiz": "",
        "client": {
            "name": "",
            "phone": "",
            "id_telegram": ""
        },
        "answers": [],
    };

bot.launch(); // запуск бота

bot.command('start',  async (ctx) => { // принимаем команду "Старт (/start)"
    chatId = ctx.message.from.id;

    msgPreStart = await ctx.sendMessage(`🎲 Приготовьтесь пройти квиз: \n «<strong>${dataQuest.name}</strong>» \n\n📝 ${dataQuestLength + ` ` + declension(dataQuestLength, ['вопрос', 'вопроса', 'вопросов'])}\n⏱ 30 секунд на вопрос\n🤐 Ответы видны только Вам<i>\n\n🏁 Нажмите на кнопку ниже, когда будете готовы.Чтобы остановить квиз, отправьте команду /stop.</i>`, {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "Начать", callback_data: "startquiz" }]
            ],
            one_time_keyboard: true
        }
    });
});



bot.action('startquiz', async (ctx) => {

    await ctx.editMessageText(msgPreStart.text, {
        message_id: msgPreStart.message_id
    });

    let areYouReady = await ctx.reply('3️⃣ ...'),
        areYouReady_id = areYouReady.message_id;

    setTimeout(async function () {
        await ctx.editMessageText('2️⃣ готовы?', {
            message_id: areYouReady_id
        });
    }, 1000);

    setTimeout(async function () {
        await ctx.editMessageText('🚀 начали!', {
            message_id: areYouReady_id
        });
    }, 2000);

    setTimeout(async function () {
        await ctx.deleteMessage(areYouReady_id);
        await startQuiz(ctx);
    }, 3000);
});

async function startQuiz(ctx) {
    itemQuest = 0;
    initQuiz = true;

    await ctx.answerCbQuery("Квиз запущен");
    await quizNextQuest(ctx);
}

async function quizNextQuest(ctx) {
    if (initQuiz == true && itemQuest <= (dataQuestLength - 1)) {
        let keyButton = [],
            question = dataQuest.questions[itemQuest].question;

        for (var i in dataQuest.questions[itemQuest].answers ) {
            keyButton.push([{"text": dataQuest.questions[itemQuest].answers[i]}])
        }

        await ctx.sendMessage(`[${(itemQuest + 1)}/${dataQuestLength}] ` + question, {
            reply_markup: {
                keyboard: keyButton,
                resize_keyboard: true,
                one_time_keyboard: true,
                remove_keyboard: true
            }
        });

        let answerItem = await bot.on('message', async (ctx) => {
            if (dataQuest.questions[itemQuest].answers.includes(ctx.message.text) === true) {
                dataRequestClient.answers.push([{question: dataQuest.questions[itemQuest].question}, {answer: ctx.message.text}])
                console.log(dataRequestClient.answers);

                itemQuest++
                await quizNextQuest(ctx);

            } else if (dataQuest.questions[itemQuest].answers.includes(ctx.message.text) === false && ctx.message.text !== '/stop' && ctx.message.text !== '/start' && initQuiz == true) {
                await ctx.deleteMessage()
            }
        });

        return false;
    } else {
        itemQuest = 0;
        initQuiz = false;

        await endQuiz(ctx);
        return false;
    }
}

async function endQuiz(ctx) {
    // await ctx.answerCbQuery("Квиз запущен")
    await ctx.sendMessage("👍", {
        reply_markup: {
            remove_keyboard: true
        }
    });

    await ctx.sendMessage(`🏁 Квиз «<strong>${dataQuest.name}</strong>» закончен!\n\n✅ ${dataQuestLength + ` ` + declension(dataQuestLength, ['вопрос', 'вопроса', 'вопросов'])}\n⏱ 46.1 сек\n\n <i>Вы можете заново пройти этот тест, отправив команду /start</i>`, {
        parse_mode: "HTML",
    });

    await ctx.sendMessage("Пришлите свои контакты, чтобы мы с Вами связались", {
        reply_markup: {
            keyboard: [
                [
                    { text: "Отправить контакты", request_contact: true }
                ]
            ],
            resize_keyboard: true
        }
    });
}

bot.on('contact', async (ctx) => {
    dataRequestClient.client["name"] = ctx.update.message.contact.first_name;
    dataRequestClient.client["phone"] = ctx.update.message.contact.phone_number;
    dataRequestClient.client["id_telegram"] = ctx.update.message.contact.user_id;
    dataRequestClient["data_completion_quiz"] = new Date().toLocaleString('ru');

    console.log(dataRequestClient)

    await ctx.sendMessage("Благодарим Вас за уделенное время! Скоро с Вами свяжется наш специалист", {
        reply_markup: {
            remove_keyboard: true
        }
    });
});


function declension(number, txt) {
    var cases = [2, 0, 1, 1, 1, 2];
    return txt[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}