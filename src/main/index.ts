import * as sym from 'symbol-sdk';
import {
  Account,
  AggregateTransaction,
  MosaicId,
  InnerTransaction,
  RepositoryFactoryHttp,
  MetadataType,
  Metadata,
  Page,
  SignedTransaction,
} from 'symbol-sdk';
import { networkGenerationHash, networkType, nodeUrl, privateKey } from '../const';
import * as fs from 'fs';

const repo = new sym.RepositoryFactoryHttp(nodeUrl);
const maxFee = sym.UInt64.fromUint(100000); // 0.1xym
const mosaicRepo = repo.createMosaicRepository();
const metaRepo = repo.createMetadataRepository();
const metaService = new sym.MetadataTransactionService(metaRepo);
const _sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
const transactionHttp = repositoryFactory.createTransactionRepository();
const metadataHttp = repo.createMetadataRepository();

const createNft = async (account: Account) => {
  try {
    const supplyMutable = false; //供給量変更：不可
    const transferable = true; //第三者への譲渡：可
    const restrictable = false; //モザイク制限：不可
    const revokable = false; //発行者からの還収：不可

    const nonce = sym.MosaicNonce.createRandom();
    const mosaicId = sym.MosaicId.createFromNonce(nonce, account.address);
    const mosaicDefTx = sym.MosaicDefinitionTransaction.create(
      undefined, //Deadline：無し
      nonce,
      mosaicId, //モザイクID
      sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable), //モザイクFlag
      0, //可分性:NFTのため0
      sym.UInt64.fromUint(0), //有効期限：無期限
      networkType,
    );

    //モザイク数量固定
    const mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
      undefined,
      mosaicId,
      sym.MosaicSupplyChangeAction.Increase, //増やす
      sym.UInt64.fromUint(1), //数量1
      networkType,
    );

    const epochAdjustment = await repo.getEpochAdjustment().toPromise();
    const aggregateTx = sym.AggregateTransaction.createComplete(
      sym.Deadline.create(epochAdjustment),
      [mosaicDefTx.toAggregate(account.publicAccount), mosaicChangeTx.toAggregate(account.publicAccount)],
      networkType,
      [],
      maxFee,
    );

    const txRepo = repo.createTransactionRepository();
    const signedTx = account.sign(aggregateTx, networkGenerationHash);
    await txRepo.announce(signedTx).toPromise();
    console.log('create mosaic id: ', mosaicId.id);
    return mosaicId;
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

const createMetadataTx = async (account: Account, mosaicId: MosaicId, key: string, value: string) => {
  const metadataTx = await metaService
    .createMosaicMetadataTransaction(
      undefined,
      networkType,
      account.address, //モザイク作成者アドレス
      mosaicId,
      sym.KeyGenerator.generateUInt64Key(key), //Key
      value, //Value
      account.address,
      maxFee,
    )
    .toPromise();
  return metadataTx;
};

const annouceAggregateTxs = async (aggregateTxs: SignedTransaction[], retry = 5) => {
  const failed = [];
  for (const tx of aggregateTxs) {
    await _sleep(2000);
    try {
      await transactionHttp.announce(tx).toPromise();
    } catch (err) {
      failed.push(tx);
    }
  }
  if (retry === 0 && failed.length === 0) {
    console.log('正常にトランザクションを発行できました。');
    process.exit(1);
  }
  if (retry === 0 && failed.length !== 0) {
    console.log('正しくトランザクションを発行できませんでした。。。');
    process.exit(1);
  }
  if (failed.length != 0) annouceAggregateTxs(failed, retry - 1);
};

