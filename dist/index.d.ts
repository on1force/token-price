import { AbstractProvider } from "ethers";
declare class CheckPrice {
    private provider;
    private readonly uniswapV2FactoryAddress;
    private readonly uniswapV3FactoryAddress;
    private readonly chainlinkOracleAddress;
    private readonly WETH_ADDRESS;
    private readonly feeTiers;
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
    *   price_eth: number | null,
    *   price_usd: number | null
    * } | null>} - The price information or null if no pools are found.
    */
    getPrice(token: string): Promise<{
        price_eth: number | null;
        price_usd: number | null;
    }>;
}
export default CheckPrice;
