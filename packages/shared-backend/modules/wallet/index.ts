// src/modules/wallet/index.ts
// External module surface for wallet. Keep explicit; no export *.

export { registerWallet } from './router';
export { registerWalletAdmin } from './admin.routes';

export {
  getMyWallet,
  listMyTransactions,
  initiateDeposit,
  iyzicoCallback,
} from './controller';

export {
  adminListWallets,
  adminGetWallet,
  adminUpdateWalletStatus,
  adminAdjustWallet,
  adminListTransactions,
  adminUpdateTransactionStatus,
} from './admin.controller';

export {
  deductForBooking,
  creditCarrier,
  refundToCustomer,
} from './service';

export {
  getOrCreateWallet,
  parseWalletPaging,
  parseAdminWalletPaging,
} from './helpers';

export {
  depositSchema,
  initiateDepositSchema,
  adminAdjustSchema,
  adminStatusSchema,
  adminTransactionStatusSchema,
} from './validation';

export {
  wallets,
  walletTransactions,
} from './schema';
export type {
  Wallet,
  NewWallet,
  WalletTransaction,
  NewWalletTransaction,
} from './schema';
