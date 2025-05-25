import axios from 'axios';

export const discordApi = (token: string) =>
  axios.create({
    baseURL: 'https://discord.com/api/v10',
    headers: {
      Authorization: `Bot ${token}`,
    },
  });
