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
    private provider: AbstractProvider;
    private readonly uniswapV2FactoryAddress: string;
    private readonly uniswapV3FactoryAddress: string;
    private readonly chainlinkOracleAddress: string;
    private readonly WETH_ADDRESS: string;
    private readonly feeTiers: number[];

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
    *   price_eth: number | null,
    *   price_usd: number | null
    * } | null>} - The price information or null if no pools are found.
    */
    async getPrice(token: string): Promise<{
        price_eth: number | null,
        price_usd: number | null
    }> {
        try {
            const [v2Pool, v3Pool, eth_usd]: [string | null, string | null, number] = await Promise.all([
                this.getV2Pool(token),
                this.getV3Pool(token),
                this.getEthUsdPrice()
            ]);

            let price_eth: number | null = null;
            let price_usd: number | null = null;

            if (v2Pool) {
                price_eth = await this.getV2PriceWeth(v2Pool);
                price_usd = price_eth * eth_usd;
            }

            if (v3Pool) {
                price_eth = await this.getV3PriceWeth(v3Pool);
                price_usd = price_eth * eth_usd;
            }

            return {
                price_eth,
                price_usd
            };
        } catch (error) {
            throw new Error("Failed to get price information.\n" + error);
        }
    }
}

export default CheckPrice;