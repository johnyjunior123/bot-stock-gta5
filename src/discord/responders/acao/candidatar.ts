import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";

createResponder({
    customId: "/acao/candidatar",
    types: [ResponderType.Button],
    async run(interaction) {
        const content = interaction.message.content;
        const candidateLine = content.match(/^\*\*Candidatos:\*\*(.*)$/m)?.[1];
        if (candidateLine === undefined) {
            await interaction.reply({
                content: "Não foi possível localizar a lista de candidatos desta ação.",
                ephemeral: true,
            });
            return;
        }

        const candidateIds = [...candidateLine.matchAll(/<@!?([0-9]+)>/g)].map(match => match[1]);
        if (candidateIds.includes(interaction.user.id)) {
            await interaction.reply({
                content: "Você já está na lista de candidatos desta ação.",
                ephemeral: true,
            });
            return;
        }

        const withdrawalLine = content.match(/^\*\*Desistiram:\*\*(.*)$/m)?.[1];
        const withdrawnIds = [...(withdrawalLine ?? "").matchAll(/<@!?([0-9]+)>/g)].map(match => match[1]);
        if (withdrawnIds.includes(interaction.user.id)) {
            await interaction.reply({
                content: "Você já desistiu desta ação e sua desistência foi registrada.",
                ephemeral: true,
            });
            return;
        }

        const candidates = [...candidateIds, interaction.user.id].map(id => `<@${id}>`);
        const updatedContent = content.replace(
            /^\*\*Candidatos:\*\*.*$/m,
            `**Candidatos:** ${candidates.join(", ")}`,
        );

        await interaction.update({
            content: updatedContent,
            allowedMentions: { parse: [] },
        });
    },
});
