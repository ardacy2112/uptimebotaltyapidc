require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const express = require('express');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Express sunucusu oluştur
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'online',
        bot: client.user?.tag || 'Bot başlatılıyor...',
        uptime: process.uptime()
    });
});

// Discord bot başlatma (GÜNCELLENDİ)
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds],
    presence: {
        activities: [{
            name: 'V3 En iyi uptime 2025',
            type: ActivityType.Watching
        }],
        status: 'idle'
    }
});

const commands = new Collection();

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command);
}

// Bot hazır olduğunda (GÜNCELLENDİ)
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} çevrimiçi!`);
    
    // Durum güncelleme fonksiyonu
    const updatePresence = () => {
        client.user.setActivity({
            name: 'V3 En iyi uptime 2025',
            type: ActivityType.Watching
        });
        console.log('🔄 Discord durumu güncellendi');
    };

    // İlk güncelleme
    updatePresence();
    
    // 30 dakikada bir otomatik güncelle
    setInterval(updatePresence, 1800000);

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
    setInterval(pingWebsites, 180000);
});

// Website ping fonksiyonu
async function pingWebsites() {
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
}

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

// Uygulamayı başlat
client.login(process.env.TOKEN)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🌍 Sunucu ${PORT} portunda çalışıyor`);
            console.log(`🔗 Uptime URL: http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('❌ Bot başlatılamadı:', error);
        process.exit(1);
    });
