// blackjack.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { addPointsToUser } = require('./points');

class BlackjackGame {
    constructor(interaction, betAmount) {
        this.interaction = interaction;
        this.betAmount = betAmount;
        this.deck = this.createDeck();
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ rank, suit, value: this.assignValue(rank) });
            }
        }
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    assignValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank);
    }

    dealCards() {
        this.playerHand.push(this.deck.pop(), this.deck.pop());
        this.dealerHand.push(this.deck.pop(), this.deck.pop());
    }

    calculateScore(hand) {
        let score = hand.reduce((total, card) => total + card.value, 0);
        let aceCount = hand.filter(card => card.rank === 'A').length;
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    checkOutcome() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        if (playerScore > 21) return 'Bust! You lose.';
        if (dealerScore > 21) return 'Dealer busts! You win!';
        if (playerScore > dealerScore) return 'You win!';
        if (dealerScore > playerScore) return 'You lose.';
        return 'Push. It\'s a tie.';
    }

    async play() {
        this.dealCards();
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
    
        if (playerScore === 21 || dealerScore === 21) {
            this.gameOver = true;
            
            if (playerScore === 21 && dealerScore !== 21) {
                await addPointsToUser(this.interaction.user.id, this.betAmount * 2); 
            } else if (dealerScore === 21 && playerScore !== 21) {
            } else if (playerScore === 21 && dealerScore === 21) {
                await addPointsToUser(this.interaction.user.id, this.betAmount);
            }
        }
        await this.showStatus();
    }
    
    async hit() {
        if (!this.gameOver) {
            this.playerHand.push(this.deck.pop());
            if (this.calculateScore(this.playerHand) > 21) {
                this.gameOver = true;
            }
            await this.showStatus();
        }
    }

    async stand() {
        if (!this.gameOver) {
            let dealerScore = this.calculateScore(this.dealerHand);
            while (dealerScore < 17) {
                this.dealerHand.push(this.deck.pop());
                dealerScore = this.calculateScore(this.dealerHand);
            }
            this.gameOver = true;
            await this.showStatus();
        }
    }

    handToString(hand) {
        return hand.map(card => `${card.rank}${card.suit}`).join(', ');
    }

    async showStatus() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.gameOver ? this.calculateScore(this.dealerHand) : '?';
        const dealerHandString = this.gameOver ? this.handToString(this.dealerHand) : '?, ' + this.handToString(this.dealerHand.slice(1));
        const playerName = this.interaction.user.username;
        let color = 0xFFD700;
        let outcomeMessage = this.gameOver ? this.checkOutcome() : 'Your move';

        if (this.gameOver) {
            if (outcomeMessage === 'You win!') {
                color = 0x00FF00; 
            } else if (outcomeMessage.includes('You lose') || outcomeMessage === 'Bust! You lose.') {
                color = 0xFF0000;
            }
        }

        const embed = new EmbedBuilder()
        .setColor(color)
            .setTitle('Blackjack Game')
            .addFields(
                { name: `${playerName}`, value: this.handToString(this.playerHand) + ` (Score: ${playerScore})`, inline: false },
                { name: 'Dealer\'s Hand', value: dealerHandString + (this.gameOver ? ` (Score: ${dealerScore})` : ''), inline: false },
                { name: 'Outcome', value: this.gameOver ? this.checkOutcome() : 'Your move', inline: false }
            );

        const row = new ActionRowBuilder();
        if (!this.gameOver) {
            row.addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger),
            );
        }

        if (this.gameOver) {
            const outcome = this.checkOutcome();
            if (outcome.includes('You win')) {
                await addPointsToUser(this.interaction.user.id, this.betAmount * 2);
                embed.addFields({ name: 'Winnings', value: `You won ${this.betAmount * 2} points!`, inline: false });
            } else if (outcome.includes('You lose') || outcome.includes('Bust')) {
                embed.addFields({ name: 'Loss', value: `You lost ${this.betAmount} points.`, inline: false });
            }
        }

        if (this.interaction.replied || this.interaction.deferred) {
            await this.interaction.editReply({ embeds: [embed], components: !this.gameOver ? [row] : [] });
        } else {
            await this.interaction.reply({ embeds: [embed], components: !this.gameOver ? [row] : [] });
        }
    }
}

module.exports = BlackjackGame;


