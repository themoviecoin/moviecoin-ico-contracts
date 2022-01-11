# Moviecoin ICO Contracts
Moviecoin ICO Smart Contracts (0x6428e6bade91d80eaca291a1f5174b0bcd68b96e)

# MovieCoin ICO

npm install 

npx hardhat compile

## Running test
npx hardhat test

## Checking code coverage
npx hardhat coverage

## Deploy instructions
go to secret.json

add the node url NODE_URL in the url field, private key PRIVATE_KEY in the privateKey field, gas price (in GWei) in the gasPrice field.

for example

{
    "url":"NODE_URL",
    "privateKey":"PRIVATE_KEY",
    "gasPrice" : 50
}

Run the command to execute the deployment:
npx hardhat run --network mainnet scripts/deploy.js

