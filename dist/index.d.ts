import { AbstractProvider } from "ethers";
declare class CheckPrice {
    provider: AbstractProvider;
    uniswapV2FactoryAddress: string;
    uniswapV3FactoryAddress: string;
    chainlinkOracleAddress: string;
    WETH_ADDRESS: string;
    feeTiers: number[];
    /**
     * @param provider - The provider to use for querying the blockchain.
     */
    constructor(provider: AbstractProvider);
    /**
     * Gets the current ETH/USD price from the Chainlink oracle.
     * @returns {Promise<number>} - The current price of ETH in USD.
     */
    getEthUsdPrice(): Promise<number>;
    /**
     * Gets the Uniswap V2 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V2 pool or null if not found.
     */
    getV2Pool(token: string): Promise<string | null>;
    /**
     * Gets the price of the token in WETH from the Uniswap V2 pool.
     * @param {string} poolAddress - The address of the Uniswap V2 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    getV2PriceWeth(pool_address: string): Promise<number>;
    /**
     * Gets the Uniswap V3 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V3 pool or null if not found.
     */
    getV3Pool(token: string): Promise<string | null>;
    /**
     * Gets the price of the token in WETH from the Uniswap V3 pool.
     * @param {string} poolAddress - The address of the Uniswap V3 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    getV3PriceWeth(pool_address: string): Promise<number>;
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
    getPrice(token: string): Promise<{
        v2Pool: string | null;
        v3Pool: string | null;
        v2Price: number | null;
        v3Price: number | null;
        price_usd: number | null;
    }>;
}
export default CheckPrice;
