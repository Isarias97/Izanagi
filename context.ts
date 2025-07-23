import React from 'react';
import { AppState, Worker } from './types';
import { getInitialState } from './state';

export const DataContext = React.createContext<{
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showNotification: (title: string, message: string, isError?: boolean) => void;
  currentUser: Worker | null;
  logout: () => void;
}>({
  state: getInitialState(),
  setState: () => {},
  showNotification: () => {},
  currentUser: null,
  logout: () => {},
});