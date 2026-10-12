import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { materialChoices } from "../../../../functions/materials.js";
import { auth } from "../../../../functions/auth.js";
import { formatMaterial } from "../../../../functions/utils.js";

createCommand({
    name: "alterar-valor",
    description: "Altera a meta semanal de um material",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "material",
            description: "Material que deve ser alterado o valor",
            type: ApplicationCommandOptionType.String,
            required: true,
            async autocomplete(interaction) {
                const names = await FarmService.customMaterialNames();
                return materialChoices(names, interaction.options.getFocused());
            },
        },
        {
            name: "qntde",
            description: "Quantidade semanal",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 0,
            maxValue: 2147483647,
        },
    ],
    async run(interaction) {
        if (!(await auth(interaction))) return;
        await interaction.deferReply({ ephemeral: true });
        const material = await FarmService.resolveMaterial(interaction.options.getString("material", true));
        if (!material) {
            await interaction.editReply({ content: "❌ Material não encontrado. Selecione uma sugestão ou cadastre-o com /criar_novo_material." });
            return;
        }
        const qntde = interaction.options.getInteger("qntde", true);

        await FarmService.alterWeeklyMeta({
            material,
            weeklyMin: qntde,
        });

        await interaction.editReply({
            content: `✅ Meta semanal de **${formatMaterial(material)}** alterada para **${qntde}**.`,
        });
    },
});
