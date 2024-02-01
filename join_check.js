const inlineKeyboard = [
    [{ text: 'Dorto Team', url: 'https://t.me/GQD99' }],
];


async function checkMemberShip(channel, userId, bot) {
    const channelMebers = await bot.getChatMember(channel, userId);
    console.log(channelMebers);
    if (channelMebers.status !== 'left') {
        return true;
    }
    bot.sendMessage(userId, `عليك الاشتراك في القناة لاستخدام البوت .`, {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        },
    })
    return false;
}

module.exports.checkMemberShip = checkMemberShip;
module.exports.inlineKeyboard = inlineKeyboard;
