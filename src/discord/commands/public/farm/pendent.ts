import { createCommand } from "#base";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { FormatDate } from "../../../../functions/format-date.js";

createCommand({
    name: "pendente",
    description: "Mostra os membros com entregas pendentes",
    type: ApplicationCommandType.ChatInput,

    async run(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const pendents = await FarmService.memberPendent();

        if (!pendents || pendents.length === 0) {
            await interaction.editReply({
                content: "📌 Nenhum membro com pendências."
            });
            return;
        }

        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply({
                content: "❌ Esse comando só pode ser usado dentro de um servidor."
            });
            return;
        }

        const sorted = pendents.sort((a, b) => {
            let totalA = 0
            let totalB = 0
            if (a) {
                totalA = Object.values(a.pending).reduce((s, v) => s + v, 0);
            }
            if (b) {
                totalB = Object.values(b.pending).reduce((s, v) => s + v, 0);
            }
            return totalB - totalA;
        });

        const top = sorted.slice(0, 10);

        const lines = await Promise.all(
            top.map(async (p, idx) => {
                if (p) {
                    const member = await guild.members.fetch(p.memberId).catch(() => null);
                    const name = member?.nickname ?? member?.user?.username ?? "Desconhecido";
                    return `**#${idx + 1}** ${name}\n` +
                        `Semanas: **${p.weeksActive}**\n` +
                        `Pend: M: ${p.pending.metal} • C: ${p.pending.copper} • R: ${p.pending.rubber} • P: ${p.pending.plastic} • V: ${p.pending.glass} • A: ${p.pending.pieceWeapon} • PP: ${p.pending.pistolPiece}`;
                }
                return
            })
        );

        const validLines = lines.filter(Boolean) as string[];

        const embed = new EmbedBuilder()
            .setTitle("📌 Membros Pendentes")
            .setDescription(`🗓️ Atualizado em: ${FormatDate(new Date())}`)
            .setFooter({ text: "Top 10 membros com pendências" });

        validLines.forEach((line) => {
            embed.addFields({
                name: `⠀`,
                value: line,
                inline: false
            });
        });

        await interaction.editReply({
            embeds: [embed]
        });

        return;
    },
});
