# BirthdayBot

A bot that sends notifications for upcoming birthdays to a Discord channel


## Architecture

BirthdayBot is separated into 4 microservices, each with their own role and responsibilities.

![BirthdayBot architecture](https://github.com/Ionaru/birthday-bot/raw/main/docs/birthday-bot.png)


## Deployment

This project is deployed with [Docker Compose](https://docs.docker.com/compose/).

### Environment variables

Configuration for gets its configuration from several environment variables, they are all required for the project to run.

- `DEBUG`: Parameters for the debug package. See <https://www.npmjs.com/package/debug> for more information.
- `BB_DB_VOLUME`: A directory where the database will be placed.
- `BB_API_URL`: The URL the API service is accessible from.
- `BB_API_PORT`: The port the API service will listen on.
- `BB_STORAGE_URL`: The URL the Storage service is accessible from.
- `BB_STORAGE_PORT`: The port the Storage service will listen on.
- `BB_DISCORD_CLIENT_URL`: The URL the Discord Client service is accessible from.
- `BB_DISCORD_CLIENT_PORT`: The port the Discord Client service will listen on.
- `BB_DISCORD_GUILDS`: A comma-separated list of Discord Guild IDs that the bot will register commands in.
- `BB_DISCORD_TOKEN`: Discord bot Token.
- `BB_DISCORD_ID`: Discord application Client ID.
- `BB_DISCORD_KEY`: Discord application Public Key.
