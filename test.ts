import { InfuraProvider } from 'ethers';
import { config } from 'dotenv';
import CheckPrice from './src/index';

config();

const infura_id = process.env?.INFURA_ID;
if (!infura_id) {
    throw new Error('INFURA_ID is not defined');
}

const provider = new InfuraProvider('mainnet', infura_id);

const checkPrice = new CheckPrice(provider);

(async () => {
    const token = "0x34F5C9449Bae9b1D96044690164BD66f2f604c1e";
    const price = await checkPrice.getPrice(token);

    console.log(price);
})();