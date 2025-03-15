const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Website izleme sistemini yönetin')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Yeni bir website ekle')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Website URL (http/https ile başlamalı)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('İzlenen siteleri listele'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sil')
                .setDescription('Website kaldır')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Kaldırılacak URL')
                        .setRequired(true))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const sitesPath = path.join(__dirname, '../sites.json');
        
        if (!fs.existsSync(sitesPath)) {
            fs.writeFileSync(sitesPath, '[]');
        }

        let sites = require(sitesPath);

        switch(subcommand) {
            case 'ekle':
                const newUrl = interaction.options.getString('url');
                
                if (!newUrl.startsWith('http')) {
                    return interaction.reply({ 
                        content: '❌ Geçersiz URL formatı (http/https ile başlamalı)',
                        ephemeral: true 
                    });
                }

                if (sites.some(s => s.url === newUrl)) {
                    return interaction.reply({ 
                        content: '⚠️ Bu URL zaten listede!',
                        ephemeral: true 
                    });
                }

                sites.push({ 
                    url: newUrl,
                    addedBy: interaction.user.tag,
                    date: new Date().toISOString()
                });

                fs.writeFileSync(sitesPath, JSON.stringify(sites, null, 2));
                return interaction.reply(`✅ **${newUrl}** izleme listesine eklendi!`);

            case 'liste':
                if (sites.length === 0) {
                    return interaction.reply('📭 İzlenen website bulunmuyor.');
                }
                
                const list = sites.map((s, i) => 
                    `${i+1}. ${s.url}\nEkleyen: ${s.addedBy}\nTarih: ${new Date(s.date).toLocaleDateString()}`
                ).join('\n\n');
                
                return interaction.reply(`📋 **İzlenen Siteler**\n${list}`);

            case 'sil':
                const removeUrl = interaction.options.getString('url');
                const initialLength = sites.length;
                sites = sites.filter(s => s.url !== removeUrl);

                if (sites.length === initialLength) {
                    return interaction.reply({ 
                        content: '❌ Bu URL listede bulunamadı!',
                        ephemeral: true 
                    });
                }

                fs.writeFileSync(sitesPath, JSON.stringify(sites, null, 2));
                return interaction.reply(`✅ **${removeUrl}** listeden kaldırıldı!`);
        }
    },
};
