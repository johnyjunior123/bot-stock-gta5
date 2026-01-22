import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { MaterialType } from "../../../../database/prisma/client.js";
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
            choices: [
                { name: "Metal", value: "metal" },
                { name: "Cobre", value: "copper" },
                { name: "Borracha", value: "rubber" },
                { name: "Plástico", value: "plastic" },
                { name: "Vidro", value: "glass" },
                { name: "Peça de Arma", value: "pieceWeapon" },
                { name: "Corpo de Arma", value: "pistolPiece" },
            ],
        },
        {
            name: "qntde",
            description: "Quantidade semanal",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 0,
        },
    ],
    async run(interaction) {
        if (!(await auth(interaction))) return;
        const material = interaction.options.getString("material", true) as MaterialType;
        const qntde = interaction.options.getInteger("qntde", true);

        await FarmService.alterWeeklyMeta({
            material,
            weeklyMin: qntde,
        });

        await interaction.reply({
            content: `✅ Meta semanal de **${formatMaterial(material)}** alterada para **${qntde}**.`,
            ephemeral: true,
        });
    },
});
