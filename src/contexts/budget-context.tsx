'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';
import type { BudgetState, MoneySource, Transaction, FeaturedTransaction } from '@/lib/types';

const STORAGE_KEY = 'budgetFlowState';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: BudgetState }
  | { type: 'ADD_MONEY_SOURCE'; payload: Omit<MoneySource, 'id' | 'spent'> }
  | { type: 'UPDATE_MONEY_SOURCE'; payload: MoneySource }
  | { type: 'DELETE_MONEY_SOURCE'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id' | 'date'> }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_FEATURED_TRANSACTION'; payload: Omit<FeaturedTransaction, 'id'|'date'> }
  | { type: 'DELETE_FEATURED_TRANSACTION'; payload: string }
  | { type: 'IMPORT_DATA'; payload: { state: BudgetState; strategy: 'REPLACE' | 'NEXT_MONTH' } };

const initialState: BudgetState = {
  moneySources: [],
  transactions: [],
  featuredTransactions: [],
  history: [],
};

const budgetReducer = (state: BudgetState, action: Action): BudgetState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return action.payload;

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
      const newTransaction: Transaction = {
        ...action.payload,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      };
      const { amount, moneySourceId } = newTransaction;

      return {
        ...state,
        transactions: [newTransaction, ...state.transactions],
        moneySources: state.moneySources.map(ms =>
          ms.id === moneySourceId
            ? {
                ...ms,
                balance: ms.balance + amount,
                spent: amount < 0 ? ms.spent - amount : ms.spent,
              }
            : ms
        ),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Transaction: ${newTransaction.description} (${amount > 0 ? '+' : ''}${amount})`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case 'UPDATE_TRANSACTION': {
      const oldTransaction = state.transactions.find(t => t.id === action.payload.id);
      if (!oldTransaction) return state;

      const amountDiff = action.payload.amount - oldTransaction.amount;
      const spentDiff = (action.payload.amount < 0 ? -action.payload.amount : 0) - (oldTransaction.amount < 0 ? -oldTransaction.amount : 0);
      
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t),
        moneySources: state.moneySources.map(ms => {
          if (ms.id === action.payload.moneySourceId && ms.id === oldTransaction.moneySourceId) {
            return { ...ms, balance: ms.balance + amountDiff, spent: ms.spent + spentDiff };
          }
          if (ms.id === oldTransaction.moneySourceId) {
            return { ...ms, balance: ms.balance - oldTransaction.amount, spent: oldTransaction.amount < 0 ? ms.spent + oldTransaction.amount : ms.spent };
          }
          if (ms.id === action.payload.moneySourceId) {
            return { ...ms, balance: ms.balance + action.payload.amount, spent: action.payload.amount < 0 ? ms.spent - action.payload.amount : ms.spent };
          }
          return ms;
        }),
        history: [
          ...state.history,
          {
            id: crypto.randomUUID(),
            description: `Updated transaction: ${action.payload.description}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case 'DELETE_TRANSACTION': {
      const { amount, moneySourceId, description } = action.payload;
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload.id),
        moneySources: state.moneySources.map(ms =>
          ms.id === moneySourceId
            ? {
                ...ms,
                balance: ms.balance - amount,
                spent: amount < 0 ? ms.spent + amount : ms.spent,
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
                  description: `Added featured transaction: ${newFeatured.description}`,
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
                    ...importedState.history,
                    {
                        id: crypto.randomUUID(),
                        description: `Data imported and replaced.`,
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
        if (strategy === 'NEXT_MONTH') {
            return {
                moneySources: importedState.moneySources.map(ms => ({
                    ...ms,
                    spent: 0,
                })),
                transactions: [],
                featuredTransactions: [],
                history: [
                    {
                        id: crypto.randomUUID(),
                        description: `Data imported for next month. Budgets kept, spending reset.`,
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
        dispatch({ type: 'SET_INITIAL_STATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
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
