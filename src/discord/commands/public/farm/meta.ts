import { createCommand } from "#base";
import { prisma } from "#database";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
} from "discord.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "meta",
    description: "Mostra a meta semanal de entrega de materiais",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "semana",
            description: "Data da semana inicial (opcional)",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    async run(interaction) {
        const guildId = interaction.guildId!;
        let weekStart: Date | null = null;

        // Se o usuário passou uma data para filtrar a semana
        const weekInput = interaction.options.getString("semana");
        if (weekInput) {
            const parsed = new Date(weekInput);
            if (isNaN(parsed.getTime())) {
                return interaction.reply({
                    content: "❌ Data inválida. Use formato YYYY-MM-DD.",
                    ephemeral: true,
                });
            }
            weekStart = parsed;
        }

        // Busca as metas
        const whereClause = weekStart
            ? { startsAt: weekStart }
            : {};

        const requirements = await prisma.farmRequirement.findMany({
            where: whereClause,
            orderBy: { startsAt: "asc" },
        });

        if (!requirements.length) {
            return interaction.reply({
                content: "❌ Nenhuma meta encontrada.",
                ephemeral: true,
            });
        }

        // Agrupa por semana
        const metaByWeek: Record<string, Record<string, number>> = {};
        for (const req of requirements) {
            const weekKey = req.startsAt.toISOString().split("T")[0];
            if (!metaByWeek[weekKey]) {
                metaByWeek[weekKey] = {
                    metal: 0,
                    copper: 0,
                    rubber: 0,
                    plastic: 0,
                    glass: 0,
                    pieceWeapon: 0,
                    pistolPiece: 0,
                };
            }
            metaByWeek[weekKey][req.material] = req.weeklyMin;
        }

        // Formata para embed
        const description = Object.entries(metaByWeek)
            .map(([week, meta]) => {
                const lines = Object.entries(meta)
                    .map(([material, value]) => `• **${formatMaterial(material)}**: ${value}`)
                    .join("\n");
                return `📅 **Semana de ${week}**\n${lines}`;
            })
            .join("\n\n");

        await interaction.reply({
            embeds: [
                {
                    title: "📋 Meta Semanal de Materiais",
                    description,
                    color: 0x3498db,
                },
            ],
        });
        return
    },
});
