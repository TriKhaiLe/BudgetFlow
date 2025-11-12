'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';
import type { BudgetState, MoneySource, Transaction, FeaturedTransaction } from '@/lib/types';
import { parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { format, startOfMonth } from 'date-fns';

const STORAGE_KEY = 'budgetFlowState';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: BudgetState }
  | { type: 'ADD_MONEY_SOURCE'; payload: Omit<MoneySource, 'id' | 'spent'> }
  | { type: 'UPDATE_MONEY_SOURCE'; payload: MoneySource }
  | { type: 'DELETE_MONEY_SOURCE'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> & { affectBalance: boolean } }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_FEATURED_TRANSACTION'; payload: Omit<FeaturedTransaction, 'id'|'date'> }
  | { type: 'DELETE_FEATURED_TRANSACTION'; payload: string }
  | { type: 'IMPORT_DATA'; payload: { state: BudgetState; strategy: 'REPLACE' | 'NEXT_MONTH' } }
  | { type: 'ADJUST_BALANCE'; payload: { moneySourceId: string; newBalance: number } }
  | { type: 'SET_CURRENT_MONTH'; payload: Date };

const initialState: BudgetState = {
  moneySources: [],
  transactions: [],
  featuredTransactions: [],
  history: [],
  currentMonth: startOfMonth(new Date()).toISOString(),
};

