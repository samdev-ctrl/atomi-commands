# External Commands System

The bot supports loading commands dynamically from a Git repository. This allows you to add, update, and manage custom commands without modifying the main bot code.

## Setup

### 1. Create a Command Repository

Create a new Git repository to store your custom commands. Example structure:

```
my-bot-commands/
├── hello.js
├── weather.js
└── custom.js
```

### 2. Configure the Bot

Add these environment variables to your `.env` file:

```bash
# Required: Your commands repository URL
EXTERNAL_COMMANDS_REPO=https://github.com/yourusername/your-commands-repo.git

# Optional: Branch to use (default: main)
EXTERNAL_COMMANDS_BRANCH=main
```

### 3. Start the Bot

The bot will automatically:
- Clone your commands repository on startup
- Load all command files
- Check for updates every 5 minutes
- Reload commands when changes are detected

## Command File Structure

Each command file must export a `register` function and optionally metadata:

```javascript
/**
 * Example Command: /hello
 * Category: Fun
 */

// Import the command helper for bot-specific filtering
const { createCommandRegex } = require('../src/utils/commandHelper');

// Command metadata (optional but recommended)
const metadata = {
  name: 'Hello Command',
  category: 'fun',
  description: 'Says hello to the user',
  commands: ['hello', 'hi']
};

/**
 * Register function - called when the bot loads this command
 * @param {TelegramBot} bot - The Telegram bot instance
 */
function register(bot) {
  // Simple command without arguments
  bot.onText(createCommandRegex('hello', '$'), async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    
    await bot.sendMessage(chatId, `👋 Hello, ${firstName}! Welcome to the bot!`);
  });
  
  // Command with arguments
  bot.onText(createCommandRegex('hello', ' (.+)'), async (msg, match) => {
    const chatId = msg.chat.id;
    const name = match[1];
    
    await bot.sendMessage(chatId, `👋 Hello, ${name}!`);
  });
}

// Export the register function and metadata
module.exports = {
  register,
  metadata
};
```

## Command Categories

**Note:** All external commands are automatically free. There is no premium restriction for external commands.

Organize your commands by category for better organization:

- **fun** - Entertainment and games
- **utility** - Useful tools
- **media** - Media download and processing
- **admin** - Administrative commands
- **economy** - Virtual economy features
- **ai** - AI-powered features
- **premium** - Premium-only features
- **custom** - Your custom category

## Advanced Examples

### Command with Database Access

```javascript
const { createCommandRegex } = require('../src/utils/commandHelper');

const metadata = {
  name: 'User Stats',
  category: 'utility',
  description: 'Show user statistics',
  commands: ['stats', 'mystats']
};

function register(bot) {
  bot.onText(createCommandRegex('stats', '$'), async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Access economy system (example)
    const economy = require('../src/utils/economy');
    const balance = economy.getBalance(userId);
    
    await bot.sendMessage(chatId, 
      `📊 *Your Stats*\n\n💰 Balance: $${balance}`,
      { parse_mode: 'Markdown' }
    );
  });
}

module.exports = { register, metadata };
```

### Command with Inline Buttons

```javascript
const { createCommandRegex } = require('../src/utils/commandHelper');

const metadata = {
  name: 'Menu Command',
  category: 'utility',
  description: 'Show interactive menu',
  commands: ['menu']
};

function register(bot) {
  bot.onText(createCommandRegex('menu', '$'), async (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Option 1', callback_data: 'menu_option1' },
          { text: '❌ Option 2', callback_data: 'menu_option2' }
        ],
        [
          { text: '🔙 Back', callback_data: 'menu_back' }
        ]
      ]
    };
    
    await bot.sendMessage(chatId, 
      '📋 *Main Menu*\n\nChoose an option:',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  });
  
  // Handle button callbacks
  bot.on('callback_query', async (query) => {
    if (query.data === 'menu_option1') {
      await bot.answerCallbackQuery(query.id, {
        text: 'You selected Option 1!',
        show_alert: true
      });
    }
  });
}

module.exports = { register, metadata };
```

### Premium Command

```javascript
const { createCommandRegex } = require('../src/utils/commandHelper');
const premiumStore = require('../src/utils/premiumStore');

const metadata = {
  name: 'Premium Feature',
  category: 'premium',
  description: 'Premium-only command',
  commands: ['premiumfeature']
};

function register(bot) {
  bot.onText(createCommandRegex('premiumfeature', '$'), async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check premium status
    if (!premiumStore.isPremium(userId)) {
      return bot.sendMessage(chatId,
        '⭐ This is a premium feature!\n\n' +
        'Use /premium to learn how to upgrade.',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Premium feature logic
    await bot.sendMessage(chatId, '✨ Premium feature activated!');
  });
}

module.exports = { register, metadata };
```

