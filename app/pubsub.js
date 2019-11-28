const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-705753d2-595a-4fb2-8180-e03bec8d1ecf',
    subscribeKey: 'sub-c-948236f8-ef75-11e9-ad72-8e6732c0d56b',
    secretKey: 'sec-c-YjY3M2I2NTItNzcxYy00ZWNkLThhOWUtMDcyYjEyYWFjOTk5'
};

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;

        this.pubnub = new PubNub(credentials);

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

      
        this.pubnub.addListener(this.listener());
    }

    subscribeToChannels() {
        this.pubnub.subscribe({
            channels: [Object.values(CHANNELS)]
        });
    }

    publish({ channel, message }) {
        this.pubnub.publish({ message, channel });
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}.`);
                const parsedMessage = JSON.parse(message);

                switch(channel) {
                    case CHANNELS.BLOCKCHAIN:
                        this.blockchain.replaceChain(parsedMessage, true, () => {
                            this.transactionPool.clearBlockchainTransactions({
                                chain: parsedMessage
                            });
                        });
                        break;
                    case CHANNELS.TRANSACTION:
                        if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                        })) {
                        this.transactionPool.setTransaction(parsedMessage);
                        }
                        break;
                    default:
                        return;
                }
            }
        }
    }

    
}

// const testPubSub = new PubSub();
// testPubSub.publish({ channel: CHANNELS.TEST, message: 'hello pubnub' });

module.exports = PubSub;