const signAggregateTxs = async (data: Buffer, account: Account) => {
  //const fixedData: Uint8Array = convertToUint8Array(data);
  const splitedDataArray = splitData(data.toString('base64'));

  // 保存したデータを基にアグリゲートTxを作成（データ量に応じて複数作成）
  const aggregateTxs: SignedTransaction[] = [];
  let innerTxs: InnerTransaction[] = [];

  for (let i = 0; i < splitedDataArray.length; i++) {
    const epochAdjustment = await repo.getEpochAdjustment().toPromise();
    const innerTx = sym.TransferTransaction.create(
      sym.Deadline.create(epochAdjustment),
      account.address,
      [],
      sym.PlainMessage.create(splitedDataArray[i]), // RawMessageを採用
      networkType,
      maxFee,
    );
    innerTxs.push(innerTx.toAggregate(account.publicAccount));

    // アグリゲートトランザクションにinnerTxsを内包する（最大100個まで）
    if (i % 100 === 99 || i === splitedDataArray.length - 1) {
      const aggregateTx = sym.AggregateTransaction.createComplete(sym.Deadline.create(epochAdjustment), innerTxs, networkType, [], maxFee);
      const signedTx = account.sign(aggregateTx, networkGenerationHash);
      aggregateTxs.push(signedTx);
      innerTxs = [];
    }
  }
  return aggregateTxs;
};

const getAggregateTxHashes = async (aggregateTxs: SignedTransaction[], account: Account) => {
  const hashes: string[] = [];
  for (const aggregateTx of aggregateTxs) {
    hashes.push(aggregateTx.hash);
  }
  return hashes;
};

const convertToUint8Array = (data: Buffer) => {
  const ab = new ArrayBuffer(data.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < data.length; ++i) view[i] = data[i];
  return view;

  const a = Uint8Array.from(data);
};

const splitData = (data: string) => {
  // データを1023文字ごとに区切って保存
  const messageSize = 1023;
  const arrays = [];
  for (let i = 0; i <= Math.floor(data.length / messageSize); i++) {
    const arr = data.slice(i * messageSize, (i + 1) * messageSize);
    arrays.push(arr);
  }
  return arrays;
};

const main = async () => {
  // const account = sym.Account.generateNewAccount(networkType);
  // const mosaicId = await createNft(account);

  const account = sym.Account.createFromPrivateKey(privateKey, networkType);
  const mosaicId = new sym.MosaicId('4EA5AB44E86D34A4');
  const vwblData = fs.readFileSync('/Users/kawanosho/Desktop/ango-ya/VWBL-pj/practice/symbol/src/public/test_image_17MB.jpeg');
  const thumbnailData = fs.readFileSync('/Users/kawanosho/Desktop/ango-ya/VWBL-pj/practice/symbol/src/public/person-icon.png');

  // vwbl metadata
  const vwblAggregateTxs = await signAggregateTxs(vwblData, account);
  const vwblHashes = await getAggregateTxHashes(vwblAggregateTxs, account);
  await annouceAggregateTxs(vwblAggregateTxs);
  console.log('vwblHashes', vwblHashes);
  const vwblMetadataTx = await createMetadataTx(account, mosaicId, 'Encrypted Data', vwblHashes.toString());
  // image metadata
  const thumbnailAggregateTxs = await signAggregateTxs(thumbnailData, account);
  const thumbnailHashes = await getAggregateTxHashes(thumbnailAggregateTxs, account);
  await annouceAggregateTxs(thumbnailAggregateTxs);
  console.log('thumbnailHashes', thumbnailHashes);
  const thumbnailMetadataTx = await createMetadataTx(account, mosaicId, 'Thumbnail', thumbnailHashes.toString());
  // name
  const nameMetadataTx = await createMetadataTx(account, mosaicId, 'Name', 'Test NFT 2');
  // description
  const descriptionMetadataTx = await createMetadataTx(account, mosaicId, 'Description', 'This is a test token.');

  const epochAdjustment = await repo.getEpochAdjustment().toPromise();
  const aggregateTx = AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      vwblMetadataTx.toAggregate(account.publicAccount),
      thumbnailMetadataTx.toAggregate(account.publicAccount),
      nameMetadataTx.toAggregate(account.publicAccount),
      descriptionMetadataTx.toAggregate(account.publicAccount),
    ],
    networkType,
    [],
    maxFee,
  );
  const signedTx = account.sign(aggregateTx, networkGenerationHash);
  const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
  const transactionHttp = repositoryFactory.createTransactionRepository();

  await transactionHttp.announce(signedTx).toPromise();
  console.log('metadata aggregate tx', signedTx);
};

