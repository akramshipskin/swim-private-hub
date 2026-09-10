declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionParams {
    transaction_details: { order_id: string; gross_amount: number };
    customer_details?: {
      first_name?: string;
      email?: string;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    callbacks?: { finish?: string; unfinish?: string; error?: string };
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(params: TransactionParams): Promise<TransactionResult>;
  }

  const midtransClient: { Snap: typeof Snap };
  export default midtransClient;
}
