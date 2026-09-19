import { supabase } from './supabaseClient';

export interface PayoutRecord {
  id: string;
  amount: number;
  method: 'upi' | 'bank_account';
  destination: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  transactionRef: string;
}

export interface CreatorPayoutDetails {
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

const ACCOUNT_STORE_KEY = '@camqrew_payout_account';
const LEGACY_ACCOUNT_STORE_KEY = '@camcrew_payout_account';
const PAYOUT_HISTORY_KEY = '@camqrew_payout_history';
const LEGACY_PAYOUT_HISTORY_KEY = '@camcrew_payout_history';

export const payoutApi = {
  getCreatorAccount: async (): Promise<CreatorPayoutDetails> => {
    try {
      const stored = localStorage.getItem(ACCOUNT_STORE_KEY) || localStorage.getItem(LEGACY_ACCOUNT_STORE_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            upiId: '',
            accountNumber: '',
            ifscCode: '',
            accountHolderName: '',
          };
    } catch (e) {
      return {
        upiId: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
      };
    }
  },

  saveCreatorAccount: async (details: CreatorPayoutDetails): Promise<void> => {
    localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(details));
  },

  getPayoutHistory: async (): Promise<PayoutRecord[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const account = await payoutApi.getCreatorAccount();

      if (userData?.user) {
        const { data, error } = await supabase
          .from('crew_payouts')
          .select('*')
          .eq('professional_id', userData.user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => {
            const parts = (row.reference_id || '').split(':');
            const method = (parts[0] === 'bank_account' ? 'bank_account' : 'upi') as 'upi' | 'bank_account';
            const destination = parts.length >= 3 ? parts[1] : (account.upiId || 'UPI Account');
            const txRef = parts.length >= 3 ? parts.slice(2).join(':') : (row.reference_id || "PO-" + String(row.id).slice(0, 8));

            return {
              id: String(row.id),
              amount: Number(row.amount),
              method,
              destination,
              status: (row.status || 'completed') as 'processing' | 'completed' | 'failed',
              createdAt: row.created_at,
              transactionRef: txRef,
            };
          });
        }
      }

      const localHistory = localStorage.getItem(PAYOUT_HISTORY_KEY) || localStorage.getItem(LEGACY_PAYOUT_HISTORY_KEY);
      if (localHistory) {
        return JSON.parse(localHistory);
      }

      return [];
    } catch (e) {
      console.warn('getPayoutHistory error:', e);
      return [];
    }
  },

  requestInstantPayout: async (amount: number, method: 'upi' | 'bank_account' = 'upi'): Promise<PayoutRecord> => {
    const { data: userData } = await supabase.auth.getUser();
    const professionalId = userData?.user?.id;
    const account = await payoutApi.getCreatorAccount();
    const destination = method === 'upi' ? account.upiId : account.accountNumber + " (" + account.ifscCode + ")";
    const txRef = "pout_rzp_" + Math.floor(10000000 + Math.random() * 90000000);

    const newRecord: PayoutRecord = {
      id: "po-" + Date.now(),
      amount,
      method,
      destination,
      status: 'completed',
      createdAt: new Date().toISOString(),
      transactionRef: txRef,
    };

    if (professionalId) {
      try {
        await supabase.from('crew_payouts').insert([{
          professional_id: professionalId,
          amount,
          status: 'completed',
          reference_id: method + ":" + destination + ":" + txRef,
        }]);
      } catch (err) {
        console.warn('Remote payout insert failed, saving locally:', err);
      }
    }

    try {
      const history = await payoutApi.getPayoutHistory();
      const updated = [newRecord, ...history];
      localStorage.setItem(PAYOUT_HISTORY_KEY, JSON.stringify(updated));
    } catch {}

    return newRecord;
  },
};
