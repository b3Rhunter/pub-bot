// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { OpenAI } = require('openai');
const axios = require('axios');
const { startFishingGame, handleFishingInteraction } = require('./fishing.js');
const BlackjackGame = require('./blackjack.js');
const createEmbed = require('./embeds.js');
const { addAllMembers, setupMemberJoinListener, addMemberToDatabase, addPointsToUser, getUserBalance, transferPoints } = require('./points');

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

  client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const guildId = "1221953386296119347";
    await addAllMembers(client, guildId);
    setupMemberJoinListener(client);
  });

  client.on('messageCreate', async (message) => {
    if (!message.author.bot) {
      addMemberToDatabase(message.member);
      await addPointsToUser(message.author.id, 1);
    }
  });

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        await handleCommand(interaction);
    } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    }
});

async function handleCommand(interaction) {
    const { commandName } = interaction;
    if (commandName === 'gm') {
        await interaction.deferReply();
        const prompt = "Generate a short motivational speech in the style of R. Lee Ermey's Drill Seargant character from Full Metal Jacket. No more than 1 paragraph.";

        try {
            const assistant = await openai.beta.assistants.create({
                name: "Speech Generator",
                instructions: `You are a helpful assistant.`,
                model: "gpt-4-1106-preview"
            });

            const thread = await openai.beta.threads.create();
            await openai.beta.threads.messages.create(thread.id, { role: "user", content: prompt });
            const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });
            let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            while (runStatus.status !== 'completed') {
              await new Promise(resolve => setTimeout(resolve, 1000));
              runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            }
            const messages = await openai.beta.threads.messages.list(thread.id);
            const assistantMessage = messages.data.find(m => m.role === 'assistant');
            if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0].text || !assistantMessage.content[0].text.value) {
              throw new Error("No assistant message found in the thread.");
            }
            const speechText = assistantMessage.content[0].text.value.trim();
            const giphyResponse = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
                params: {
                    api_key: process.env.GIPHY_API_KEY,
                    q: 'R. Lee Ermey',
                    limit: 1,
                    offset: Math.floor(Math.random() * 10)
                }
            });
        
            const gifUrl = giphyResponse.data.data[0]?.images?.original?.url;
            if (!gifUrl) {
                throw new Error("Failed to fetch GIF");
            }
            const speechEmbed = new EmbedBuilder()
            .setColor(0xFFD700) 
            .setTitle("Good morning, soldier!")
            .setDescription(speechText)
            .setFooter({ text: "Stay frosty!" })
            .setImage(gifUrl); 

        await interaction.followUp({ embeds: [speechEmbed] });
        
        } catch (error) {
            console.error('Error generating motivational speech:', error);
            await interaction.followUp('There was an error trying to motivate you. Please try again later.');
        }
    } else if (commandName === 'chat') {
        await interaction.deferReply();
        const userPrompt = interaction.options.getString('prompt');

            try {
                const assistant = await openai.beta.assistants.create({
                    name: "Pub Bot",
                    instructions: `You are a helpful assistant. Ensure that all your responsed do not exceed 1000 characters.`,
                    model: "gpt-4-1106-preview"
                });
    
                const thread = await openai.beta.threads.create();
                await openai.beta.threads.messages.create(thread.id, { role: "user", content: userPrompt });
                const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });
                let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
                while (runStatus.status !== 'completed') {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
                }
                const messages = await openai.beta.threads.messages.list(thread.id);
                const assistantMessage = messages.data.find(m => m.role === 'assistant');
                if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0].text || !assistantMessage.content[0].text.value) {
                  throw new Error("No assistant message found in the thread.");
                }
                const aiText = assistantMessage.content[0].text.value.trim();
                const giphyResponse = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
                    params: {
                        api_key: process.env.GIPHY_API_KEY,
                        q: 'Starship Troopers',
                        limit: 1,
                        offset: Math.floor(Math.random() * 10)
                    }
                });
            
                const gifUrl = giphyResponse.data.data[0]?.images?.original?.url;
                if (!gifUrl) {
                    throw new Error("Failed to fetch GIF");
                }
                const chatEmbed = new EmbedBuilder()
                    .setColor(0xFFD700) 
                    .setDescription(aiText)
                    .setFooter({ text: "Would you like to know more?" })
                    .setImage(gifUrl); 
    
                await interaction.followUp({ embeds: [chatEmbed] });
            
            } catch (error) {
                console.error('Error generating motivational speech:', error);
                await interaction.followUp('There was an error trying to motivate you. Please try again later.');
            }
    } else if (commandName === 'fish') {
        await startFishingGame(interaction);
    } if (commandName === 'blackjack') {
        const bettingRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('bet_5').setLabel('5 POINTS').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bet_10').setLabel('10 POINTS').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bet_20').setLabel('20 POINTS').setStyle(ButtonStyle.Primary),
            );
    
        const betEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle('Blackjack: Place Your Bet')
            .setDescription('Select the amount of points you want to bet.');
    
        await interaction.reply({ embeds: [betEmbed], components: [bettingRow], ephemeral: false });
    } else if (commandName === 'balance') {
        const balance = await getUserBalance(interaction.user.id);
        await interaction.reply({ content: `Balance: ${balance} points`, ephemeral: true });
    } else if (commandName === 'tip') {
        const user = interaction.options.getUser('user');
        const points = interaction.options.getInteger('points');
      
        try {
          await transferPoints(interaction.user.id, user.id, points);
          await interaction.reply({ content: `${interaction.user.username} tipped ${user.toString()} ${points} points!`, ephemeral: false });
        } catch (error) {
          console.log(error);
          await interaction.reply({ content: `Failed to tip points: ${error.message}`, ephemeral: true });
        }
      } else if (commandName === 'embed') {
        await createEmbed.execute(interaction);
    }
}

const gameStates = {};

async function handleButtonInteraction(interaction) {
    const userId = interaction.user.id;
    if (interaction.customId.startsWith('bet_')) {
        const betAmount = parseInt(interaction.customId.split('_')[1]);
        const userPoints = await getUserBalance(interaction.user.id);

        if (betAmount > userPoints) {
            await interaction.reply({ content: `You don't have enough points. Your balance: ${userPoints} points.`, ephemeral: true });
            return;
        }

        await addPointsToUser(interaction.user.id, -betAmount);

        const game = new BlackjackGame(interaction, betAmount);
        gameStates[interaction.user.id] = game;
        await game.play(); 

    } else if (["hit", "stand"].includes(interaction.customId)) {
        if (gameStates[userId]) {
            const game = gameStates[userId];
            game.interaction = interaction;

            if (interaction.customId === 'hit') {
                await game.hit();
            } else if (interaction.customId === 'stand') {
                await game.stand();
            }
        } else {
            console.log("Attempted to play blackjack without an active game.");
        }
    } else if (interaction.customId === 'cast_line') {
        await handleFishingInteraction(interaction);
    }
}


client.login(token);
