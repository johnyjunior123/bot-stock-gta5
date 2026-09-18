import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { getFarmSession } from "../../../cache/farm-cache.js";
import { createFarmModal } from "../../../functions/farm-modal.js";

createResponder({
    customId: "/farm/continue/:sessionId/:page",
    types: [ResponderType.Button],
    async run(interaction, { sessionId, page }) {
        const session = getFarmSession(`${interaction.guildId}:${interaction.user.id}`, sessionId, page);
        if (!session) {
            await interaction.reply({
                content: "❌ Esta etapa não está mais disponível. Use /entregar-materiais para iniciar uma nova entrega.",
                ephemeral: true,
            });
            return;
        }
        await interaction.showModal(createFarmModal(session));
    },
});
