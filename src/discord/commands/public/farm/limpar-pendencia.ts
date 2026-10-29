import { createCommand } from "#base";
import { prisma } from "#database";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { auth } from "../../../../functions/auth.js";
import { materialChoices } from "../../../../functions/materials.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "limpar-pendencia",
    description: "Remove para todos as metas e pendências de um material",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "material",
            description: "Material cujas metas e pendências serão removidas para todos",
            type: ApplicationCommandOptionType.String,
            required: true,
            async autocomplete(interaction) {
                const names = await FarmService.customMaterialNames();
                return materialChoices(names, interaction.options.getFocused());
            },
        },
    ],
    async run(interaction) {
        if (!(await auth(interaction))) return;

        await interaction.deferReply({ ephemeral: true });
        const rawMaterial = interaction.options.getString("material", true);
        const material = await FarmService.resolveMaterial(rawMaterial);
        if (!material) {
            await interaction.editReply({ content: "❌ Material não encontrado. Selecione uma sugestão da lista." });
            return;
        }

        const result = await prisma.farmRequirement.deleteMany({
            where: { material },
        });

        if (result.count === 0) {
            await interaction.editReply({
                content: `✅ Não havia metas registradas para **${formatMaterial(material)}**; nenhuma pendência desse material é calculada.`,
            });
            return;
        }

        await interaction.editReply({
            content: `✅ Removidas **${result.count} meta(s) semanal(is)** de **${formatMaterial(material)}**. As pendências desse material foram removidas para todos.`,
        });
    },
});
