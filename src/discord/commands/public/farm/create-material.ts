import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { FarmService } from "../../../../cache/prisma.service.js";
import { auth } from "../../../../functions/auth.js";
import { validateMaterialName } from "../../../../functions/materials.js";

createCommand({
    name: "criar_novo_material",
    description: "Cadastra um novo material para configurar a meta semanal",
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: "nome",
        description: "Nome do novo material, por exemplo: Explosivos",
        type: ApplicationCommandOptionType.String,
        required: true,
        minLength: 1,
        maxLength: 50,
    }],
    async run(interaction) {
        if (!(await auth(interaction))) return;
        let material;
        try {
            material = validateMaterialName(interaction.options.getString("nome", true));
        } catch (error) {
            await interaction.reply({ content: `❌ ${(error as Error).message}`, ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        try {
            const created = await FarmService.createMaterial(material);
            await interaction.editReply({ content: created
                ? `✅ Material **${material.name}** criado! Use /alterar-valor para definir a quantidade semanal necessária.`
                : "❌ Esse material já existe. Configure a quantidade em /alterar-valor.",
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "❌ Não foi possível cadastrar o material. Tente novamente." });
        }
    },
});
