import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createContainer, isActionRowBuilder } from "@magicyan/discord";
import { userMention } from "discord.js";
import { FarmService } from "../../../cache/prisma.service.js";
import { auth } from "../../../functions/auth.js";
import { FormatDate } from "../../../functions/format-date.js";

createResponder({
    customId: "/form/:action/:id",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction, { action, id }) {
        const allowed = await auth(interaction);
        if (!allowed) return; // sai se não tiver permissão
        const container = createContainer({
            from: interaction
        })

        container.setColor(constants.colors.default)
        container.components.filter(c => isActionRowBuilder(c, "buttons")).flatMap(rows => rows.components)
            .forEach(button => button.setDisabled())
        const index = container.components.length

        container.setComponent(index, "Aguarde um instante...")

        await interaction.update({
            components: [container]
        })

        const finish = async (text: string) => {
            container.setComponent(index, text)
            await interaction.editReply({
                components: [container]
            })
        }

        if (action === "recuse") {
            container.setColor(constants.colors.danger)
            await FarmService.refuseFarm(Number(id));
            await finish(`O farm de ${userMention(id)} foi recusado. ${FormatDate(new Date())}`)
            return;
        }

        if (action === "approve") {
            container.setColor(constants.colors.success)
            await FarmService.approveFarm(Number(id));
            await finish(`Registro de ${userMention(id)} foi aceito. ${FormatDate(new Date())}`)
            return;
        }

        const { guild } = interaction;
        const member = await guild.members.fetch(id).catch(() => null)

        if (!member) {
            await finish("O membro não foi encontrado no servidor!")
            return
        }

        await member.roles
            .add(constants.roles.admin)
            .catch(() => null)

        container.setColor(constants.colors.success)
        await finish(`Registro Farm de ${member} aprovado!`)
    },
});