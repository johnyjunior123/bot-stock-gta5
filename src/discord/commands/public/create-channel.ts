import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, PermissionsBitField } from "discord.js";

const CATEGORY_ID = "1462481693184102633";
const GERENTE_ROLE_ID = "1458557122068611246";
const ADMIN_ROLE_ID = "1458557122068611246";

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
		const user = interaction.options.getUser("usuario", true);
		const member = await guild.members.fetch(user.id);
		const displayName = member.displayName;
		if (!guild) return;
		const channelName = `${displayName}-${user.id}`.toLowerCase();
		const existingChannel = guild.channels.cache.find(
			ch => ch.name === channelName
		);
		if (existingChannel) {
			return interaction.reply({
				ephemeral: true,
				content: "❌ Esse usuário já possui um canal de farm."
			});
		}
		await guild.channels.create({
			name: channelName,
			type: ChannelType.GuildText,
			parent: CATEGORY_ID,
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
					id: GERENTE_ROLE_ID,
					allow: [PermissionsBitField.Flags.ViewChannel],
				},
				{
					id: ADMIN_ROLE_ID,
					allow: [PermissionsBitField.Flags.ViewChannel],
				},
			],
		});
		await interaction.reply({
			ephemeral: true,
			content: `✅ Canal de farm criado para **${user.username}**`
		});

		return;
	}
});
