// PayPal SDK TypeScript declarations
declare namespace paypal {
  interface ButtonsConfig {
    style?: {
      layout?: 'vertical' | 'horizontal';
      color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
      shape?: 'rect' | 'pill';
      label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
      height?: number;
      tagline?: boolean;
    };
    fundingSource?: string;
    createOrder: (data: unknown, actions: CreateOrderActions) => Promise<string>;
    onApprove: (data: ApproveData, actions: ApproveActions) => Promise<void>;
    onError?: (err: Error) => void;
    onCancel?: (data: unknown) => void;
  }

  interface CreateOrderActions {
    order: {
      create: (orderData: OrderCreateData) => Promise<string>;
    };
  }

  interface OrderCreateData {
    intent?: 'CAPTURE' | 'AUTHORIZE';
    purchase_units: PurchaseUnit[];
    application_context?: {
      brand_name?: string;
      landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
      user_action?: 'PAY_NOW' | 'CONTINUE';
      return_url?: string;
      cancel_url?: string;
    };
  }

  interface PurchaseUnit {
    reference_id?: string;
    description?: string;
    custom_id?: string;
    invoice_id?: string;
    amount: {
      currency_code: string;
      value: string;
      breakdown?: {
        item_total?: { currency_code: string; value: string };
        shipping?: { currency_code: string; value: string };
        tax_total?: { currency_code: string; value: string };
        discount?: { currency_code: string; value: string };
      };
    };
    items?: {
      name: string;
      quantity: string;
      unit_amount: { currency_code: string; value: string };
      category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
    }[];
  }

  interface ApproveData {
    orderID: string;
    payerID?: string;
    paymentID?: string;
    billingToken?: string;
    facilitatorAccessToken?: string;
  }

  interface ApproveActions {
    order: {
      capture: () => Promise<CaptureResult>;
    };
  }

  interface CaptureResult {
    id: string;
    status: string;
    payer: {
      name?: { given_name?: string; surname?: string };
      email_address?: string;
      payer_id?: string;
    };
    purchase_units: {
      payments: {
        captures: {
          id: string;
          status: string;
          amount: { currency_code: string; value: string };
        }[];
      };
    }[];
  }

  interface ButtonsInstance {
    render: (selector: string | HTMLElement) => Promise<void>;
    close: () => void;
    isEligible: () => boolean;
  }

  function Buttons(config: ButtonsConfig): ButtonsInstance;
  
  const FUNDING: {
    PAYPAL: string;
    VENMO: string;
    CARD: string;
    CREDIT: string;
    PAYLATER: string;
  };
}

interface Window {
  paypal?: typeof paypal;
}