### Command with API Call

```javascript
const { createCommandRegex } = require('../src/utils/commandHelper');
const axios = require('axios');

const metadata = {
  name: 'Random Fact',
  category: 'fun',
  description: 'Get a random fact',
  commands: ['randomfact', 'fact']
};

function register(bot) {
  bot.onText(createCommandRegex('randomfact', '$'), async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Make API call
      const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
      const fact = response.data.text;
      
      await bot.sendMessage(chatId,
        `💡 *Random Fact*\n\n${fact}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Failed to fetch fact. Try again later.');
    }
  });
}

module.exports = { register, metadata };
```

## Command Patterns

### Command Suffix Guide

| Pattern | Description | Example Match |
|---------|-------------|---------------|
| `'$'` | Exact match, no arguments | `/help` |
| `' (.+)'` | Required argument | `/search query` |
| `' (.+)?'` | Optional argument | `/list` or `/list all` |
| `'(?:\\s+(.+))?'` | Optional space + args | `/start` or `/start help` |
| `'(?:\\s\|$)'` | Space or end | `/play` or `/play ` |

### Using createCommandRegex

Always use `createCommandRegex()` to ensure your commands only respond to your bot:

```javascript
// ✅ Good - filters bot mentions
bot.onText(createCommandRegex('mycommand', ' (.+)'), handler);

// ❌ Bad - responds to any bot mention
bot.onText(/\/mycommand(?:@\w+)? (.+)/, handler);
```

## Testing Your Commands

1. Push your command files to your Git repository
2. Wait for the bot to auto-update (max 5 minutes) or restart the bot
3. Test the commands in Telegram:
   - `/yourcommand` - Should work
   - `/yourcommand@yourbotname` - Should work
   - `/yourcommand@anotherbotname` - Should be ignored

## Viewing Loaded Commands

Use the `/externalcommands` command (if implemented) to see:
- Number of external commands loaded
- Command files and their status
- Last update time
- Repository information

## Best Practices

1. **Use Metadata**: Always include metadata for better organization
2. **Error Handling**: Wrap async operations in try-catch blocks
3. **Bot Filtering**: Always use `createCommandRegex()` for commands
4. **Command Names**: Use lowercase, descriptive names
5. **Documentation**: Comment your code for maintainability
6. **Testing**: Test commands before pushing to production
7. **Dependencies**: Document any required npm packages
8. **Permissions**: Check user permissions for admin commands
9. **Rate Limiting**: Implement cooldowns for resource-intensive commands
10. **Cleanup**: Clean up temporary files and resources

## Troubleshooting

### Commands not loading?

1. Check environment variables are set correctly
2. Verify repository URL is accessible
3. Check bot logs for error messages
4. Ensure command files have proper structure
5. Verify the `register` function is exported

### Commands not responding?

1. Check command regex patterns
2. Verify bot username is correct
3. Test with and without @mention
4. Check for JavaScript errors in command code
5. Ensure required dependencies are installed

### Updates not applying?

1. Wait for auto-update cycle (5 minutes)
2. Restart the bot to force update
3. Check Git repository for recent commits
4. Verify branch name is correct
5. Check for Git authentication issues

## Security Considerations

1. **Code Review**: Review all external commands before loading
2. **Repository Access**: Use private repositories for sensitive commands
3. **Secrets**: Never hardcode API keys or tokens
4. **Validation**: Validate all user inputs
5. **Rate Limiting**: Implement rate limits to prevent abuse
6. **Error Messages**: Don't expose sensitive information in errors
7. **Permissions**: Check user permissions before executing admin commands

## Example Repository Structure

```
my-bot-commands/
├── README.md
├── fun/
│   ├── joke.js
│   ├── meme.js
│   └── game.js
├── utility/
│   ├── calculator.js
│   ├── reminder.js
│   └── convert.js
├── admin/
│   ├── broadcast.js
│   └── stats.js
└── package.json  # Optional: document required dependencies
```

## Support

For issues or questions:
1. Check this documentation
2. Review example commands
3. Check bot logs for errors
4. Test commands locally first
5. Open an issue in your commands repository