const checkTxStatus = async () => {
  const mosaicId = new sym.MosaicId('4EA5AB44E86D34A4');
  const searchCriteria = {
    targetId: mosaicId,
    metadataType: MetadataType.Mosaic,
  };

  // // トランザクションの確認
  // const tsRepo = repo.createTransactionStatusRepository();
  // const transactionStatus = await tsRepo
  //   .getTransactionStatus('1915202DE37BC8698F68D6B51C7C734F0D9CDCB5B41C6D0B4ED7413276D4BDA9')
  //   .toPromise();
  // console.log(transactionStatus);

  // // モザイクのメタデータにアクセス
  // const metadataHttp = repo.createMetadataRepository();
  // metadataHttp.search(searchCriteria).subscribe(
  //   (metadataEntries: Page<Metadata>) => {
  //     if (metadataEntries.pageSize > 0) {
  //       console.log('Page', metadataEntries.pageNumber);
  //       metadataEntries.data.map((entry: Metadata) => {
  //         const metadataEntry = entry.metadataEntry;
  //         console.log('\n \n Key(Hex):\t', metadataEntry.scopedMetadataKey.toHex());
  //         console.log('\n ---');
  //         console.log('\n Value:\t', metadataEntry.value);
  //         console.log('\n Sender Address:\t', metadataEntry.sourceAddress.pretty());
  //         console.log('\n Target address:\t', metadataEntry.targetAddress.pretty());
  //         console.log('\n Scoped metadata key:\t', metadataEntry.scopedMetadataKey.toHex());
  //         console.log('\n TargetId:\t', metadataEntry.targetId);
  //       });
  //     } else {
  //       console.log('\n The mosaic does not have metadata entries assigned.');
  //     }
  //   },
  //   (err) => console.log(err),
  // );

  // // hashをもとにデコードする
  // let file = '';
  // const data = [];
  // const hash = '57F5A2953AEB55706260A52437A522EDE7686029AE9277B6A0079E5F92292B62';
  // const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
  // const transactionHttp = repositoryFactory.createTransactionRepository();
  // data.push(await transactionHttp.getTransaction(hash, sym.TransactionGroup.Confirmed).toPromise());
  // for (const d of data) {
  //   const innerTxs = d.innerTransactions;
  //   for (const tx of innerTxs) {
  //     file += tx.message.payload;
  //   }
  // }
  // console.log(file);

  metadataHttp.search(searchCriteria).subscribe(
    (metadataEntries: Page<Metadata>) => {
      if (metadataEntries.pageSize > 0) {
        metadataEntries.data.map(async (entry: Metadata) => {
          const metadataEntry = entry.metadataEntry;
          // Ecrypted Data
          if (metadataEntry.scopedMetadataKey.toHex() === 'A6C9BCE755AF77C7') {
            const hashes = metadataEntry.value.split(',');
            const data = [];
            let file = '';
            for (const hash of hashes) {
              data.push(await transactionHttp.getTransaction(hash, sym.TransactionGroup.Confirmed).toPromise());
            }
            for (const d of data) {
              const innerTxs = d.innerTransactions;
              for (const tx of innerTxs) {
                file += tx.message.payload;
              }
            }
            fs.writeFileSync('/Users/kawanosho/Desktop/ango-ya/VWBL-pj/practice/symbol/src/main/result.txt', file);
            console.log('done');
          }
        });
      } else {
        console.log('\n The mosaic does not have metadata entries assigned.');
      }
    },
    (err) => console.log(err),
  );
};

// checkTxStatus();
main();
