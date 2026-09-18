import { createCommand } from "#base";
import { ApplicationCommandType } from "discord.js";
import { startFarmSession } from "../../../../cache/farm-cache.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { createFarmModal } from "../../../../functions/farm-modal.js";

createCommand({
    name: "entregar-materiais",
    description: "Registrar entrega de farm",
    type: ApplicationCommandType.ChatInput,

    async run(interaction) {
        if (!interaction.guildId) return;
        const requirements = await FarmService.currentRequirements();
        if (!requirements.length) {
            await interaction.reply({
                content: "❌ Nenhum material obrigatório configurado para esta semana. Peça à equipe para cadastrar uma meta com /alterar-valor.",
                ephemeral: true,
            });
            return;
        }
        const session = startFarmSession(`${interaction.guildId}:${interaction.user.id}`, requirements);
        await interaction.showModal(createFarmModal(session));
    },
});
