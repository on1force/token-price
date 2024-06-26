# CheckPrice

A TypeScript library for checking token prices (currently on Uniswap V2 and V3 Ethereum) using ethers.js.

## Installation

Install the library using npm:

```bash
npm install @on1force/token-price
```

## Usage
### Initiate
```typescript
import CheckPrice from '@on1force/token-price';
import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-infura-key');
const checkPrice = new CheckPrice(provider);
```

### Get Price
```typescript
async function getPrice(token: string) {
    const price = await checkPrice.getPrice(token);
    console.log(price);
}
```

### Get V2 Pool
```typescript
async function getV2Pool(token: string) {
    const pool = await checkPrice.getV2Pool(token);
    console.log(pool);
}
```

### Get V3 Pool
```typescript
async function getV3Pool(token: string) {
    const pool = await checkPrice.getV3Pool(token);
    console.log(pool);
}
```

### Get ETH/USD Price Oracle
```typescript
async function getEthUsdPrice() {
    const price = await checkPrice.getEthUsdPrice();
    console.log(price);
}
```

## API
`CheckPrice`
`constructor(provider: ethers.AbstractProvider)`
Creates a new instance of the CheckPrice class.

- `provider`: An instance of `ethers.AbstractProvider`.
  
`getPrice(token: string): Promise<{
price_eth: number | null,
price_usd: number | null
} | null>`
Get the price of a token in USD & ETH.

`getV2Pool(token: string): Promise<Pool>`
Get the Uniswap V2 pool of a token.

`getV3Pool(token: string): Promise<Pool>`
Get the Uniswap V3 pool of a token.

`getEthUsdPrice(): Promise<number>`
Get the ETH/USD price oracle.

## License
MIT

## Author
[on1force](https://github.com/on1force/token-price)