import { Metadata, MosaicId, MosaicNonce, Page, RepositoryFactoryHttp, MetadataType } from 'symbol-sdk';
import { networkType, account, networkGenerationHash, nodeUrl, imageDataUri } from '../../const';
import * as sym from 'symbol-sdk';

const main = async () => {
  const repo = new sym.RepositoryFactoryHttp(nodeUrl);

  // const supplyMutable = false; //供給量変更の可否
  // const transferable = false; //第三者への譲渡可否
  // const restrictable = true; //制限設定の可否
  // const revokable = true; //発行者からの還収可否

  // //モザイク定義
  // const nonce = MosaicNonce.createRandom();
  // const mosaicId = MosaicId.createFromNonce(nonce, account.address);
  // // const mosaicId = new MosaicId('002AC32CB3A3933B');
  // const mosaicDefTx = sym.MosaicDefinitionTransaction.create(
  //   undefined,
  //   nonce,
  //   mosaicId,
  //   sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
  //   0, //divisibility:可分性
  //   sym.UInt64.fromUint(0), //duration:無期限
  //   networkType,
  // );

  // //モザイク数量固定
  // const mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  //   undefined,
  //   mosaicId,
  //   sym.MosaicSupplyChangeAction.Increase, //増やす
  //   sym.UInt64.fromUint(1), //数量1
  //   networkType,
  // );

  // //NFTデータ
  // const nftTx = sym.MosaicMetadataTransaction.create(
  //   undefined, //Deadline:有効期限
  //   account.address,
  //   [],
  //   sym.PlainMessage.create(imageDataUri), //NFTデータ実体
  //   networkType,
  // );

  // //VWBLデータ
  // const vwblTx = sym.MosaicMetadataTransaction.create(
  //   undefined, //Deadline:有効期限
  //   account.address,
  //   [],
  //   sym.PlainMessage.create('暗号化された何かしら'), //NFTデータ実体
  //   networkType,
  // );

  // //モザイクの生成とNFTデータをアグリゲートしてブロックに登録
  // const epochAdjustment = await repo.getEpochAdjustment().toPromise();
  // const aggregateTx = sym.AggregateTransaction.createComplete(
  //   sym.Deadline.create(epochAdjustment),
  //   [
  //     mosaicDefTx.toAggregate(account.publicAccount),
  //     mosaicChangeTx.toAggregate(account.publicAccount),
  //     nftTx.toAggregate(account.publicAccount),
  //     vwblTx.toAggregate(account.publicAccount),
  //   ],
  //   networkType,
  //   [],
  //   sym.UInt64.fromUint(10000),
  // );

  // const signedTx = account.sign(aggregateTx, networkGenerationHash);
  // const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
  // const transactionHttp = repositoryFactory.createTransactionRepository();

  // await transactionHttp.announce(signedTx).toPromise();
  // console.log(signedTx);

  // トランザクションの確認
  const tsRepo = repo.createTransactionStatusRepository();
  const transactionStatus = await tsRepo
    .getTransactionStatus('5BD0B187157238D3DC4BE3A8B574EAA6C35D0272B295B6DB97A57C518CB763A4')
    .toPromise();
  console.log(transactionStatus);

  // モザイク情報の取得
  // const mosaicId = new MosaicId('002AC32CB3A3933B');
  // const mosaicHttp = repo.createMosaicRepository();
  // mosaicHttp.getMosaic(mosaicId).subscribe(
  //   (mosaicInfo) => console.log(mosaicInfo),
  //   (err) => console.error(err),
  // );

  // モザイクのメタデータにアクセス
  //   const searchCriteria = {
  //     targetId: mosaicId,
  //     metadataType: MetadataType.Mosaic,
  //   };
  //   const metadataHttp = repo.createMetadataRepository();
  //   metadataHttp.search(searchCriteria).subscribe(
  //     (metadataEntries: Page<Metadata>) => {
  //       if (metadataEntries.pageSize > 0) {
  //         console.log('Page', metadataEntries.pageNumber);
  //         metadataEntries.data.map((entry: Metadata) => {
  //           const metadataEntry = entry.metadataEntry;
  //           console.log('\n \n Key:\t', metadataEntry.scopedMetadataKey);
  //           console.log('\n ---');
  //           console.log('\n Value:\t', metadataEntry.value);
  //           console.log('\n Sender Address:\t', metadataEntry.sourceAddress.pretty());
  //           console.log('\n Target address:\t', metadataEntry.targetAddress.pretty());
  //           console.log('\n Scoped metadata key:\t', metadataEntry.scopedMetadataKey.toHex());
  //           console.log('\n TargetId:\t', metadataEntry.targetId);
  //         });
  //       } else {
  //         console.log('\n The mosaic does not have metadata entries assigned.');
  //       }
  //     },
  //     (err) => console.log(err),
  //   );
};

main();
