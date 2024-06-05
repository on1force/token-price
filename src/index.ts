import {
    AbstractProvider,
    BigNumberish,
    Contract,
    ZeroAddress,
    formatUnits
} from "ethers";
import {
    chainlink_abi,
    uniswap_v2_factory_abi,
    uniswap_v2_pair_abi,
    uniswap_v3_factory_abi,
    uniswap_v3_pair_abi
} from "./abi";

class CheckPrice {
    provider: AbstractProvider;
    uniswapV2FactoryAddress: string;
    uniswapV3FactoryAddress: string;
    chainlinkOracleAddress: string;
    WETH_ADDRESS: string;
    feeTiers: number[];

    /**
     * @param provider - The provider to use for querying the blockchain.
     */
    constructor(provider: AbstractProvider) {
        this.provider = provider;
        this.uniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
        this.uniswapV3FactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
        this.chainlinkOracleAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
        this.WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        this.feeTiers = [500, 3000, 10000]; // Uniswap V3 fee tiers: 0.05%, 0.3%, 1%
    }

    /**
     * Gets the current ETH/USD price from the Chainlink oracle.
     * @returns {Promise<number>} - The current price of ETH in USD.
     */
    async getEthUsdPrice(): Promise<number> {
        try {
            const oracle = new Contract(
                this.chainlinkOracleAddress,
                chainlink_abi,
                this.provider
            );

            const price = await oracle.latestAnswer();

            return parseFloat(formatUnits(price, 8));
        } catch (error: any) {
            throw new Error("Failed to get ETH/USD price from Chainlink oracle.\n" + error);
        }
    }

    /**
     * Gets the Uniswap V2 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V2 pool or null if not found.
     */
    async getV2Pool(token: string): Promise<string | null> {
        try {
            const factory = new Contract(
                this.uniswapV2FactoryAddress,
                uniswap_v2_factory_abi,
                this.provider
            );

            const pool = await factory.getPair(token, this.WETH_ADDRESS);
            if (pool === ZeroAddress) return null;

            return pool;
        } catch (error: any) {
            throw new Error("Failed to get Uniswap V2 pool address.\n" + error);
        }
    }

    /**
     * Gets the price of the token in WETH from the Uniswap V2 pool.
     * @param {string} poolAddress - The address of the Uniswap V2 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    async getV2PriceWeth(pool_address: string): Promise<number> {
        try {
            const pool = new Contract(pool_address, uniswap_v2_pair_abi, this.provider);
            const [token0, [reserve0, reserve1]]: [string, [BigNumberish, BigNumberish]] = await Promise.all([
                pool.token0(),
                pool.getReserves()
            ]);

            const isToken0 = token0 !== this.WETH_ADDRESS;
            const reserve_token = isToken0 ? reserve0 : reserve1;
            const reserve_weth = isToken0 ? reserve1 : reserve0;

            return Number(reserve_token) / Number(reserve_weth);
        } catch (error) {
            throw new Error("Failed to get Uniswap V2 price.\n" + error);
        }
    }

    /**
     * Gets the Uniswap V3 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V3 pool or null if not found.
     */
    async getV3Pool(token: string): Promise<string | null> {
        try {
            const factory = new Contract(
                this.uniswapV3FactoryAddress,
                uniswap_v3_factory_abi,
                this.provider
            );

            let pair: string | null = null;
            for (const fee of this.feeTiers) {
                pair = await factory.getPool(token, this.WETH_ADDRESS, fee);
                if (pair !== ZeroAddress) break;
            }

            if (!pair || pair === ZeroAddress) return null;
            return pair;
        } catch (error) {
            throw new Error("Failed to get Uniswap V3 pool address.\n" + error);
        }
    }

    /**
     * Gets the price of the token in WETH from the Uniswap V3 pool.
     * @param {string} poolAddress - The address of the Uniswap V3 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    async getV3PriceWeth(pool_address: string): Promise<number> {
        try {
            const pool = new Contract(
                pool_address,
                uniswap_v3_pair_abi,
                this.provider
            );

            const { sqrtPriceX96 } = await pool.slot0();
            const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;

            return price;
        } catch (error) {
            throw new Error("Failed to get Uniswap V3 price.\n" + error);
        }
    }

    /**
    * Gets the price of the token in USD by checking Uniswap V2 and V3 pools.
    * @param {string} token - The address of the token.
    * @returns {Promise<{
    *   v2Pool?: string,
    *   v2Price?: number,
    *   v3Pool?: string,
    *   v3Price?: number,
    *   price_usd: number
    * } | null>} - The price information or null if no pools are found.
    */
    async getPrice(token: string): Promise<{
        v2Pool: string | null,
        v3Pool: string | null,
        v2Price: number | null,
        v3Price: number | null,
        price_usd: number | null
    }> {
        try {
            const [v2Pool, v3Pool, eth_usd]: [string | null, string | null, number] = await Promise.all([
                this.getV2Pool(token),
                this.getV3Pool(token),
                this.getEthUsdPrice()
            ]);

            let v2Price: number | null = null;
            let v3Price: number | null = null;
            let price_usd: number | null = null;

            if (v2Pool) {
                v2Price = await this.getV2PriceWeth(v2Pool);
                price_usd = v2Price * eth_usd;
            }

            if (v3Pool) {
                v3Price = await this.getV3PriceWeth(v3Pool);
                price_usd = v3Price * eth_usd;
            }

            return {
                v2Pool,
                v3Pool,
                v2Price,
                v3Price,
                price_usd
            };
        } catch (error) {
            throw new Error("Failed to get price information.\n" + error);
        }
    }
}

export default CheckPrice;