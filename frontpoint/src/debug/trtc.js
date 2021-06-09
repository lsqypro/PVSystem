import * as LibGenerateTestUserSig from './lib-generate-test-usersig.min.js'
import {request} from '../utils/commons'

/**
 * 腾讯云 SDKAppId，需要替换为您自己账号下的 SDKAppId。
 *
 * 进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav ) 创建应用，即可看到 SDKAppId，
 * 它是腾讯云用于区分客户的唯一标识。
 */
const SDKAPPID = 1400527235


/**
 * 签名过期时间，建议不要设置的过短
 * <p>
 * 时间单位：秒
 * 默认时间：7 x 24 x 60 x 60 = 604800 = 7 天
 */
const EXPIRETIME = 604800

/**
 * 计算签名用的加密密钥，获取步骤如下：
 *
 * step1. 进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav )，如果还没有应用就创建一个，
 * step2. 单击“应用配置”进入基础配置页面，并进一步找到“帐号体系集成”部分。
 * step3. 点击“查看密钥”按钮，就可以看到计算 UserSig 使用的加密的密钥了，请将其拷贝并复制到如下的变量中
 *
 * 注意：该方案仅适用于调试Demo，正式上线前请将 UserSig 计算代码和密钥迁移到您的后台服务器上，以避免加密密钥泄露导致的流量盗用。
 * 文档：https://cloud.tencent.com/document/product/647/17275#Server
 */
const SECRETKEY = '031ce4c908ebae8891f2b6577409ab00b88a8f5a709cadbc84c64ab98a9ca226'

/*
 * Module:   GenerateTestUserSig
 *
 * Function: 用于生成测试用的 UserSig，UserSig 是腾讯云为其云服务设计的一种安全保护签名。
 *           其计算方法是对 SDKAppID、UserID 和 EXPIRETIME 进行加密，加密算法为 HMAC-SHA256。
 *
 * Attention: 请不要将如下代码发布到您的线上正式版本的 App 中，原因如下：
 *
 *            本文件中的代码虽然能够正确计算出 UserSig，但仅适合快速调通 SDK 的基本功能，不适合线上产品，
 *            这是因为客户端代码中的 SECRETKEY 很容易被反编译逆向破解，尤其是 Web 端的代码被破解的难度几乎为零。
 *            一旦您的密钥泄露，攻击者就可以计算出正确的 UserSig 来盗用您的腾讯云流量。
 *
 *            正确的做法是将 UserSig 的计算代码和加密密钥放在您的业务服务器上，然后由 App 按需向您的服务器获取实时算出的 UserSig。
 *            由于破解服务器的成本要高于破解客户端 App，所以服务器计算的方案能够更好地保护您的加密密钥。
 *
 * Reference：https://cloud.tencent.com/document/product/647/17275#Server
 */
export async function genTestUserSig2(userID) {
  const generator = new LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME)
  const userSig = generator.genTestUserSig(userID)

  const data = {
      userId: userID,
      sdkAppId: SDKAPPID,
      userSig: userSig
  };
  // sdkAppId: 1400527235
  // userId: "admin"
  // userSig: "eJwtzL0OgjAYheF76WzI15YWJHGhDsYQF3TADWgxHwbaIP4Q473bAON5TvJ*yTnLg5cZSEJYAGQzb9SmH7HBmUvdYb8eD30vnUNNEhoCCBYxLpZnxM54lYxDSCmPFjUfh4N3CWEMsDbw5qtTm-XSGlMd9gA851gw1RzfbZHWyoqJn7buenmqKq7tjvz*wPMw0Q__"
  
  // sdkAppId: 1400527235
  // userId: "admin"
  // userSig: "eJwtzM0KgkAUhuF7mXXIcf4chFYRabjzp1oKMw7HVCbTCqJ7b1CX3-PB*yVFlgcvM5KY0ADIbtmozTBhgwvXusdhO576XjuHmsQhBxA0okysz4S98SopAx4yoVY1H4ejdwlcAWwNtL56fbhcTtGpLQ99KlyjutK03cwub6tSq29srpLqWCTZme-J7w-RnzEU"

  // sdkAppId: 1400527235
  // userId: "admin"
  // userSig: "eJwtzEELgjAYxvHvsnPY6*bmEjq0g0F1SunQTdqSl1LXNsKIvntDPT6-B-5fUp*q5G0cKQhNgKymjdr0Ae84caM77JfD60djLWpSpBkApzllfH4CdiaqoAyylOVyVjNadNEFZBJgaWAbqxeh1tXemmPvSlWWr52XoX5uDr4ZFP*gON-sVY56UKHdkt8fww0xUg__"

  // sdkAppId: 1400527235
  // userId: "admin"
  // userSig: "eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwokpuZl5UInilOzEgoLMFCUrQxMDA1MjcyNjU4hMSWZuKlDUzMjYwAQoZwgRTa0oyCwCipsZmFgYGEDNyEwHmhrgWhiUWJxt6mpSVekeFOoRGWoSZlhYau6REhJRVhbsqZ9aVuDon6SflmVgq1QLAMbhMQQ_"

  // sdkAppId: 1400527235
  // userId: "admin"
  // userSig: "eJyrVgrxCdYrSy1SslJQMtIzUNJRAItkpqTmlWSmZUIkElNyM-NgUsUp2YkFBZkpQAlDEwMogMqlVhRkFqWCZExNTY0Q4iWZuWBRMyNjAxNDIwMzmFmZ6SDzA3NLnDOdKi0CivUN-M2c3cOywg2jglwCjSqjcrNToszDAiu9vHxCgyNMfW2VagF1izIf"
    
  
  console.log("genTestUserSig:", data)

  return data
}

export async function genTestUserSig(userID){
  const ret = await request('https://www.qingyun.work/vist/api/v1.0/tlssig', {
    methods: 'GET',
    params: {
      user_id: userID
    }
  })
  
  if (ret.errno === '0') {
    
    console.log("usig:", ret.data)
    return ret.data
  }

  console.error("genTestUserSig失败")
  return false
}
