const { Client, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
                            partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

/**
 * @Author JirAWS
 * @YouTube Channel: https://www.youtube.com/c/JirAWS
 * 
 * @Disclaimer This code was written during a tutorial video. It's not intended to be perfect but functional.
 * 
 * @HowItWorks (Discord.js v13 ROCK SCISSOR PAPER BOT)
 * - 1. Provocation is sent by message
 * - 2. Duel is played using Discord Reactions Emojis
 * - 3. Result is displayed by message
 * - 4. Messages are cleaned by the BOT progressively
 * 
 * @Installation
 * - 1. npm install
 * - 2. add your token inside the config.json file
 * 
 * @Run
 * - 2. node bot.js
 */

// load properties file
const APP_CONFIG = require("./config.json");

const ROCK_EMOJI    = "✊";
const SCISSOR_EMOJI = "✌️";
const PAPER_EMOJI   = "✋";

// associations map
const RSP_CHOICES = {
    rock: ROCK_EMOJI,
    scissor: SCISSOR_EMOJI,
    paper: PAPER_EMOJI
}

var CURRENT_GAMES = []; // current games users have started
var OLD_MESSAGES  = []; // messages to be deleted automatically 

// verifing everying is ok when BOT has started
client.on("ready", () => {
    console.log("BOT is now Ready to Go");
});

// connect the code to our Discord Application (BOT)
client.login(APP_CONFIG.bot_token);

// listener for emojis reactions - this is where the provoked person answers
client.on("messageReactionAdd", async (reaction, user) => {

    var current_game = CURRENT_GAMES.find(game => game.reactMessage.id == reaction.message.id && game.targetUserId == user.id);

    if(!current_game) {
        return;
    }

    current_game.targetUserChoice = reaction._emoji.name;
    
    OLD_MESSAGES.push(current_game.reactMessage);

    var result = checkVictory(current_game);

    if(result == undefined) {
        console.error("Something wrong happened...");
        return;
    }

    var current_channel = client.channels.cache.get(reaction.message.channelId);

    if(result == 0) {
        // equals
        current_channel.send("It's a tie! Try again loosers! <@" + current_game.sourceUserId + "> <@" + current_game.targetUserId + ">");
    }
    else if(result == 1) {
        // src winner
        current_channel.send("<@" + current_game.targetUserId + ">" + current_game.targetUserChoice + " has been smashed by <@" + current_game.sourceUserId + ">" + current_game.sourceUserChoice);
    }
    else if(result == -1) {
        // trg winner
        current_channel.send("<@" + current_game.sourceUserId + ">" + current_game.sourceUserChoice + " has been smashed by <@" + current_game.targetUserId + ">" + current_game.targetUserChoice);
    }

    CURRENT_GAMES.splice(CURRENT_GAMES.indexOf(current_game), 1);

});

// listener for the provocation messages
client.on("messageCreate", message => {
    
    if(message.content.startsWith("!rsp")) {
        
        var splited_message = message.content.split(" ");

        if(splited_message.length != 3) {
            message.reply("Hey <@" + message.author.id + ">, please use the command like: !rsp <@yourFriend> <yourChoice>")
                   .then(() => message.delete());
        }
        else {

            var command = splited_message[0] === "!rsp";
            var mention = splited_message[1].length > 0 && splited_message[1].startsWith("<@") && splited_message[1].endsWith(">");

            var parsed_choice = splited_message[2].replaceAll('|', '');

            var choice = RSP_CHOICES[parsed_choice];
            
            if(!command || !mention) {
                message.reply("Hey <@" + message.author.id + ">, please use the command like: !rsp <@yourFriend> <yourChoice>")
                       .then(() => message.delete());
            }
            else if(!choice) {
                message.reply("Hey <@" + message.author.id + ">, the choice you entered is invalid, please use one of *[rock, scissor, paper]*")
                       .then(() => message.delete());
            }
            else {

                message.delete();

                var current_channel = client.channels.cache.get(message.channel.id);

                var current_source_user_id = message.member.id;
                var current_target_user_id = message.mentions.users.first().id;
               
                var new_game = {
                    sourceUserId: current_source_user_id,
                    sourceUserChoice: choice,

                    targetUserId: current_target_user_id,
                    targetUserChoice: undefined,

                    reactMessage: undefined
                }

                var existing_game = CURRENT_GAMES.find(game => game.sourceUserId == current_source_user_id && game.targetUserId == current_target_user_id);

                if(existing_game) {
                    CURRENT_GAMES.splice(CURRENT_GAMES.indexOf(existing_game), 1);
                }

                CURRENT_GAMES.push(new_game);

                var current_channel = client.channels.cache.get(message.channel.id);

                current_channel.send("🔥<@" + current_target_user_id + "> ! You've been challenged for a " + ROCK_EMOJI + " Rock " + SCISSOR_EMOJI + " Scissor " + PAPER_EMOJI + " Paper duel by <@" + current_source_user_id + "> ! Please select your choice below: ")
                               .then(sentMessage => { sentMessage.react(ROCK_EMOJI); sentMessage.react(SCISSOR_EMOJI); sentMessage.react(PAPER_EMOJI); new_game.reactMessage = sentMessage; });
               
                  
            }
        }

    }

})

/**
 * Return the winner of the provided parameter "game"
 * @param game, the game to be analyzed 
 * @returns
 * - 0 in case of equality
 * - 1 if the src_player wins
 * - (-1) if the trg_player wins
 */
 function checkVictory(game) {

    if(!game) return undefined;

    var current_source_choice = game.sourceUserChoice;
    var current_target_choice = game.targetUserChoice;

    // source win
    if(current_source_choice == ROCK_EMOJI && current_target_choice == SCISSOR_EMOJI){
        return 1;
    }
    else if(current_source_choice == SCISSOR_EMOJI && current_target_choice == PAPER_EMOJI){
        return 1;
    }
    else if(current_source_choice == PAPER_EMOJI && current_target_choice == ROCK_EMOJI){
        return 1;
    }

    // target win
    else if(current_source_choice == ROCK_EMOJI && current_target_choice == PAPER_EMOJI){
        return -1;
    }
    else if(current_source_choice == SCISSOR_EMOJI && current_target_choice == ROCK_EMOJI){
        return -1;
    }
    else if(current_source_choice == PAPER_EMOJI && current_target_choice == SCISSOR_EMOJI){
        return -1;
    }

    // equality
    else {
        return 0;
    }

}

/**
 * Loop on each Discord.Message elements in the OLD_MESSAGES array to delete them directly on the Discord Server
 */
function clearOldMessages() {
    OLD_MESSAGES.forEach(old_message => old_message.delete());
    OLD_MESSAGES = [];
}

// scheduler for OLD_MESSAGES deletion
setInterval(clearOldMessages, 10000);
