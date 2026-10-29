import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";

createResponder({
    customId: "/acao/desistir",
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
        if (!candidateIds.includes(interaction.user.id)) {
            await interaction.reply({
                content: "Você ainda não está inscrito nesta ação.",
                ephemeral: true,
            });
            return;
        }

        const withdrawalLine = content.match(/^\*\*Desistiram:\*\*(.*)$/m)?.[1] ?? "";
        const withdrawnIds = [...withdrawalLine.matchAll(/<@!?([0-9]+)>/g)].map(match => match[1]);
        const remainingCandidates = candidateIds
            .filter(id => id !== interaction.user.id)
            .map(id => `<@${id}>`);
        const withdrawals = [...withdrawnIds, interaction.user.id].map(id => `<@${id}>`);

        const updatedContent = content
            .replace(/^\*\*Candidatos:\*\*.*$/m, `**Candidatos:** ${remainingCandidates.join(", ") || "—"}`)
            .replace(/^\*\*Desistiram:\*\*.*$/m, `**Desistiram:** ${withdrawals.join(", ")}`);
        const withWithdrawalLine = content.includes("**Desistiram:**")
            ? updatedContent
            : `${updatedContent}\n**Desistiram:** ${withdrawals.join(", ")}`;

        await interaction.update({
            content: withWithdrawalLine,
            allowedMentions: { parse: [] },
        });
    },
});
