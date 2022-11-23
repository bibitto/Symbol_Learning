const sym = require('symbol-sdk');

//const alice = sym.Account.createFromPrivateKey('1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****', 152);

const alicePublicAccount = sym.PublicAccount.createFromPublicKey('D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2', 152);
console.log(alicePublicAccount);
