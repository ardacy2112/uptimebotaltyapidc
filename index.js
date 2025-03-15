require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = new Collection();

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command);
}

// Bot hazır olduğunda
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} çevrimiçi!`);

    // Slash komutları kaydet
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(command => command.data.toJSON()) }
        );
        console.log('🔗 Slash komutları başarıyla kaydedildi!');
    } catch (error) {
        console.error('❌ Komut kaydı hatası:', error);
    }

    // 3 dakikada bir ping
    setInterval(() => {
        const sites = require('./sites.json');
        sites.forEach(async site => {
            try {
                const start = Date.now();
                const response = await fetch(site.url);
                const latency = Date.now() - start;
                
                console.log(`🌐 ${site.url} yanıt süresi: ${latency}ms (${response.status})`);
            } catch (error) {
                console.error(`🔴 ${site.url} erişilemiyor: ${error.message}`);
            }
        });
    }, 180000);
});

// Slash komut işleyici
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: '❌ Komut çalıştırılırken bir hata oluştu!',
            ephemeral: true 
        });
    }
});

// Botu başlat
client.login(process.env.TOKEN);
