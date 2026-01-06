/**
 * Test External Command
 * Command: /hello
 */

const metadata = {
  name: 'Hello World',
  category: 'Test',
  description: 'A simple external command to test the loader'
};

function register(bot) {
  // Use a simple regex since we don't have access to the internal createCommandRegex here easily
  bot.onText(/\/hello(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    
    await bot.sendMessage(chatId, `👋 Hello ${firstName}! This is an external command working perfectly! 🚀`);
  });
}

module.exports = {
  metadata,
  register
};
