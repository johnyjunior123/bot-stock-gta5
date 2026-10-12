import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, PermissionsBitField } from "discord.js";
import process from "node:process";
import { FarmService } from "../../../cache/prisma.service.js";

createCommand({
	name: "criar-canal-farm",
	description: "Cria um canal privado de farm para um usuário",
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: "usuario",
			description: "Usuário que terá o canal de farm",
			type: ApplicationCommandOptionType.User,
			required: true,
		}
	],
	async run(interaction) {
		const guild = interaction.guild;
		if (!guild) return;
		await interaction.deferReply({ ephemeral: true });
		const user = interaction.options.getUser("usuario", true);
		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) {
			await interaction.editReply({ content: "❌ Não foi possível encontrar esse usuário no servidor." });
			return;
		}
		const displayName = member.displayName;
		try {
			await FarmService.ensureMember(user.id, guild.id);
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: "❌ Não foi possível cadastrar o usuário no banco. Tente novamente." });
			return;
		}
		const channelName = `${displayName}-${user.id}`.toLowerCase();
		const existingChannel = guild.channels.cache.find(
			ch => ch.type === ChannelType.GuildText && ch.name.endsWith(`-${user.id}`)
		);
		if (existingChannel) {
			return interaction.editReply({
				content: "✅ Esse usuário já possui um canal de farm e seu cadastro no banco está confirmado."
			});
		}
		try {
			await guild.channels.create({
				name: channelName,
				type: ChannelType.GuildText,
				parent: process.env.CATEGORY_ID!,
				permissionOverwrites: [
					{
						id: guild.roles.everyone,
						deny: [PermissionsBitField.Flags.ViewChannel],
					},
					{
						id: user.id,
						allow: [
							PermissionsBitField.Flags.ViewChannel,
							PermissionsBitField.Flags.SendMessages,
							PermissionsBitField.Flags.ReadMessageHistory,
						],
					},
					{
						id: process.env.GERENTE_ROLE_ID!,
						allow: [
							PermissionsBitField.Flags.ViewChannel,
							PermissionsBitField.Flags.SendMessages,
							PermissionsBitField.Flags.ReadMessageHistory,
						],
					},
					{
						id: process.env.ADMIN_ROLE_ID!,
						allow: [
							PermissionsBitField.Flags.SendMessages,
							PermissionsBitField.Flags.ReadMessageHistory,
							PermissionsBitField.Flags.ViewChannel
						],
					},
				],
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: "❌ Usuário cadastrado no banco, mas não foi possível criar o canal de farm. Verifique as permissões do bot e tente novamente." });
			return;
		}
		await interaction.editReply({
			content: `✅ Canal de farm criado e usuário **${user.username}** cadastrado no banco.`
		});

		return;
	}
});
