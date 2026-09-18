import { createCommand } from "#base";
import { FarmService } from "../../../../cache/prisma.service.js";
import { ApplicationCommandType } from "discord.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "meta",
    description: "Mostra a meta atual de entrega de materiais",
    type: ApplicationCommandType.ChatInput,

    async run(interaction) {
        const requirements = await FarmService.currentRequirements();

        if (!requirements.length) {
            return interaction.reply({
                content: "❌ Nenhuma meta encontrada.",
                ephemeral: true,
            });
        }

        const currentMeta: Record<string, number> = {};

        for (const req of requirements) {
            if (currentMeta[req.material] === undefined) {
                currentMeta[req.material] = req.weeklyMin;
            }
        }

        // Formata a descrição do embed
        const description = Object.entries(currentMeta)
            .map(
                ([material, value]) =>
                    `• **${formatMaterial(material)}**: ${value}`
            )
            .join("\n");

        await interaction.reply({
            embeds: [
                {
                    title: "📋 Meta Atual de Materiais",
                    description,
                    color: 0x3498db,
                },
            ],
        });
        return
    },
});
