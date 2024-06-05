"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
class CheckPrice {
    /**
     * @param provider - The provider to use for querying the blockchain.
     */
    constructor(provider) {
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
    getEthUsdPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oracle = new ethers_1.Contract(this.chainlinkOracleAddress, abi_1.chainlink_abi, this.provider);
                const price = yield oracle.latestAnswer();
                return parseFloat((0, ethers_1.formatUnits)(price, 8));
            }
            catch (error) {
                throw new Error("Failed to get ETH/USD price from Chainlink oracle.\n" + error);
            }
        });
    }
    /**
     * Gets the Uniswap V2 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V2 pool or null if not found.
     */
    getV2Pool(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const factory = new ethers_1.Contract(this.uniswapV2FactoryAddress, abi_1.uniswap_v2_factory_abi, this.provider);
                const pool = yield factory.getPair(token, this.WETH_ADDRESS);
                if (pool === ethers_1.ZeroAddress)
                    return null;
                return pool;
            }
            catch (error) {
                throw new Error("Failed to get Uniswap V2 pool address.\n" + error);
            }
        });
    }
    /**
     * Gets the price of the token in WETH from the Uniswap V2 pool.
     * @param {string} poolAddress - The address of the Uniswap V2 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    getV2PriceWeth(pool_address) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = new ethers_1.Contract(pool_address, abi_1.uniswap_v2_pair_abi, this.provider);
                const [token0, [reserve0, reserve1]] = yield Promise.all([
                    pool.token0(),
                    pool.getReserves()
                ]);
                const isToken0 = token0 !== this.WETH_ADDRESS;
                const reserve_token = isToken0 ? reserve0 : reserve1;
                const reserve_weth = isToken0 ? reserve1 : reserve0;
                return Number(reserve_token) / Number(reserve_weth);
            }
            catch (error) {
                throw new Error("Failed to get Uniswap V2 price.\n" + error);
            }
        });
    }
    /**
     * Gets the Uniswap V3 pool address for the given token and WETH.
     * @param {string} token - The address of the token.
     * @returns {Promise<string | null>} - The address of the Uniswap V3 pool or null if not found.
     */
    getV3Pool(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const factory = new ethers_1.Contract(this.uniswapV3FactoryAddress, abi_1.uniswap_v3_factory_abi, this.provider);
                let pair = null;
                for (const fee of this.feeTiers) {
                    pair = yield factory.getPool(token, this.WETH_ADDRESS, fee);
                    if (pair !== ethers_1.ZeroAddress)
                        break;
                }
                if (!pair || pair === ethers_1.ZeroAddress)
                    return null;
                return pair;
            }
            catch (error) {
                throw new Error("Failed to get Uniswap V3 pool address.\n" + error);
            }
        });
    }
    /**
     * Gets the price of the token in WETH from the Uniswap V3 pool.
     * @param {string} poolAddress - The address of the Uniswap V3 pool.
     * @returns {Promise<number>} - The price of the token in WETH.
     */
    getV3PriceWeth(pool_address) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = new ethers_1.Contract(pool_address, abi_1.uniswap_v3_pair_abi, this.provider);
                const { sqrtPriceX96 } = yield pool.slot0();
                const price = Math.pow((Number(sqrtPriceX96) / Math.pow(2, 96)), 2);
                return price;
            }
            catch (error) {
                throw new Error("Failed to get Uniswap V3 price.\n" + error);
            }
        });
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
    getPrice(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [v2Pool, v3Pool, eth_usd] = yield Promise.all([
                    this.getV2Pool(token),
                    this.getV3Pool(token),
                    this.getEthUsdPrice()
                ]);
                let v2Price = null;
                let v3Price = null;
                let price_usd = null;
                if (v2Pool) {
                    v2Price = yield this.getV2PriceWeth(v2Pool);
                    price_usd = v2Price * eth_usd;
                }
                if (v3Pool) {
                    v3Price = yield this.getV3PriceWeth(v3Pool);
                    price_usd = v3Price * eth_usd;
                }
                return {
                    v2Pool,
                    v3Pool,
                    v2Price,
                    v3Price,
                    price_usd
                };
            }
            catch (error) {
                throw new Error("Failed to get price information.\n" + error);
            }
        });
    }
}
exports.default = CheckPrice;