const budgetReducer = (state: BudgetState, action: Action): BudgetState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return action.payload;

    case 'SET_CURRENT_MONTH':
      return {
        ...state,
        currentMonth: action.payload.toISOString(),
         history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Changed budget month to ${format(action.payload, 'MMMM yyyy')}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case 'ADD_MONEY_SOURCE': {
      const newSource: MoneySource = {
        ...action.payload,
        id: crypto.randomUUID(),
        spent: 0,
      };
      return {
        ...state,
        moneySources: [...state.moneySources, newSource],
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Created money source: ${newSource.name}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    
    case 'UPDATE_MONEY_SOURCE': {
      return {
        ...state,
        moneySources: state.moneySources.map(ms => ms.id === action.payload.id ? action.payload : ms),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Updated money source: ${action.payload.name}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case 'ADJUST_BALANCE': {
      const { moneySourceId, newBalance } = action.payload;
      const source = state.moneySources.find(ms => ms.id === moneySourceId);
      if (!source) return state;
      
      const oldBalance = source.balance;
      const difference = newBalance - oldBalance;

      return {
        ...state,
        moneySources: state.moneySources.map(ms =>
          ms.id === moneySourceId
            ? { ...ms, balance: newBalance, spent: ms.budget - newBalance }
            : ms
        ),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Adjusted balance for ${source.name} from ${formatCurrency(oldBalance)} to ${formatCurrency(newBalance)} (Difference: ${difference > 0 ? '+' : ''}${formatCurrency(difference)}).`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }


    case 'DELETE_MONEY_SOURCE': {
        const sourceToDelete = state.moneySources.find(ms => ms.id === action.payload);
        if (!sourceToDelete) return state;

        return {
            ...state,
            moneySources: state.moneySources.filter(ms => ms.id !== action.payload),
            transactions: state.transactions.filter(t => t.moneySourceId !== action.payload),
            history: [
                ...state.history,
                {
                    id: crypto.randomUUID(),
                    description: `Deleted money source: ${sourceToDelete.name} and its transactions.`,
                    timestamp: new Date().toISOString(),
                },
            ],
        };
    }

    case 'ADD_TRANSACTION': {
      const { affectBalance, ...transactionPayload } = action.payload;
      const newTransaction: Transaction = {
        ...transactionPayload,
        id: crypto.randomUUID(),
      };
      const { amount, moneySourceId, type } = newTransaction;
      const signedAmount = type === 'income' ? amount : -amount;

      return {
        ...state,
        transactions: [newTransaction, ...state.transactions],
        moneySources: state.moneySources.map(ms => {
            if (ms.id !== moneySourceId) return ms;

            const newBalance = affectBalance ? ms.balance + signedAmount : ms.balance;
            const newSpent = type === 'expense' ? ms.spent + amount : ms.spent;
            const newBudget = type === 'income' ? ms.budget + amount : ms.budget;

            return { ...ms, balance: newBalance, spent: newSpent, budget: newBudget };
        }),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Transaction: ${newTransaction.description || 'Untitled'} (${signedAmount > 0 ? '+' : ''}${formatCurrency(signedAmount)})`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case 'UPDATE_TRANSACTION': {
        // This logic would need to be significantly more complex to handle all edge cases
        // of changing amounts, types, and money sources. For now, we'll just log an update.
        // A full implementation would reverse the old transaction and apply the new one.
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Updated transaction: ${action.payload.description}. Manual balance check recommended.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case 'DELETE_TRANSACTION': {
      const { amount, moneySourceId, type, description } = action.payload;
      // This is a simplification. A real implementation should check if the original transaction affected the balance.
      // For now, we assume it did to reverse it correctly. This could be improved by storing `affectBalance` on the transaction object itself.
      const signedAmount = type === 'income' ? amount : -amount;
      
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload.id),
        moneySources: state.moneySources.map(ms =>
          ms.id === moneySourceId
            ? {
                ...ms,
                balance: ms.balance - signedAmount,
                budget: ms.budget - (type === 'income' ? amount : 0),
                spent: type === 'expense' ? ms.spent - amount : ms.spent,
              }
            : ms
        ),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Deleted transaction: ${description}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    
    case 'ADD_FEATURED_TRANSACTION': {
      const newFeatured: FeaturedTransaction = {
          ...action.payload,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
      };
      return {
          ...state,
          featuredTransactions: [newFeatured, ...state.featuredTransactions],
          history: [
              ...state.history,
              {
                  id: crypto.randomUUID(),
                  description: `Added featured transaction: ${newFeatured.description || 'Untitled'}`,
                  timestamp: new Date().toISOString(),
              },
          ],
      };
    }

    case 'DELETE_FEATURED_TRANSACTION': {
        const toDelete = state.featuredTransactions.find(ft => ft.id === action.payload);
        if (!toDelete) return state;
        return {
            ...state,
            featuredTransactions: state.featuredTransactions.filter(ft => ft.id !== action.payload),
            history: [
                ...state.history,
                {
                    id: crypto.randomUUID(),
                    description: `Removed featured transaction: ${toDelete.description}`,
                    timestamp: new Date().toISOString(),
                },
            ],
        };
    }

    case 'IMPORT_DATA': {
        const { state: importedState, strategy } = action.payload;
        if (strategy === 'REPLACE') {
            return {
                ...importedState,
                history: [
                    ...(importedState.history || []),
                    {
                        id: crypto.randomUUID(),
                        description: `Data imported and replaced.`,
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
        if (strategy === 'NEXT_MONTH') {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return {
                ...initialState,
                currentMonth: startOfMonth(nextMonth).toISOString(),
                moneySources: importedState.moneySources.map(ms => ({
                    ...ms,
                    budget: ms.balance,
                    spent: 0,
                })),
                history: [
                    {
                        id: crypto.randomUUID(),
                        description: `Data imported for next month. Budgets set from previous balances, spending reset.`,
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
        return state;
    }

    default:
      return state;
  }
};

const BudgetContext = createContext<{ state: BudgetState; dispatch: Dispatch<Action> } | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState) as BudgetState;
        
        // --- Backward compatibility migrations ---
        if (!parsedState.currentMonth) {
            parsedState.currentMonth = startOfMonth(new Date()).toISOString();
        }
        if (parsedState.transactions) {
          parsedState.transactions = parsedState.transactions.map((t: any) => ({
            ...t,
            type: t.type || (t.amount > 0 ? 'income' : 'expense'),
            amount: Math.abs(t.amount)
          }));
        }
         if (!parsedState.featuredTransactions) {
            parsedState.featuredTransactions = [];
        }
        if (!parsedState.history) {
            parsedState.history = [];
        }

        dispatch({ type: 'SET_INITIAL_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
      // If parsing fails, start with a clean slate
      dispatch({ type: 'SET_INITIAL_STATE', payload: initialState });
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
    }
  }, [state, isInitialized]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {isInitialized ? children : <div className="flex h-screen items-center justify-center">Loading Budget...</div>}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
