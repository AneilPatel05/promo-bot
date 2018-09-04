const dsteem = require('dsteem')
require('dotenv').load();

// bot is configured with enviroment variables

// the username of the promoter
const PROMOTER =  process.env['PROMOTER'] || die('PROMOTER missing')
// the owner private key of the bot
const OWNER_PRIVATE_KEY = process.env['OWNER_PRIVATE_KEY'] || die('OWNER_PRIVATE_KEY missing')
// the target account to follow 
const TARGET_ACCOUNT =process.env['TARGET_ACCOUNT'] || die('TARGET_ACCOUNT missing')
// Memo for Promotion
const TRANSFER_MEMO =  process.env['TRANSFER_MEMO'] || die('TRANSFER_MEMO missing')

// setup the dsteem client, you can use other nodes, for example gtg's public node at https://gtg.steem.house:8090
const client = new dsteem.Client('https://gtg.steem.house:8090')

// deserialize the posting key (in wif format, same format as you find on the steemit.com interface)
const key = dsteem.PrivateKey.from(OWNER_PRIVATE_KEY)

// create a new readable stream with all operations, we use the 'latest' mode since
// we don't care about reversed block that much for a simple vote bot
// and this will make it react faster to the votes of it's master
const stream = client.blockchain.getOperationsStream({mode: dsteem.BlockchainMode.Latest})

console.log(`Following ${ TARGET_ACCOUNT } For New Transfers`)

// the stream will emit one data event for every operatio that happens on the steemit blockchain
stream.on('data', (operation) => {

    // we only care about vote operations made by the user we follow
    if (operation.op[0] == 'transfer') {
        let transfer = operation.op[1]
        if (transfer.to === TARGET_ACCOUNT) {
            console.log(`${ transfer.from } sent money to ${ transfer.to }`)            
            //TODO - Check for Transfers from other exchange accounts and skip promotion 
            
            // broadcast the promotional transfer to the network
            client.broadcast.transfer({
                amount:'0.001 SBD',
                from:PROMOTER,
                to:transfer.from,
                memo:TRANSFER_MEMO

            },key).then(
                console.log("promoted to "+transfer.from)
            ).catch((error) => {
                console.warn('transfer failed', error)
            })
        }
        if (transfer.from === TARGET_ACCOUNT) {
            console.log(`${ transfer.from } sent money to ${ transfer.to }`)
            //TODO - Check for Transfers to other exchange accounts and skip promotion 

            // finally broadcast the vote to the network
            client.broadcast.transfer({
                amount:'0.001 SBD',
                from:PROMOTER,
                to:transfer.from,
                memo:TRANSFER_MEMO

            },key).then(
                console.log("promoted to "+transfer.from)
            ).catch((error) => {
                console.warn('transfer failed', error)
            })
        }
    }
})

function die(msg) { process.stderr.write(msg+'\n'); process.exit(1) }