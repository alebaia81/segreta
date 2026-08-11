import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onValidate?: () => boolean;
}

export default function PayPalButton({ amount, onSuccess, onError, onValidate }: PayPalButtonProps) {
  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID as string,
    currency: 'EUR',
    intent: 'capture',
  };

  return (
    <div className="paypal-button-wrapper" style={{ width: '100%', minHeight: '150px' }}>
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 48,
          }}
          createOrder={(data, actions) => {
            // Valida il form PRIMA di creare l'ordine su PayPal
            if (onValidate && !onValidate()) {
              return Promise.reject(new Error('Form non valido'));
            }
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: 'EUR',
                    value: amount.toFixed(2),
                  },
                  description: 'Pagamento ordine Segreta Style',
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              try {
                const details = await actions.order.capture();
                onSuccess(details);
              } catch (err) {
                console.error('Errore durante la cattura del pagamento:', err);
                onError(err);
              }
            }
          }}
          onError={(err) => {
            console.error('Errore nell\'SDK di PayPal:', err);
            onError(err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
